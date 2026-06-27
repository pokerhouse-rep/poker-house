# Etapa 16 — Definição da Segurança

---

## 1. Autenticação

### JWT (JSON Web Token)

```
Header: { alg: "HS256", typ: "JWT" }
Payload: {
  sub: "user_id",
  org: "organization_id",
  tipo: "ADMIN" | "FUNCIONARIO" | "JOGADOR",
  roles: ["admin", "gerente"],
  iat: timestamp,
  exp: timestamp
}
```

| Parâmetro | Valor |
|-----------|-------|
| Algoritmo | HS256 (HMAC SHA-256) |
| Access Token TTL | Configurável por casa (padrão: 8h funcionários, 24h jogadores) |
| Refresh Token TTL | 30 dias |
| Armazenamento client | httpOnly cookie (access token) + secure cookie (refresh token) |
| Rotação | Refresh token é invalidado ao ser usado (rotation) |

### Fluxo de Autenticação

```
1. Login → valida credenciais → gera access + refresh token
2. Cada request → envia access token via cookie httpOnly
3. Access token expira → client usa refresh token para renovar
4. Refresh token usado → novo par (access + refresh) emitido, antigo invalidado
5. Logout → invalida todos os tokens do usuário
6. Senha alterada → invalida todos os tokens do usuário
```

### Proteção contra Brute Force

```
Tentativas de login:
  1-3: normal
  4: delay de 5 segundos na resposta
  5: bloqueia conta por 15 minutos
  6+: bloqueia conta até desbloqueio manual pelo admin

Rate limit no endpoint de login:
  5 requests/minuto por IP
  20 requests/hora por IP

Registro em AuditLog de TODAS as tentativas (sucesso e falha)
```

### Senhas

```
Hashing: bcrypt com salt rounds = 12
Requisitos mínimos:
  - 8 caracteres
  - 1 letra maiúscula
  - 1 número
  - Não pode ser igual ao CPF ou e-mail

Senha temporária: gerada pelo admin ao criar acesso do jogador
Primeiro login: NÃO obriga troca (opcional, configurável pela casa)
```

---

## 2. Autorização

### Camadas de Proteção

```
Camada 1: Auth Middleware
  → Toda request autenticada passa
  → Extrai user_id, organization_id, tipo, roles do JWT
  → Rejeita tokens expirados ou inválidos

Camada 2: Tenant Middleware
  → Injeta organization_id no contexto
  → TODA query ao banco inclui WHERE organization_id = ?
  → Impossível acessar dados de outra organização

Camada 3: RBAC Middleware
  → Verifica se o role do usuário tem permissão para a ação
  → Consulta permissions JSON do role
  → Rejeita se não autorizado (403 Forbidden)

Camada 4: Ownership Check (para jogadores)
  → Jogador só acessa recursos próprios (user_id = ?)
  → Verificado no service layer
```

### Verificação no Código

```typescript
// Middleware tRPC
const rbacMiddleware = (requiredPermission: string) => {
  return t.middleware(async ({ ctx, next }) => {
    const [modulo, acao] = requiredPermission.split(":");
    
    // Admin tem tudo
    if (ctx.user.tipo === "ADMIN") return next();
    
    // Verifica nas roles do usuário
    const hasPermission = ctx.user.roles.some(role =>
      role.permissions.some(p =>
        p.modulo === modulo && p.acoes[acao] === true
      )
    );
    
    if (!hasPermission) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    
    return next();
  });
};
```

---

## 3. Isolamento Multi-Tenant

### Nível 1: Aplicação (Prisma Middleware)

```typescript
// Middleware global do Prisma — executado em TODA query
prisma.$use(async (params, next) => {
  const orgId = getOrgIdFromContext();
  
  // Injetar filtro em reads
  if (["findMany", "findFirst", "findUnique", "count", "aggregate"].includes(params.action)) {
    params.args.where = {
      ...params.args.where,
      organization_id: orgId
    };
  }
  
  // Injetar org_id em creates
  if (["create", "createMany"].includes(params.action)) {
    params.args.data.organization_id = orgId;
  }
  
  // Injetar filtro em updates e deletes
  if (["update", "updateMany", "delete", "deleteMany"].includes(params.action)) {
    params.args.where = {
      ...params.args.where,
      organization_id: orgId
    };
  }
  
  return next(params);
});
```

### Nível 2: Banco de Dados (Row Level Security)

```sql
-- Política RLS como segunda barreira
-- Aplicada em TODAS as tabelas com organization_id

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Antes de cada request, o backend seta:
SET LOCAL app.current_org_id = 'uuid-da-org';
```

### Nível 3: Validação de Propriedade

```
Antes de qualquer UPDATE ou DELETE:
1. Busca o registro
2. Verifica se organization_id do registro == organization_id do JWT
3. Se diferente → 404 (não 403, para não revelar existência)
```

### Testes de Isolamento

```
Teste automatizado obrigatório:
- Criar dados na Org A
- Tentar acessar pela Org B
- Deve retornar vazio (não erro, para não revelar)
- Rodar em cada tabela do sistema
```

---

## 4. Proteção contra Ataques

### SQL Injection
```
Mitigação: Prisma ORM (queries parametrizadas)
Para raw queries: prisma.$queryRaw com tagged template literals
NUNCA concatenar strings em queries
```

### XSS (Cross-Site Scripting)
```
Mitigação:
- React escapa output por padrão
- Cookies httpOnly (JS não acessa)
- Content-Security-Policy header
- Sanitização de inputs que aceitam texto livre (observações, mensagens)
- Nunca usar dangerouslySetInnerHTML
```

### CSRF (Cross-Site Request Forgery)
```
Mitigação:
- Cookies SameSite=Strict
- Token CSRF em mutations
- Verificar Origin header
```

### Rate Limiting
```
Por IP:
- Login: 5/min
- API geral: 100/min
- Exports/relatórios: 5/min

Por usuário:
- Mutations: 30/min
- Queries: 60/min

Por tenant:
- Total: 1000/min (evita que um tenant degrade o serviço para outros)
```

### DDoS
```
Mitigação:
- Vercel Edge Network (CDN com proteção DDoS)
- Rate limiting por IP
- Bloqueio de IPs suspeitos
- Cloudflare como WAF (opcional, futuro)
```

### Enumeração de Usuários
```
Mitigação:
- Login retorna mensagem genérica: "Credenciais inválidas"
  (nunca "Usuário não encontrado" ou "Senha incorreta")
- Reset de senha: "Se o e-mail existir, enviaremos um link"
- Tempos de resposta constantes (evitar timing attacks)
```

---

## 5. Proteção de Dados Sensíveis

### Dados em Trânsito
```
- HTTPS obrigatório (TLS 1.3)
- HSTS header (Strict-Transport-Security)
- Certificado SSL automático via Vercel
```

### Dados em Repouso
```
- Senhas: bcrypt (hash + salt, rounds = 12)
- CPF: armazenado como texto (necessário para login)
- Dados pessoais: anonimizáveis via LGPD
- Supabase: criptografia em repouso nativa (AES-256)
- Backups: criptografados
```

### Dados no Client
```
- Tokens em httpOnly cookies (não localStorage)
- Nenhum dado sensível no localStorage/sessionStorage
- Cache de dados sensíveis invalidado no logout
```

### Logs e Monitoramento
```
NUNCA logar:
- Senhas (nem hash)
- Tokens completos (apenas últimos 4 caracteres)
- CPF completo (mascarar: ***.***.***-XX)
- Números de cartão

Sentry:
- Configurar scrubbing de dados sensíveis
- Filtrar headers de autenticação
```

---

## 6. LGPD (Lei Geral de Proteção de Dados)

### Dados Pessoais Coletados
```
- Nome completo
- CPF
- E-mail
- Telefone
- Data de nascimento
- Endereço
- Foto
- IP de acesso
- Dados de navegação (user agent)
```

### Base Legal
```
- Execução de contrato (jogador se cadastra para usar o serviço da casa)
- Obrigação legal (dados financeiros para fins fiscais)
- Legítimo interesse (auditoria, segurança)
```

### Direitos do Titular

| Direito | Implementação |
|---------|--------------|
| Acesso | Portal do jogador — ver todos os seus dados |
| Retificação | Portal do jogador — editar dados pessoais |
| Eliminação | Anonimização (dados pessoais removidos, financeiro mantido) |
| Portabilidade | Export dos dados em JSON/CSV |
| Revogação | Jogador pode desativar conta a qualquer momento |

### Processo de Exclusão (Anonimização)

```
1. Jogador solicita exclusão
2. Sistema verifica pendências (contas abertas, saldo)
3. Se livre de pendências:
   a. nome → "Jogador Removido #hash"
   b. cpf → NULL
   c. email → NULL
   d. telefone → NULL
   e. endereco → NULL
   f. data_nascimento → NULL
   g. foto → removida do Storage
   h. nickname → NULL
   i. observacoes → NULL
   j. tags → []
   k. status → INATIVO
   l. senha_hash → invalidada
4. Mantém: user_id (FK), LedgerTransactions, AuditLogs, RankingEntries
5. AuditLog registra a anonimização
6. Processo irreversível
```

### Retenção de Dados

| Tipo | Retenção |
|------|----------|
| Dados pessoais | Até solicitação de exclusão |
| Dados financeiros (Ledger) | Indefinido (obrigação fiscal) |
| Auditoria | Indefinido (nunca apaga) |
| Logs de acesso | 1 ano |
| Backups | 90 dias (depois rotacionados) |

---

## 7. Prevenção contra Fraude

### Fraudes Potenciais no Contexto de Poker

| Risco | Mitigação |
|-------|-----------|
| Funcionário registra buy-in e embolsa dinheiro | Conciliação de caixa obrigatória + auditoria |
| Funcionário cria jogador fantasma para desviar prêmios | Auditoria + CPF obrigatório + relatório de jogadores sem presença |
| Alteração de resultado de torneio | Ledger imutável + auditoria com valores antigos/novos |
| Manipulação de saldo da carteira | Saldos são cache do Ledger, recalculáveis |
| Estorno indevido para beneficiar jogador | Estorno só admin/gerente + motivo obrigatório + auditoria |
| Manipulação de rake | Rake registrado com transaction no Ledger + conciliação |
| Desvio de sangria | Sangria só admin/gerente + motivo + auditoria |

### Alertas Automáticos

```
- Diferença de caixa acima de X reais
- Desbalanceamento de fichas na mesa de cash
- Volume anormal de estornos por um funcionário
- Jogador com volume de créditos manuais acima do normal
- Tentativas de login de IP incomum
- Funcionário acessando fora do horário habitual
```

---

## 8. Backup e Recuperação de Desastres

### Estratégia de Backup

```
Supabase (automático):
- Point-in-time recovery (PITR): últimas 24h
- Backups diários: retidos por 7 dias (plano Pro)
- Backups semanais: retidos por 30 dias

Backup adicional (recomendado):
- pg_dump diário para Storage externo (S3/GCS)
- Retido por 90 dias
- Testado mensalmente (restore em ambiente de teste)
```

### RPO e RTO

```
RPO (Recovery Point Objective): < 1 hora
  → Perda máxima de dados: 1 hora de transações

RTO (Recovery Time Objective): < 4 horas
  → Tempo máximo para restaurar o sistema

Para Ledger (dados financeiros):
  RPO: 0 (sem perda tolerável)
  → Transações confirmadas com COMMIT são persistidas imediatamente
  → PITR garante recuperação até o último segundo
```

### Plano de Recuperação

```
Cenário 1: Banco corrompido
  → Restore do PITR mais recente
  → Verificar integridade do Ledger
  → Comunicar casas afetadas

Cenário 2: Aplicação fora do ar
  → Vercel tem deploy automático
  → Rollback para versão anterior em 1 clique
  → Zero downtime deployment

Cenário 3: Supabase fora do ar
  → Supabase tem SLA de 99.9%
  → Em caso extremo: migrar para PostgreSQL self-hosted com backup
  → DNS aponta para novo servidor

Cenário 4: Dados deletados acidentalmente
  → PITR para restaurar tabelas específicas
  → Ledger e Audit nunca aceitam DELETE (proteção extra)
```

---

## 9. Headers de Segurança

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 10. Checklist de Segurança para Deploy

```
[ ] HTTPS obrigatório
[ ] Cookies httpOnly e SameSite=Strict
[ ] Rate limiting configurado
[ ] CORS restrito aos domínios permitidos
[ ] Environment variables sem hardcode
[ ] Sentry com scrubbing de dados sensíveis
[ ] RLS habilitado em todas as tabelas
[ ] Prisma middleware de tenant ativo
[ ] Backups testados
[ ] Logs de acesso ativos
[ ] Headers de segurança configurados
[ ] Testes de isolamento multi-tenant passando
[ ] Dependências sem vulnerabilidades conhecidas (npm audit)
[ ] Service role key NUNCA exposta ao client
```
