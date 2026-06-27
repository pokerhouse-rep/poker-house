# Etapa 21 — Diagramas

Os diagramas visuais foram gerados inline na conversa. Este documento serve como índice e descrição textual.

---

## Diagrama 1 — Arquitetura Geral

Mostra as 6 camadas do sistema:

1. **Clientes:** Admin (Desktop), Portal Jogador (PWA), Display (TV), Dealer (Mobile), Super Admin
2. **API Layer:** Auth JWT → Tenant Middleware → RBAC → Validation (Zod) → Rate Limit — tudo via tRPC
3. **Service Layer:** 16 módulos organizados em 4 categorias:
   - Operação (verde): Torneios, Cash Game, Satélites, Bar
   - Financeiro (laranja): Ledger, Carteira, Conta Corrente, Caixa
   - Recompensa (roxo): Ranking, Rakeback, Fidelidade
   - Suporte (vermelho): Auditoria, Notificação, WhatsApp
   - Realtime (ciano): Display, Presença
4. **Event Bus:** Pub/Sub in-process para desacoplamento entre módulos
5. **Data Access:** Prisma ORM + Tenant Filter Automático + Transactions ACID
6. **Infraestrutura:** PostgreSQL (Supabase), Redis (Upstash), Vercel + Sentry + GitHub

---

## Diagrama 2 — Fluxo de Evento: Buy-in

Mostra a separação síncrono/assíncrono de um buy-in com conta corrente:

**Síncrono (dentro da transação DB):**
1. Verifica torneio aberto
2. Verifica jogador não inscrito
3. Cria TournamentEntry
4. Cria 3 LedgerTransactions (débito buy-in, crédito rake, crédito chip dealer)
5. Cria AccountItem (pago: false)
6. Atualiza CashRegister
7. Atualiza prize_pool e total_inscritos
8. COMMIT

**Assíncrono (após commit, não bloqueia resposta < 1s):**
1. Emite evento "entry.registered"
2. AuditLog criado
3. Notificação enviada ao jogador
4. Tournament Display atualiza (TV)
5. Dashboard atualiza
6. Portal do jogador: saldo/conta atualiza

**Response 201** retornado em < 1 segundo.

---

## Diagrama 3 — Modelo de Dados

Visão ER simplificada com as 35 tabelas organizadas por domínio:

- **Identity:** User, Role, Wallet, Account, AccountItem
- **Operação:** Tournament (Entry, Prize, Rebuy, Reentry, Addon, Deal), Satellite (Ticket), CashTable (Session, ChipTx, RakeEntry, Waitlist), BlindStructure (Level), Tab (Item), Product
- **Financeiro:** LedgerTransaction (IMUTÁVEL), CashRegister
- **Ranking:** Ranking, Standing
- **Suporte:** AuditLog (IMUTÁVEL), Notification, WhatsAppLog, Presence, Template, OrgConfig, LoyaltyProgram, Subscription

Regras: organization_id em todas as tabelas, Ledger e AuditLog imutáveis, saldos são caches recalculáveis.
