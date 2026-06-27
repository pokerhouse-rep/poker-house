# CLAUDE.md — Poker Club SaaS

## Project Overview

Poker Club é um SaaS multi-tenant para gerenciamento de casas de poker. O código ativo está em `web/` — uma aplicação Next.js 14 (App Router) com Prisma ORM, tRPC, Supabase e shadcn/ui.

A pasta `docs/` contém a arquitetura completa do sistema (22 documentos).

## Commands

```bash
cd web
npm run dev      # Dev server localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma client
npx prisma studio         # Visual DB browser
```

## Architecture

### Stack
- **Framework:** Next.js 14 (App Router)
- **API:** tRPC (type-safe end-to-end)
- **ORM:** Prisma (PostgreSQL)
- **Database:** Supabase (PostgreSQL + RLS + Realtime + Auth + Storage)
- **UI:** shadcn/ui + Tailwind CSS + Lucide icons + Recharts
- **State:** Zustand (client) + React Hook Form + Zod
- **Cache:** Redis via Upstash (futuro)
- **Hosting:** Vercel
- **Monitoring:** Sentry

### Multi-tenancy
Every query MUST filter by `organization_id`. The Prisma middleware handles this automatically.

### Financial Model — Ledger
All financial transactions go through the Ledger (immutable). Wallet balances are caches recalculated from the Ledger. NEVER update a balance directly.

### Event-Driven
Services emit typed events via Event Bus. Side effects (notifications, display updates, audit) run asynchronously after DB commit.

### Key Patterns
- `src/server/routers/` — tRPC routers (API)
- `src/server/services/` — Business logic per module
- `src/server/middleware/` — Auth, tenant, RBAC
- `src/app/(dashboard)/` — Admin area (desktop-first)
- `src/app/(player)/` — Player portal (mobile-first, PWA)
- `src/app/display/` — Tournament Display (TV fullscreen)
- `src/app/(platform)/` — Super Admin

### Modules
Torneios, Cash Game, Satélites, Ledger, Carteira, Conta Corrente, Caixa, Ranking, Rakeback, Bar/Comanda, Presença, Notificações, WhatsApp, Auditoria, Templates, Configurações, Fidelidade, Display, Relatórios.

## Conventions

- Portuguese for all user-facing text and business variable names
- Decimal(10,2) for all monetary values — never float
- LedgerTransaction and AuditLog are IMMUTABLE — no UPDATE, no DELETE
- Wallet balances are caches of Ledger — recalculable
- All IDs are UUID v4
- `@db.Uuid` on all ID fields in Prisma schema
