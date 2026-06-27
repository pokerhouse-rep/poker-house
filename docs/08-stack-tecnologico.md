# Etapa 8 — Stack Tecnológico

## Resumo da Decisão

| Camada | Tecnologia | Justificativa Principal |
|--------|-----------|------------------------|
| Front-end | Next.js 14 (App Router) | SSR, RSC, performance, SEO |
| UI Components | shadcn/ui + Tailwind CSS | Customizável, leve, profissional |
| Estado | Zustand | Simples, performático, sem boilerplate |
| Formulários | React Hook Form + Zod | Validação type-safe, performance |
| Gráficos | Recharts | React nativo, boa documentação |
| Back-end | Node.js + Next.js API Routes + tRPC | Full-stack unificado, type-safety end-to-end |
| ORM | Prisma | Type-safe, migrações, ótimo DX |
| Banco de Dados | PostgreSQL (Supabase) | RLS, real-time nativo, auth, storage |
| Cache + Pub/Sub | Redis (Upstash) | Serverless, WebSocket pub/sub, cache |
| Real-time | Supabase Realtime + Redis | Channels por tenant, WebSocket nativo |
| Auth | Supabase Auth (custom) | JWT, RLS integrado, multi-tenant |
| Storage | Supabase Storage | Fotos, logos, PDFs |
| Hospedagem | Vercel (app) + Supabase (DB) | Auto-scaling, zero-config deploy |
| Monitoramento | Sentry | Erros, performance, alertas |
| CI/CD | GitHub Actions | Integrado ao GitHub, gratuito |
| Testes | Vitest + Playwright | Unit + E2E, rápidos |

---

## Front-end

### Framework: Next.js 14 (App Router)

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Next.js 14** | SSR, RSC, API Routes, grande comunidade, Vercel | Vendor lock-in leve com Vercel | ✅ Escolhido |
| Remix | Bom SSR, loader pattern | Comunidade menor, menos ecossistema | ❌ |
| Vite + React SPA | Simples, rápido build | Sem SSR, SEO ruim, sem API Routes | ❌ |
| Angular | Enterprise, tipagem forte | Curva alta, menos devs React no mercado | ❌ |

**Justificativa:** Next.js 14 unifica front-end e back-end (API Routes), suporta Server Components (performance), tem deploy nativo na Vercel, e é o framework React mais adotado no Brasil — facilidade de contratação.

Você já trabalha com Next.js 14 nos outros projetos (Integra Solar, Gestão Ambiental), o que reduz curva de aprendizado e permite reutilizar padrões.

### UI Components: shadcn/ui + Tailwind CSS

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **shadcn/ui + Tailwind** | Customizável, copy-paste, leve, acessível | Precisa montar alguns componentes | ✅ Escolhido |
| Material UI (MUI) | Completo, pronto | Pesado, difícil customizar, visual genérico | ❌ |
| Ant Design | Muito completo, bom para admin | Pesado, visual "chinês", difícil tematizar | ❌ |
| Chakra UI | Boa DX, acessível | Performance inferior, menos componentes | ❌ |

**Justificativa:** shadcn/ui dá componentes profissionais que você controla o código. Com Tailwind, a tematização (cada casa com suas cores) é trivial via CSS variables. Componentes acessíveis (Radix UI por baixo). Leve — não carrega biblioteca inteira.

### Gerenciamento de Estado: Zustand

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Zustand** | Simples, leve (1kb), sem boilerplate | Menos features que Redux | ✅ Escolhido |
| Redux Toolkit | Robusto, devtools, middleware | Boilerplate, complexidade desnecessária | ❌ |
| Jotai | Atômico, simples | Menos maduro para apps grandes | ❌ |
| Context API | Nativo do React | Re-render issues, não escala | ❌ |

**Justificativa:** Com Server Components do Next.js 14, a maioria do estado fica no servidor. Zustand cobre o estado client-side restante (UI state, real-time updates, formulários complexos) sem a cerimônia do Redux.

### Formulários: React Hook Form + Zod

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **RHF + Zod** | Performance (uncontrolled), validação type-safe | Curva inicial leve | ✅ Escolhido |
| Formik + Yup | Maduro, popular | Controlled inputs = lento em formulários grandes | ❌ |
| React Final Form | Leve | Comunidade menor | ❌ |

**Justificativa:** Os formulários de torneio e configuração são complexos (muitos campos condicionais). RHF não re-renderiza a cada keystroke. Zod valida no client E no server com o mesmo schema — consistência total.

### Gráficos: Recharts

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Recharts** | React nativo, declarativo, boa doc | Menos opções que D3 | ✅ Escolhido |
| Chart.js | Leve, popular | Wrapper React não é nativo | ❌ |
| D3.js | Poder total | Complexidade absurda para dashboards simples | ❌ |
| Tremor | Bonito, feito para dashboards | Menos flexível, comunidade menor | ❌ |

### Ícones: Lucide React

Leve, consistente, tree-shakable, mesmo que você já usa nos outros projetos.

---

## Back-end

### Runtime + API: Node.js + Next.js API Routes + tRPC

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Next.js API Routes + tRPC** | Type-safety E2E, sem duplicação de tipos, unificado | Acoplado ao Next.js | ✅ Escolhido |
| Express.js separado | Flexível, maduro | Dois projetos para manter, tipos duplicados | ❌ |
| Fastify separado | Mais rápido que Express | Mesmos problemas de projeto separado | ❌ |
| NestJS | Enterprise, DI, decorators | Overhead enorme para este projeto | ❌ |

**Justificativa:** tRPC elimina a necessidade de documentação de API — o front-end "sabe" automaticamente quais rotas existem, quais parâmetros aceitam e o que retornam. Zero runtime overhead. Type-safety de ponta a ponta.

Para o Tournament Display e WebSocket, usaremos um servidor WebSocket via custom server do Next.js ou serviço separado leve (Socket.io ou ws).

**Alternativa considerada:** Server Actions do Next.js para mutações simples, tRPC para queries complexas e operações que precisam de mais controle. Modelo híbrido.

### ORM: Prisma

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Prisma** | Type-safe, migrações, studio, ótimo DX | Ligeiramente mais lento que queries raw | ✅ Escolhido |
| Drizzle | Mais leve, SQL-like, rápido | Menos maduro, migrações menos robustas | ❌ Alternativa |
| Knex | Query builder flexível | Sem type-safety automático | ❌ |
| TypeORM | Decorators, Active Record | Bugs conhecidos, comunidade desacelerou | ❌ |
| Supabase client direto | Zero setup | Sem type-safety forte, sem migrações | ❌ |

**Justificativa:** Prisma gera tipos TypeScript automaticamente do schema. O middleware de tenant (`organization_id`) pode ser implementado como Prisma middleware global — toda query é filtrada automaticamente. Migrações versionadas e rollback. Prisma Studio para debug visual.

**Ponto de atenção:** Para queries muito complexas (relatórios, aggregations), usaremos raw queries via `prisma.$queryRaw` — Prisma permite isso sem abrir mão do resto.

---

## Banco de Dados

### Principal: PostgreSQL via Supabase

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Supabase (PostgreSQL)** | RLS, Realtime, Auth, Storage, free tier | Menos controle que self-hosted | ✅ Escolhido |
| PostgreSQL self-hosted | Controle total | Precisa gerenciar, backup, updates | ❌ |
| PlanetScale (MySQL) | Branching, serverless | MySQL (sem RLS nativo), preço | ❌ |
| MongoDB | Flexível, JSON nativo | Sem transações ACID fortes, sem RLS | ❌ |

**Justificativa:** Supabase oferece PostgreSQL managed + RLS (segurança multi-tenant no banco) + Realtime (WebSocket nativo para o Display) + Auth + Storage. Tudo integrado. Reduz drasticamente a complexidade de infraestrutura.

O Ledger exige ACID — PostgreSQL é a escolha natural. RLS como segunda barreira de isolamento multi-tenant.

Você já usa Supabase nos outros projetos — infraestrutura familiar.

### Estratégia de Migrações

- Prisma Migrate para versionamento do schema
- Cada migração gera arquivo SQL versionado
- Rollback possível via `prisma migrate resolve`
- Migrações testadas em ambiente de homologação antes de produção

### Índices Estratégicos

```
-- Toda tabela terá índice em organization_id (filtro de tenant)
-- Compostos para queries frequentes:
(organization_id, created_at)           -- listagens ordenadas por data
(organization_id, jogador_id)           -- busca por jogador
(organization_id, status)               -- filtro por status
(organization_id, dia_operacional)      -- operações do dia
(organization_id, tipo, created_at)     -- ledger por tipo e data
(organization_id, cpf)                  -- login do jogador (UNIQUE por org)
```

---

## Cache + Pub/Sub: Redis via Upstash

| Opção | Prós | Contras | Veredito |
|-------|------|---------|----------|
| **Upstash Redis** | Serverless, pay-per-use, global | Latência ligeiramente maior que self-hosted | ✅ Escolhido |
| Redis self-hosted | Baixa latência, controle | Precisa gerenciar servidor | ❌ |
| Memcached | Simples, rápido | Sem pub/sub, sem persistência | ❌ |

**Uso:**
- **Cache:** saldos de carteira, ranking atual, configurações da casa
- **Pub/Sub:** eventos real-time para Tournament Display e dashboards
- **Sessions:** sessões de usuário (expiração configurável)
- **Rate limiting:** controle de requests por IP/usuário

---

## Tempo Real

### Estratégia Híbrida: Supabase Realtime + WebSocket custom

| Componente | Tecnologia | Uso |
|-----------|-----------|-----|
| Dados do banco | Supabase Realtime | Mudanças em tabelas → clientes |
| Tournament Display | WebSocket custom (Socket.io) | Timer de blinds, atualizações em tempo real de alta frequência |
| Notificações | Supabase Realtime | Push para portal do jogador |
| Dashboard operacional | Supabase Realtime | Atualizações de estado |

**Justificativa:** Supabase Realtime funciona para a maioria dos casos (escuta mudanças no banco). Mas o Tournament Display precisa de timer sincronizado (atualiza a cada segundo) — isso é melhor com WebSocket dedicado para não sobrecarregar o Supabase.

---

## Autenticação: Supabase Auth (customizado)

### Fluxo Admin/Funcionário
- Login com e-mail + senha
- Supabase Auth gera JWT
- JWT contém: user_id, organization_id, roles
- Middleware valida JWT em toda request

### Fluxo Jogador
- Login com CPF + senha
- Custom auth flow: valida CPF + senha no banco → gera JWT via Supabase Auth
- JWT contém: user_id, organization_id, tipo: "jogador"

### Segurança
- JWT com expiração configurável
- Refresh token
- Bloqueio após X tentativas
- Senhas com bcrypt (hash + salt)

---

## Storage: Supabase Storage

- Bucket privado para fotos de jogadores
- Bucket privado para logos de casas
- Bucket privado para PDFs gerados (relatórios, recibos)
- Signed URLs para acesso temporário

---

## Hospedagem

| Componente | Serviço | Justificativa |
|-----------|---------|---------------|
| Aplicação (Next.js) | **Vercel** | Deploy automático, edge functions, preview deploys |
| Banco de dados | **Supabase** | PostgreSQL managed, RLS, Realtime |
| Redis | **Upstash** | Serverless, integra com Vercel |
| WebSocket (Display) | **Railway** ou **Fly.io** | Precisa de servidor persistente (Vercel é serverless) |
| DNS / CDN | **Vercel** (incluso) | CDN global, HTTPS automático |

**Ponto importante:** Vercel é serverless — não mantém conexões WebSocket persistentes. O Tournament Display (timer em tempo real) precisa de um servidor que mantenha conexão. Opções:
1. **Railway** — simples, barato, já usado por você
2. **Fly.io** — edge computing, baixa latência
3. **Supabase Realtime** — se o timer puder ser client-side (o servidor só envia eventos, o browser conta o tempo)

**Recomendação:** Timer client-side com sincronização via Supabase Realtime. O servidor envia "blind mudou" e o client-side faz a contagem regressiva. Isso elimina a necessidade de servidor WebSocket dedicado e simplifica a infra. Se a TV recarregar, resincroniza instantaneamente.

---

## Monitoramento: Sentry

- Captura de erros em produção (front e back)
- Performance monitoring
- Alertas automáticos
- Source maps para debug
- Já utilizado no Integra Solar

---

## CI/CD: GitHub Actions

```
Workflow:
  push to feature/* → lint + type-check + unit tests
  push to develop   → lint + type-check + tests + deploy homologação
  push to main      → lint + type-check + tests + deploy produção
```

---

## Testes

| Tipo | Ferramenta | Escopo |
|------|-----------|--------|
| Unitário | **Vitest** | Services, utils, validações |
| Integração | **Vitest + Prisma** | Queries, transações, ledger |
| E2E | **Playwright** | Fluxos completos (buy-in, fechamento) |
| Carga | **k6** | Performance sob carga (quando necessário) |

**Vitest** > Jest: mais rápido, ESM nativo, compatível com ecossistema Vite/Next.

---

## Linguagem: TypeScript (em todo o projeto)

- Front-end: TypeScript
- Back-end: TypeScript
- Schemas de validação: Zod (TypeScript)
- ORM: Prisma (gera tipos TypeScript)
- API: tRPC (type-safety end-to-end)

**Zero JavaScript puro.** Tudo tipado.

---

## Stack Final Resumido

```
┌─────────────────────────────────────┐
│            FRONT-END                │
│  Next.js 14 + TypeScript            │
│  shadcn/ui + Tailwind CSS           │
│  Zustand + React Hook Form + Zod    │
│  Recharts + Lucide Icons            │
│  PWA (portal do jogador)            │
├─────────────────────────────────────┤
│            BACK-END                 │
│  Next.js API Routes + tRPC          │
│  Prisma ORM                         │
│  Zod (validação compartilhada)      │
│  Socket.io ou Supabase Realtime     │
├─────────────────────────────────────┤
│          INFRAESTRUTURA             │
│  PostgreSQL (Supabase)              │
│  Redis (Upstash)                    │
│  Storage (Supabase)                 │
│  Auth (Supabase)                    │
│  Hosting (Vercel)                   │
│  Monitoring (Sentry)                │
│  CI/CD (GitHub Actions)             │
└─────────────────────────────────────┘
```
