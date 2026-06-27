# Etapa 7 — Arquitetura Geral do Sistema

## Decisão: Monólito Modular

Para este projeto, a arquitetura recomendada é **Monólito Modular** — NÃO microsserviços.

### Justificativa

| Critério | Monólito Modular | Microsserviços |
|----------|-----------------|----------------|
| Complexidade inicial | Baixa | Alta |
| Custo de infraestrutura | Baixo | Alto |
| Velocidade de desenvolvimento | Rápida | Lenta |
| Consistência transacional (Ledger) | Nativa | Saga pattern (complexo) |
| Equipe necessária | 1-3 devs | 5+ devs |
| Deploy | Simples | Orquestração complexa |
| Escalabilidade | Vertical + horizontal com réplicas | Horizontal por serviço |
| Migração futura | Pode extrair módulos depois | Já nasce distribuído |

**Por que NÃO microsserviços:**
1. O Ledger exige consistência transacional forte — transações financeiras que envolvem carteira, conta corrente e caixa precisam ser atômicas. Em microsserviços, isso exigiria Saga Pattern, compensações e eventual consistency — complexidade desproporcional ao benefício.
2. Com 100 casas no primeiro ano, a carga não justifica a complexidade distribuída.
3. Equipe inicial pequena — microsserviços exigem mais pessoas para manter.

**Caminho de evolução:**
Quando chegar a 1.000 casas, os módulos mais pesados (Tournament Display / Real-time, Notificações, Relatórios) podem ser extraídos como serviços independentes. A arquitetura modular facilita essa extração.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTES                              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │  Portal  │  │Tournament│  │  Dealer  │   │
│  │  (Web)   │  │ Jogador  │  │ Display  │  │  (Web)   │   │
│  │ Desktop  │  │(PWA/Mob) │  │(TV/Full) │  │  Mobile  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
└───────┼──────────────┼──────────────┼──────────────┼─────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CDN / LOAD BALANCER                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  APLICAÇÃO (Monólito Modular)                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    API Layer                         │    │
│  │         REST API + WebSocket Server                  │    │
│  │    Auth Middleware │ Tenant Middleware │ RBAC         │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                             │                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Service Layer                       │    │
│  │                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │ Auth    │ │ Player  │ │ Tourna- │ │  Cash   │  │    │
│  │  │ Module  │ │ Module  │ │  ment   │ │  Game   │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  │                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │ Ledger  │ │ Wallet  │ │ Account │ │  Cash   │  │    │
│  │  │ Module  │ │ Module  │ │ Module  │ │Register │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  │                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │   Bar   │ │ Ranking │ │  Noti-  │ │  Audit  │  │    │
│  │  │ Module  │ │ Module  │ │fication │ │ Module  │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  │                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│  │  │WhatsApp │ │Template │ │ Config  │ │Loyalty  │  │    │
│  │  │ Module  │ │ Module  │ │ Module  │ │ Module  │  │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │    │
│  │                                                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐               │    │
│  │  │Display  │ │Presence │ │ Report  │               │    │
│  │  │ Module  │ │ Module  │ │ Module  │               │    │
│  │  └─────────┘ └─────────┘ └─────────┘               │    │
│  └─────────────────────────────────────────────────────┘    │
│                             │                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Event Bus (Interno)                   │    │
│  │          Pub/Sub in-process para eventos              │    │
│  │     (EventEmitter ou lib de mediator pattern)         │    │
│  └─────────────────────────────────────────────────────┘    │
│                             │                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Data Access Layer                      │    │
│  │                  ORM / Query Builder                  │    │
│  │              Tenant Filter automático                 │    │
│  └─────────────────────────┬───────────────────────────┘    │
│                             │                                │
└─────────────────────────────┼───────────────────────────────┘
                              │
        ┌─────────────────────┼────────────────────┐
        │                     │                    │
        ▼                     ▼                    ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │   │   Storage    │
│   (Primary)  │   │   (Cache +   │   │   (Fotos,    │
│              │   │  Pub/Sub RT) │   │   Logos,     │
│  - Dados     │   │              │   │   PDFs)      │
│  - Ledger    │   │  - Sessions  │   │              │
│  - Audit     │   │  - Cache     │   │              │
│              │   │  - Real-time │   │              │
│              │   │  - Pub/Sub   │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## Camadas da Aplicação

### 1. API Layer (Entrada)
- Recebe requisições HTTP (REST) e conexões WebSocket
- **Auth Middleware:** valida JWT, identifica usuário
- **Tenant Middleware:** identifica a organização e injeta organization_id em TODA query
- **RBAC Middleware:** verifica permissões do usuário para a ação solicitada
- **Rate Limiting:** proteção contra abuso
- **Validation:** valida input antes de chegar ao service

### 2. Service Layer (Lógica de Negócio)
- Cada módulo encapsula suas regras de negócio
- Módulos se comunicam via **Event Bus interno** (não chamam diretamente)
- Exemplo de fluxo:
  ```
  BuyinRealizado (TournamentModule)
    → LedgerModule.registrarTransacao()
    → WalletModule.recalcularSaldo()
    → CashRegisterModule.atualizarCaixa()
    → NotificationModule.notificar()
    → AuditModule.registrarLog()
    → DisplayModule.atualizarTela()
  ```
- Transações que envolvem Ledger são **atômicas** (database transaction)

### 3. Event Bus (Comunicação entre Módulos)
- In-process (não é fila externa — é dentro da aplicação)
- Padrão Mediator/Observer
- Cada módulo publica eventos e assina eventos de outros módulos
- Garante desacoplamento entre módulos
- Pode evoluir para fila externa (Redis/RabbitMQ) quando necessário

### 4. Data Access Layer (Banco de Dados)
- ORM com query builder
- **Tenant filter automático:** TODA query recebe organization_id automaticamente via middleware/scope global
- Nenhum módulo acessa o banco sem passar pelo filtro de tenant
- Transações financeiras usam database transactions (BEGIN/COMMIT/ROLLBACK)

---

## Estratégia Multi-Tenant

### Abordagem: Banco Compartilhado com Discriminador (organization_id)

| Estratégia | Prós | Contras |
|------------|------|---------|
| **DB por tenant** | Isolamento total | Custo alto, migrações complexas |
| **Schema por tenant** | Bom isolamento | Migrações complexas, conexões |
| **Tabela compartilhada + org_id** ✅ | Simples, barato, escalável | Precisa de disciplina no filtro |

**Escolha: Tabela compartilhada com organization_id em TODAS as tabelas.**

Proteções:
1. **Middleware automático:** injeta organization_id em toda query
2. **Row Level Security (RLS):** no PostgreSQL, como segunda barreira
3. **Índices compostos:** (organization_id, ...) em todas as tabelas
4. **Testes automatizados:** validam que nenhuma query vaza dados entre tenants
5. **Audit log:** registra toda operação com organization_id

---

## Estratégia de Tempo Real

### WebSocket para:
- Tournament Display (blinds, timer, jogadores, prize pool)
- Dashboard de operação (mesas, torneios, caixas)
- Carteira do jogador (saldo atualizado)
- Notificações (push interno)
- Ranking (atualizações em tempo real)
- Lista de espera do cash (visível na TV)

### Arquitetura:
```
Evento no sistema (ex: BuyinRealizado)
    → Event Bus interno
    → DisplayModule / NotificationModule
    → Redis Pub/Sub
    → WebSocket Server
    → Clientes conectados (TVs, browsers, PWA)
```

### Canais WebSocket por tenant:
```
org:{org_id}:tournament:{tournament_id}   → Display do torneio
org:{org_id}:dashboard                     → Dashboard operacional
org:{org_id}:player:{player_id}:wallet    → Carteira do jogador
org:{org_id}:player:{player_id}:notif     → Notificações
org:{org_id}:ranking:{ranking_id}         → Ranking
org:{org_id}:cash:waitlist                → Lista de espera
```

Cada canal é isolado por organization_id — impossível um tenant receber dados de outro.

---

## Fluxo de uma Operação Típica (Buy-in)

```
1. Funcionário clica "Registrar Buy-in" no front-end
2. POST /api/tournaments/:id/entries
3. Auth Middleware → valida JWT
4. Tenant Middleware → injeta organization_id
5. RBAC Middleware → verifica permissão "torneio:inscrever"
6. Validation → valida dados de entrada
7. TournamentService.registrarBuyin()
   │
   │  BEGIN TRANSACTION
   │  ├── Verifica se torneio está aberto para inscrições
   │  ├── Verifica se jogador não está inscrito
   │  ├── Cria TournamentEntry
   │  ├── Cria LedgerTransaction (débito buy-in)
   │  ├── Cria LedgerTransaction (receita rake)
   │  ├── Cria LedgerTransaction (receita chip dealer)
   │  ├── Atualiza Wallet (cache de saldo) OU cria AccountItem
   │  ├── Atualiza CashRegister
   │  └── Cria AuditLog
   │  COMMIT
   │
   │  Após commit (async, não bloqueia resposta):
   │  ├── Emite evento "BuyinRealizado"
   │  ├── NotificationModule → cria notificação
   │  ├── DisplayModule → atualiza Tournament Display via WebSocket
   │  └── RankingModule → (nada ainda, torneio não finalizou)
   │
8. Response 201 → { entry, transaction }
9. Front-end atualiza interface
10. TVs atualizam automaticamente via WebSocket
```

---

## Segurança por Camada

```
┌───────────────────────────────┐
│  CDN / WAF                    │  DDoS protection, rate limiting
├───────────────────────────────┤
│  HTTPS / TLS                  │  Criptografia em trânsito
├───────────────────────────────┤
│  Auth Middleware (JWT)        │  Identifica usuário
├───────────────────────────────┤
│  Tenant Middleware            │  Isola organização
├───────────────────────────────┤
│  RBAC Middleware              │  Verifica permissão
├───────────────────────────────┤
│  Input Validation             │  Previne injection, XSS
├───────────────────────────────┤
│  Service Layer                │  Regras de negócio
├───────────────────────────────┤
│  ORM + Parameterized Queries  │  Previne SQL injection
├───────────────────────────────┤
│  RLS (PostgreSQL)             │  Última barreira de isolamento
├───────────────────────────────┤
│  Audit Log                    │  Rastreabilidade total
└───────────────────────────────┘
```
