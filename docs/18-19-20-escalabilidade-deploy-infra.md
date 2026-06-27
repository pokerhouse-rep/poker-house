# Etapas 18, 19, 20 — Escalabilidade, Deploy e Infraestrutura

---

## Etapa 18 — Escalabilidade

### Projeção de Crescimento

| Métrica | Ano 1 | Ano 3 |
|---------|-------|-------|
| Casas | 100 | 1.000 |
| Jogadores por casa | 150-500 | 150-500 |
| Jogadores totais | ~50.000 | ~500.000 |
| Funcionários totais | ~1.000 | ~10.000 |
| Transações Ledger/dia | ~50.000 | ~500.000 |
| Transações Ledger acumuladas | ~18M | ~540M |
| Conexões WebSocket simultâneas | ~2.000 | ~20.000 |
| Requests/segundo (pico) | ~100 | ~1.000 |

### Estratégias por Camada

#### Aplicação (Next.js + Vercel)
```
Ano 1 (100 casas):
- Vercel Serverless Functions
- Auto-scaling nativo (Vercel gerencia)
- Sem preocupação manual

Ano 3 (1.000 casas):
- Vercel Pro/Enterprise
- Edge Functions para rotas leves (display, consultas)
- Se necessário: extrair WebSocket server para serviço dedicado
```

#### Banco de Dados (PostgreSQL / Supabase)
```
Ano 1:
- Supabase Pro (8GB RAM, 100GB storage)
- Connection pooling (PgBouncer incluso no Supabase)
- Índices otimizados

Ano 2-3:
- Supabase Enterprise OU migração para RDS/Cloud SQL
- Read replicas para queries de relatórios
- Particionamento da tabela ledger_transactions por mês:
    CREATE TABLE ledger_transactions_2025_01 PARTITION OF ledger_transactions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
- Particionamento da tabela audit_logs por mês
- Connection pooling aumentado (100+ conexões)

Estratégia de particionamento (quando necessário):
- ledger_transactions → por mês (volume principal)
- audit_logs → por mês
- notifications → por mês (com TTL para limpeza)
- Demais tabelas: índices são suficientes
```

#### Cache (Redis / Upstash)
```
Dados cacheados:
- Saldos de carteira (invalidado a cada transação)
- Configurações da casa (invalidado ao alterar config)
- Ranking atual (invalidado ao recalcular)
- Sessão do usuário
- Estado do torneio para Display
- Permissões do usuário (invalidado ao alterar role)

TTL por tipo:
- Sessão: 8h (funcionário) / 24h (jogador)
- Config: 1 hora
- Ranking: 5 minutos
- Display: 10 segundos
- Saldo: 30 segundos
```

#### Real-time (Supabase Realtime)
```
Ano 1:
- Supabase Realtime suficiente
- Canais por tenant isolados

Ano 3 (se necessário):
- Extrair para serviço WebSocket dedicado (Socket.io + Redis Pub/Sub)
- Servidores WebSocket horizontalmente escaláveis (sticky sessions)
- Redis como broker entre instâncias
```

### Gargalos Potenciais e Mitigações

| Gargalo | Quando | Mitigação |
|---------|--------|-----------|
| Ledger table muito grande | > 100M registros | Particionamento por mês |
| Queries de relatório lentas | > 50M registros | Read replica + materialized views |
| Conexões DB esgotadas | > 500 conexões simultâneas | PgBouncer + connection pooling |
| WebSocket simultâneos | > 10.000 conexões | Serviço dedicado + horizontal scaling |
| Recalcular saldo de carteira | Jogador com milhares de transações | Cache + recalcular apenas delta |
| Recalcular ranking | Muitos torneios + jogadores | Background job + cache |

### Estratégia de Índices para Escala

```sql
-- Índices parciais para performance
CREATE INDEX idx_accounts_open 
  ON accounts (organization_id, jogador_id) 
  WHERE status = 'ABERTA';

CREATE INDEX idx_sessions_active 
  ON cash_sessions (cash_table_id) 
  WHERE status = 'ATIVA';

CREATE INDEX idx_tournaments_active 
  ON tournaments (organization_id) 
  WHERE status IN ('INSCRICOES_ABERTAS', 'EM_ANDAMENTO');

-- Índice para Ledger (tabela que mais cresce)
CREATE INDEX idx_ledger_player_period 
  ON ledger_transactions (organization_id, jogador_id, created_at DESC);

CREATE INDEX idx_ledger_daily 
  ON ledger_transactions (organization_id, dia_operacional, categoria);
```

---

## Etapa 19 — Estratégia de Deploy

### Ambientes

| Ambiente | Propósito | URL | Branch |
|----------|-----------|-----|--------|
| **Development** | Desenvolvimento local | localhost:3000 | feature/* |
| **Staging** | Homologação / testes | staging.pokerclub.com.br | develop |
| **Production** | Produção | app.pokerclub.com.br | main |

### Banco de Dados por Ambiente

| Ambiente | Banco |
|----------|-------|
| Development | Supabase local (Docker) ou projeto Supabase dev |
| Staging | Projeto Supabase separado (staging) |
| Production | Projeto Supabase produção |

### Fluxo de Deploy

```
Developer:
  1. Cria branch feature/XXX a partir de develop
  2. Desenvolve e testa localmente
  3. Push → CI roda lint + typecheck + tests
  4. Abre PR para develop
  5. Code review
  6. Merge → deploy automático para Staging

Staging:
  7. QA testa no ambiente staging
  8. Se aprovado → abre PR de develop para main
  9. Merge → deploy automático para Production

Production:
  10. Vercel faz deploy zero-downtime
  11. Migrações Prisma executadas antes do deploy
  12. Se erro → rollback automático (Vercel) + rollback migração
```

### Zero-Downtime Deploy

```
Vercel gerencia:
- Build da nova versão
- Health check
- Troca de tráfego (atomic swap)
- Versão anterior mantida para rollback instantâneo

Migrações:
- Devem ser backward-compatible
- Adicionar coluna → deploy → popular → próximo deploy remove coluna antiga
- Nunca remover coluna no mesmo deploy que altera código
```

### Estratégia de Branches

```
main          ← produção (protegida, só merge via PR)
develop       ← homologação (merge de features)
feature/XXX   ← desenvolvimento de funcionalidade
hotfix/XXX    ← correção urgente (branch de main, merge em main + develop)
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test
      - run: npx prisma validate

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - run: npx prisma migrate deploy  # migra staging
      # Vercel auto-deploy via integração

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - run: npx prisma migrate deploy  # migra produção
      # Vercel auto-deploy via integração
```

---

## Etapa 20 — Infraestrutura

### Visão Geral

```
┌─────────────────────────────────────────────────┐
│                  USUÁRIOS                        │
│    Admin (Desktop)  Jogador (PWA)  TV (Display)  │
└────────────────────┬────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────┐
│              VERCEL (CDN + Edge)                 │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Next.js   │  │   Edge     │  │  Static   │ │
│  │ Serverless │  │ Functions  │  │  Assets   │ │
│  │ Functions  │  │ (display)  │  │  (CDN)    │ │
│  └─────┬──────┘  └─────┬──────┘  └───────────┘ │
└────────┼───────────────┼────────────────────────┘
         │               │
         ▼               ▼
┌─────────────────────────────────────────────────┐
│              SUPABASE                            │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ PostgreSQL │  │  Realtime  │  │  Storage  │ │
│  │  (Dados)   │  │ (WebSocket)│  │ (Arquivos)│ │
│  │            │  │            │  │           │ │
│  │ PgBouncer  │  │  Channels  │  │  Buckets  │ │
│  │ (pooling)  │  │  por org   │  │ privados  │ │
│  └────────────┘  └────────────┘  └───────────┘ │
│                                                  │
│  ┌────────────┐  ┌────────────┐                 │
│  │    Auth    │  │   Edge     │                 │
│  │  (JWT)     │  │ Functions  │                 │
│  └────────────┘  └────────────┘                 │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              UPSTASH (Redis)                     │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Cache    │  │  Sessions  │  │   Rate    │ │
│  │ (saldos,   │  │  (JWT)     │  │  Limiting │ │
│  │  configs)  │  │            │  │           │ │
│  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│              MONITORAMENTO                       │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Sentry   │  │  Vercel    │  │  Supabase │ │
│  │  (Erros +  │  │ Analytics  │  │   Logs    │ │
│  │  Perf)     │  │            │  │           │ │
│  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────────────────────┘
```

### Serviços e Custos Estimados

| Serviço | Plano | Custo Estimado/mês | Uso |
|---------|-------|-------------------|-----|
| **Vercel** | Pro | $20 | Hosting, CDN, Serverless |
| **Supabase** | Pro | $25 | DB, Auth, Realtime, Storage |
| **Upstash Redis** | Pay-as-you-go | $0-10 | Cache, Sessions |
| **Sentry** | Team | $0-26 | Error tracking |
| **GitHub** | Free/Team | $0-4 | Repositório, CI/CD |
| **Domínio** | — | $40/ano | DNS |
| **Total Ano 1** | — | **~$75-85/mês** | — |

#### Escala (Ano 3 — 1.000 casas)

| Serviço | Plano | Custo Estimado/mês |
|---------|-------|-------------------|
| Vercel | Enterprise | $150-500 |
| Supabase | Team/Enterprise | $100-500 |
| Upstash | Pro | $50-100 |
| Sentry | Business | $80 |
| **Total Ano 3** | — | **$400-1.200/mês** |

### Domínios e DNS

```
app.pokerclub.com.br          → Vercel (aplicação principal)
staging.pokerclub.com.br      → Vercel (homologação)
display.pokerclub.com.br      → Vercel (Tournament Display - URL pública)
api.pokerclub.com.br          → Vercel (tRPC API - mesmo deploy)
```

### Storage (Supabase Storage)

| Bucket | Acesso | Conteúdo |
|--------|--------|----------|
| `logos` | Privado | Logos das casas |
| `avatars` | Privado | Fotos dos jogadores |
| `reports` | Privado | PDFs de relatórios gerados |
| `exports` | Privado | CSVs exportados (TTL 24h) |

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx    # NUNCA no client

# Database (Prisma)
DATABASE_URL=postgresql://...     # Connection string direta
DIRECT_URL=postgresql://...       # Sem pooling (migrações)

# Redis
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# Auth
JWT_SECRET=xxx
JWT_EXPIRATION=8h
REFRESH_TOKEN_EXPIRATION=30d

# Sentry
NEXT_PUBLIC_SENTRY_DSN=xxx
SENTRY_AUTH_TOKEN=xxx

# WhatsApp (futuro)
WHATSAPP_API_URL=xxx
WHATSAPP_API_TOKEN=xxx

# App
NEXT_PUBLIC_APP_URL=https://app.pokerclub.com.br
NEXT_PUBLIC_DISPLAY_URL=https://display.pokerclub.com.br
```

### Monitoramento e Alertas

```
Sentry:
- Erros de aplicação (front + back)
- Performance monitoring (tempo de resposta)
- Alerta: erro rate > 1% → e-mail + Slack

Vercel:
- Analytics de tráfego
- Web Vitals (LCP, FID, CLS)
- Deploy status

Supabase:
- Database health
- Connection count
- Query performance
- Storage usage
- Alerta: CPU > 80% → e-mail

Upstash:
- Redis usage
- Hit/miss ratio
- Memory usage

Alertas configurados:
- Erro 500 em produção → notificação imediata
- Response time > 3s → alerta
- Database connections > 80% do pool → alerta
- Storage > 80% → alerta
- Rate limit triggered excessivamente → alerta
```
