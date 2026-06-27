# Etapas 9, 10 e 11 — Modelagem do Banco de Dados, Entidades e Relacionamentos

## Visão Geral

- **Banco:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Multi-tenant:** organization_id em TODAS as tabelas
- **Ledger:** imutável, sem UPDATE/DELETE
- **Audit:** imutável, sem UPDATE/DELETE
- **IDs:** UUID v4

---

## Schema Prisma Completo

### 1. Plataforma SaaS (Super Admin)

```prisma
// ============================================
// PLATAFORMA
// ============================================

model Organization {
  id                String   @id @default(uuid())
  cnpj              String   @unique
  razao_social      String
  nome_fantasia     String
  endereco          Json?    // {rua, numero, complemento, bairro, cidade, estado, cep}
  telefone          String?
  email             String
  logo_url          String?
  theme             Json?    // {primary_color, secondary_color, ...}
  timezone          String   @default("America/Sao_Paulo")
  status            OrgStatus @default(ATIVA)
  horario_funcionamento Json? // {abertura, fechamento}
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Relações
  users             User[]
  roles             Role[]
  wallets           Wallet[]
  accounts          Account[]
  ledger_transactions LedgerTransaction[]
  cash_registers    CashRegister[]
  tournaments       Tournament[]
  satellites        Satellite[]
  cash_tables       CashTable[]
  tabs              Tab[]
  products          Product[]
  product_categories ProductCategory[]
  rankings          Ranking[]
  blind_structures  BlindStructure[]
  presences         Presence[]
  notifications     Notification[]
  whatsapp_templates WhatsAppTemplate[]
  whatsapp_logs     WhatsAppLog[]
  audit_logs        AuditLog[]
  templates         Template[]
  org_configs       OrgConfig[]
  loyalty_programs  LoyaltyProgram[]
  subscription      Subscription?

  @@map("organizations")
}

enum OrgStatus {
  ATIVA
  SUSPENSA
  CANCELADA
}

model Subscription {
  id                String   @id @default(uuid())
  organization_id   String   @unique
  organization      Organization @relation(fields: [organization_id], references: [id])
  plano             String   // nome do plano
  status            SubscriptionStatus @default(ATIVA)
  valor             Decimal  @db.Decimal(10, 2)
  inicio            DateTime
  proximo_vencimento DateTime
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  @@map("subscriptions")
}

enum SubscriptionStatus {
  ATIVA
  ATRASADA
  SUSPENSA
  CANCELADA
}
```

### 2. Usuários, Roles e Permissões

```prisma
// ============================================
// IDENTITY & ACCESS
// ============================================

model User {
  id                String    @id @default(uuid())
  organization_id   String
  organization      Organization @relation(fields: [organization_id], references: [id])
  tipo              UserTipo
  email             String?   // login para admin/funcionário
  cpf               String    // login para jogador, obrigatório para todos
  senha_hash        String
  nome              String
  nickname          String?
  telefone          String
  data_nascimento   DateTime
  endereco          Json?
  foto_url          String?
  status            UserStatus @default(ATIVO)
  tags              String[]  @default([])
  observacoes_internas String?
  ultimo_acesso     DateTime?
  tentativas_login  Int       @default(0)
  bloqueado_ate     DateTime?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  // Relações
  user_roles        UserRole[]
  wallet            Wallet?
  accounts          Account[]
  tournament_entries TournamentEntry[]
  cash_sessions     CashSession[]
  tabs              Tab[]
  presences         Presence[]
  notifications     Notification[]
  ranking_entries   RankingEntry[]
  ranking_standings RankingStanding[]
  loyalty_progress  LoyaltyProgress[]

  // Relações como operador
  ledger_as_player      LedgerTransaction[] @relation("LedgerPlayer")
  ledger_as_operator    LedgerTransaction[] @relation("LedgerOperator")
  cash_registers_opened CashRegister[]      @relation("CashRegisterOpenedBy")
  cash_registers_closed CashRegister[]      @relation("CashRegisterClosedBy")
  audit_logs            AuditLog[]
  whatsapp_logs_sent    WhatsAppLog[]
  presences_registered  Presence[]          @relation("PresenceRegisteredBy")
  satellite_tickets     SatelliteTicket[]   @relation("TicketOwner")
  satellite_tickets_received SatelliteTicket[] @relation("TicketTransferredTo")

  @@unique([organization_id, cpf])
  @@unique([organization_id, email])
  @@index([organization_id, status])
  @@index([organization_id, tipo])
  @@index([organization_id, nome])
  @@map("users")
}

enum UserTipo {
  ADMIN
  FUNCIONARIO
  JOGADOR
}

enum UserStatus {
  ATIVO
  INATIVO
  BLOQUEADO
}

model Role {
  id                String   @id @default(uuid())
  organization_id   String
  organization      Organization @relation(fields: [organization_id], references: [id])
  nome              String
  descricao         String?
  permissions       Json     // [{modulo, acoes: [criar, ler, editar, deletar, estornar]}]
  is_system         Boolean  @default(false) // cargos padrão não editáveis
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  user_roles        UserRole[]

  @@unique([organization_id, nome])
  @@map("roles")
}

model UserRole {
  id          String   @id @default(uuid())
  user_id     String
  user        User     @relation(fields: [user_id], references: [id])
  role_id     String
  role        Role     @relation(fields: [role_id], references: [id])
  assigned_at DateTime @default(now())

  @@unique([user_id, role_id])
  @@map("user_roles")
}
```

### 3. Financeiro — Ledger, Carteira, Conta Corrente

```prisma
// ============================================
// FINANCEIRO
// ============================================

model Wallet {
  id                  String   @id @default(uuid())
  organization_id     String
  organization        Organization @relation(fields: [organization_id], references: [id])
  jogador_id          String   @unique
  jogador             User     @relation(fields: [jogador_id], references: [id])

  // Caches calculados do Ledger — recalculáveis a qualquer momento
  saldo_disponivel    Decimal  @default(0) @db.Decimal(10, 2)
  saldo_pendente      Decimal  @default(0) @db.Decimal(10, 2)
  saldo_bloqueado     Decimal  @default(0) @db.Decimal(10, 2)
  saldo_promocional   Decimal  @default(0) @db.Decimal(10, 2)
  saldo_bonus         Decimal  @default(0) @db.Decimal(10, 2)
  saldo_rakeback      Decimal  @default(0) @db.Decimal(10, 2)
  saldo_premiacoes    Decimal  @default(0) @db.Decimal(10, 2)
  updated_at          DateTime @updatedAt

  @@index([organization_id])
  @@map("wallets")
}

model Account {
  id                String        @id @default(uuid())
  organization_id   String
  organization      Organization  @relation(fields: [organization_id], references: [id])
  jogador_id        String
  jogador           User          @relation(fields: [jogador_id], references: [id])
  status            AccountStatus @default(ABERTA)
  dia_operacional   DateTime      @db.Date
  total             Decimal       @default(0) @db.Decimal(10, 2)
  total_pago        Decimal       @default(0) @db.Decimal(10, 2)
  aberta_em         DateTime      @default(now())
  fechada_em        DateTime?
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  items             AccountItem[]

  @@index([organization_id, jogador_id])
  @@index([organization_id, status])
  @@index([organization_id, dia_operacional])
  @@map("accounts")
}

enum AccountStatus {
  ABERTA
  FECHADA
}

model AccountItem {
  id              String   @id @default(uuid())
  account_id      String
  account         Account  @relation(fields: [account_id], references: [id])
  tipo            AccountItemTipo
  descricao       String
  valor           Decimal  @db.Decimal(10, 2)
  pago            Boolean  @default(false)
  valor_pago      Decimal  @default(0) @db.Decimal(10, 2)
  transaction_id  String?
  created_at      DateTime @default(now())
  paid_at         DateTime?

  @@index([account_id])
  @@map("account_items")
}

enum AccountItemTipo {
  BUYIN
  REBUY
  ADDON
  REENTRADA
  BAR
  CASH_COMPRA
  CASH_VENDA
  PREMIO
  OUTROS
}

model LedgerTransaction {
  id                String   @id @default(uuid())
  organization_id   String
  organization      Organization @relation(fields: [organization_id], references: [id])

  tipo              LedgerTipo           // CREDITO ou DEBITO
  categoria         LedgerCategoria
  valor             Decimal              @db.Decimal(10, 2) // sempre positivo
  saldo_tipo        SaldoTipo?           // qual saldo da carteira afeta (null = caixa/geral)

  jogador_id        String?
  jogador           User?    @relation("LedgerPlayer", fields: [jogador_id], references: [id])
  funcionario_id    String
  funcionario       User     @relation("LedgerOperator", fields: [funcionario_id], references: [id])

  referencia_tipo   ReferenciaTipo
  referencia_id     String               // UUID da entidade relacionada
  caixa_id          String?
  cash_register     CashRegister? @relation(fields: [caixa_id], references: [id])

  forma_pagamento   FormaPagamento?
  descricao         String?
  metadata          Json?                // dados extras contextuais

  dia_operacional   DateTime  @db.Date
  created_at        DateTime  @default(now())

  // SEM updated_at, SEM deleted_at — IMUTÁVEL

  @@index([organization_id, created_at])
  @@index([organization_id, jogador_id])
  @@index([organization_id, categoria])
  @@index([organization_id, referencia_tipo, referencia_id])
  @@index([organization_id, dia_operacional])
  @@index([organization_id, caixa_id])
  @@index([organization_id, saldo_tipo, jogador_id])
  @@map("ledger_transactions")
}

enum LedgerTipo {
  CREDITO
  DEBITO
}

enum LedgerCategoria {
  BUYIN
  REBUY
  ADDON
  REENTRADA
  RAKE
  CHIP_DEALER
  PREMIO
  BAR
  DEPOSITO
  SAQUE
  RAKEBACK
  BONUS
  PROMOCIONAL
  ESTORNO
  AJUSTE
  SANGRIA
  SUPRIMENTO
  PAGAMENTO
  DEAL
  OVERLAY
  FIDELIDADE
  CASH_COMPRA_FICHAS
  CASH_VENDA_FICHAS
  DEALER_TIP
}

enum SaldoTipo {
  DISPONIVEL
  PENDENTE
  BLOQUEADO
  PROMOCIONAL
  BONUS
  RAKEBACK
  PREMIACOES
}

enum LedgerTipo {
  CREDITO
  DEBITO
}

enum ReferenciaTipo {
  TORNEIO
  SATELITE
  MESA_CASH
  BAR
  CARTEIRA
  CAIXA
  RANKING
  FIDELIDADE
  MANUAL
}

enum FormaPagamento {
  DINHEIRO
  PIX
  CARTAO_CREDITO
  CARTAO_DEBITO
  TRANSFERENCIA
  CARTEIRA
}

model CashRegister {
  id                    String   @id @default(uuid())
  organization_id       String
  organization          Organization @relation(fields: [organization_id], references: [id])
  tipo                  CashRegisterTipo
  referencia_id         String?  // id do torneio ou mesa (null para bar/geral)
  aberto_por_id         String
  aberto_por            User     @relation("CashRegisterOpenedBy", fields: [aberto_por_id], references: [id])
  fechado_por_id        String?
  fechado_por           User?    @relation("CashRegisterClosedBy", fields: [fechado_por_id], references: [id])
  fundo_troco           Decimal  @default(0) @db.Decimal(10, 2)
  valor_esperado        Decimal  @default(0) @db.Decimal(10, 2)
  valor_informado       Decimal? @db.Decimal(10, 2)
  diferenca             Decimal? @db.Decimal(10, 2)
  justificativa_diferenca String?
  status                CashRegisterStatus @default(ABERTO)
  aberto_em             DateTime @default(now())
  fechado_em            DateTime?
  dia_operacional       DateTime @db.Date

  ledger_transactions   LedgerTransaction[]

  @@index([organization_id, status])
  @@index([organization_id, dia_operacional])
  @@index([organization_id, tipo])
  @@map("cash_registers")
}

enum CashRegisterTipo {
  TORNEIO
  MESA_CASH
  BAR
  GERAL
}

enum CashRegisterStatus {
  ABERTO
  FECHADO
}
```

### 4. Torneios

```prisma
// ============================================
// TORNEIOS
// ============================================

model Tournament {
  id                      String   @id @default(uuid())
  organization_id         String
  organization            Organization @relation(fields: [organization_id], references: [id])
  template_id             String?
  nome                    String
  status                  TournamentStatus @default(RASCUNHO)

  // Valores
  buyin_valor             Decimal  @db.Decimal(10, 2)
  rake_valor              Decimal  @default(0) @db.Decimal(10, 2)
  chip_dealer_valor       Decimal  @default(0) @db.Decimal(10, 2)
  starting_stack          Int

  // Garantido
  garantido_ativo         Boolean  @default(false)
  garantido_valor         Decimal? @db.Decimal(10, 2)

  // Late Registration
  late_registration_ativo Boolean  @default(false)
  late_registration_ate_nivel Int?

  // Rebuy
  rebuy_ativo             Boolean  @default(false)
  rebuy_condicao          RebuyCondicao?
  rebuy_condicao_valor    Int?     // fichas mínimas se ABAIXO_DE_X
  rebuy_maximo            Int?
  rebuy_valor             Decimal? @db.Decimal(10, 2)
  rebuy_fichas            Int?

  // Reentrada
  reentrada_ativa         Boolean  @default(false)
  reentrada_maxima        Int?
  reentrada_valor         Decimal? @db.Decimal(10, 2)
  reentrada_fichas        Int?

  // Add-on
  addon_ativo             Boolean  @default(false)
  addon_valor             Decimal? @db.Decimal(10, 2)
  addon_fichas            Int?

  // Multi-day
  multiday                Boolean  @default(false)

  // Ranking
  ranking_ids             String[] @default([])
  ranking_peso            Int      @default(1)

  // Calculados
  prize_pool              Decimal  @default(0) @db.Decimal(10, 2)
  overlay_valor           Decimal  @default(0) @db.Decimal(10, 2)
  total_inscritos         Int      @default(0)
  total_rebuys            Int      @default(0)
  total_reentradas        Int      @default(0)
  total_addons            Int      @default(0)

  // Estrutura
  blind_structure_id      String
  blind_structure         BlindStructure @relation(fields: [blind_structure_id], references: [id])
  nivel_atual             Int      @default(0)

  // Caixa
  caixa_id                String?  @unique

  // Datas
  data_inicio             DateTime?
  data_fim                DateTime?
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  // Relações
  days                    TournamentDay[]
  entries                 TournamentEntry[]
  prizes                  TournamentPrize[]
  deals                   TournamentDeal[]
  satellite_tickets       SatelliteTicket[] @relation("TicketTargetTournament")

  @@index([organization_id, status])
  @@index([organization_id, data_inicio])
  @@index([organization_id, created_at])
  @@map("tournaments")
}

enum TournamentStatus {
  RASCUNHO
  INSCRICOES_ABERTAS
  EM_ANDAMENTO
  PAUSADO
  FINALIZADO
  CANCELADO
}

enum RebuyCondicao {
  BUST
  ABAIXO_DE_X
}

model TournamentDay {
  id              String   @id @default(uuid())
  tournament_id   String
  tournament      Tournament @relation(fields: [tournament_id], references: [id], onDelete: Cascade)
  dia_label       String   // "1A", "1B", "1C", "2"
  data            DateTime @db.Date
  status          TournamentDayStatus @default(PENDENTE)
  created_at      DateTime @default(now())

  entries         TournamentEntry[]

  @@index([tournament_id])
  @@map("tournament_days")
}

enum TournamentDayStatus {
  PENDENTE
  EM_ANDAMENTO
  FINALIZADO
}

model TournamentEntry {
  id                  String   @id @default(uuid())
  tournament_id       String
  tournament          Tournament @relation(fields: [tournament_id], references: [id])
  tournament_day_id   String?
  tournament_day      TournamentDay? @relation(fields: [tournament_day_id], references: [id])
  jogador_id          String
  jogador             User     @relation(fields: [jogador_id], references: [id])
  tipo                EntryTipo
  buyin_transaction_id String?

  // Mesa e assento
  mesa_numero         Int?
  assento_numero      Int?

  // Stack
  stack_atual         Int?
  melhor_stack        Int?     // para multi-day

  // Status
  classificado_dia2   Boolean  @default(false)
  posicao_final       Int?
  eliminado           Boolean  @default(false)
  eliminado_em        DateTime?

  // Contadores
  rebuys_realizados   Int      @default(0)
  reentradas_realizadas Int    @default(0)
  addon_realizado     Boolean  @default(false)

  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  rebuys              TournamentRebuy[]
  addons              TournamentAddon[]
  reentradas          TournamentReentry[]

  @@index([tournament_id, jogador_id])
  @@index([tournament_id, posicao_final])
  @@map("tournament_entries")
}

enum EntryTipo {
  INSCRICAO
  REENTRADA
  SATELITE
}

model TournamentRebuy {
  id              String   @id @default(uuid())
  entry_id        String
  entry           TournamentEntry @relation(fields: [entry_id], references: [id])
  transaction_id  String?
  fichas_recebidas Int
  created_at      DateTime @default(now())

  @@index([entry_id])
  @@map("tournament_rebuys")
}

model TournamentReentry {
  id                String   @id @default(uuid())
  entry_id          String   // entry original (eliminada)
  entry             TournamentEntry @relation(fields: [entry_id], references: [id])
  transaction_id    String?
  novo_mesa_numero  Int?
  novo_assento_numero Int?
  fichas_recebidas  Int
  created_at        DateTime @default(now())

  @@index([entry_id])
  @@map("tournament_reentries")
}

model TournamentAddon {
  id              String   @id @default(uuid())
  entry_id        String
  entry           TournamentEntry @relation(fields: [entry_id], references: [id])
  transaction_id  String?
  fichas_recebidas Int
  created_at      DateTime @default(now())

  @@index([entry_id])
  @@map("tournament_addons")
}

model TournamentPrize {
  id              String   @id @default(uuid())
  tournament_id   String
  tournament      Tournament @relation(fields: [tournament_id], references: [id])
  posicao         Int
  percentual      Decimal? @db.Decimal(5, 2)
  valor_fixo      Decimal? @db.Decimal(10, 2)
  valor_final     Decimal  @db.Decimal(10, 2)
  jogador_id      String?
  transaction_id  String?
  is_deal         Boolean  @default(false)
  deal_valor      Decimal? @db.Decimal(10, 2)
  created_at      DateTime @default(now())

  @@index([tournament_id])
  @@map("tournament_prizes")
}

model TournamentDeal {
  id              String   @id @default(uuid())
  tournament_id   String
  tournament      Tournament @relation(fields: [tournament_id], references: [id])
  jogadores_ids   String[]
  valores_acordados Json   // {jogador_id: valor}
  registrado_por_id String
  created_at      DateTime @default(now())

  @@index([tournament_id])
  @@map("tournament_deals")
}
```

### 5. Satélites

```prisma
// ============================================
// SATÉLITES
// ============================================

model Satellite {
  id                      String   @id @default(uuid())
  organization_id         String
  organization            Organization @relation(fields: [organization_id], references: [id])
  nome                    String
  status                  TournamentStatus @default(RASCUNHO)

  // Valores (herda conceito de torneio)
  buyin_valor             Decimal  @db.Decimal(10, 2)
  rake_valor              Decimal  @default(0) @db.Decimal(10, 2)
  chip_dealer_valor       Decimal  @default(0) @db.Decimal(10, 2)
  starting_stack          Int

  // Configurações de jogo (mesmas de torneio)
  rebuy_ativo             Boolean  @default(false)
  rebuy_condicao          RebuyCondicao?
  rebuy_condicao_valor    Int?
  rebuy_maximo            Int?
  rebuy_valor             Decimal? @db.Decimal(10, 2)
  rebuy_fichas            Int?
  reentrada_ativa         Boolean  @default(false)
  reentrada_maxima        Int?
  reentrada_valor         Decimal? @db.Decimal(10, 2)
  reentrada_fichas        Int?
  addon_ativo             Boolean  @default(false)
  addon_valor             Decimal? @db.Decimal(10, 2)
  addon_fichas            Int?
  late_registration_ativo Boolean  @default(false)
  late_registration_ate_nivel Int?

  // Estrutura
  blind_structure_id      String
  blind_structure         BlindStructure @relation(fields: [blind_structure_id], references: [id])

  // Torneios alvo
  torneio_alvo_ids        String[] // IDs dos torneios que os tickets dão acesso

  // Saldo excedente
  saldo_excedente_pago    Boolean  @default(true) // paga diferença em dinheiro

  // Datas
  data_inicio             DateTime?
  data_fim                DateTime?
  created_at              DateTime @default(now())
  updated_at              DateTime @updatedAt

  tickets                 SatelliteTicket[]

  @@index([organization_id, status])
  @@map("satellites")
}

model SatelliteTicket {
  id                  String   @id @default(uuid())
  satellite_id        String
  satellite           Satellite @relation(fields: [satellite_id], references: [id])
  jogador_id          String
  jogador             User     @relation("TicketOwner", fields: [jogador_id], references: [id])
  torneio_alvo_id     String
  torneio_alvo        Tournament @relation("TicketTargetTournament", fields: [torneio_alvo_id], references: [id])
  status              TicketStatus @default(ATIVO)
  validade            DateTime?
  transferido_para_id String?
  transferido_para    User?    @relation("TicketTransferredTo", fields: [transferido_para_id], references: [id])
  transferido_em      DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  @@index([satellite_id])
  @@index([jogador_id])
  @@map("satellite_tickets")
}

enum TicketStatus {
  ATIVO
  UTILIZADO
  TRANSFERIDO
  EXPIRADO
}
```

### 6. Cash Game

```prisma
// ============================================
// CASH GAME
// ============================================

model CashTable {
  id                String   @id @default(uuid())
  organization_id   String
  organization      Organization @relation(fields: [organization_id], references: [id])
  nome              String
  modalidade        String   // "NL Hold'em", "PLO", etc.
  stakes            String   // "1/2", "2/5", "5/10"
  blind_small       Decimal  @db.Decimal(10, 2)
  blind_big         Decimal  @db.Decimal(10, 2)
  buyin_minimo      Decimal  @db.Decimal(10, 2)
  buyin_maximo      Decimal  @db.Decimal(10, 2)
  max_jogadores     Int      @default(9)
  rake_tipo         RakeTipo
  rake_percentual   Decimal? @db.Decimal(5, 2)  // se pot_rake
  rake_cap          Decimal? @db.Decimal(10, 2)  // se pot_rake
  rake_valor_hora   Decimal? @db.Decimal(10, 2)  // se time_rake
  status            CashTableStatus @default(FECHADA)
  caixa_id          String?  @unique
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  sessions          CashSession[]
  waitlist          CashTableWaitlist[]
  reservations      CashTableReservation[]
  rake_entries      CashRakeEntry[]

  @@index([organization_id, status])
  @@map("cash_tables")
}

enum RakeTipo {
  POT_RAKE
  TIME_RAKE
}

enum CashTableStatus {
  FECHADA
  ABERTA
  CHEIA
}

model CashTableWaitlist {
  id              String   @id @default(uuid())
  cash_table_id   String
  cash_table      CashTable @relation(fields: [cash_table_id], references: [id])
  jogador_id      String
  posicao         Int
  created_at      DateTime @default(now())

  @@unique([cash_table_id, jogador_id])
  @@index([cash_table_id, posicao])
  @@map("cash_table_waitlists")
}

model CashTableReservation {
  id              String   @id @default(uuid())
  cash_table_id   String
  cash_table      CashTable @relation(fields: [cash_table_id], references: [id])
  jogador_id      String
  assento_numero  Int
  status          ReservationStatus @default(ATIVA)
  expira_em       DateTime
  created_at      DateTime @default(now())

  @@index([cash_table_id])
  @@map("cash_table_reservations")
}

enum ReservationStatus {
  ATIVA
  UTILIZADA
  CANCELADA
  EXPIRADA
}

model CashSession {
  id              String   @id @default(uuid())
  cash_table_id   String
  cash_table      CashTable @relation(fields: [cash_table_id], references: [id])
  jogador_id      String
  jogador         User     @relation(fields: [jogador_id], references: [id])
  assento_numero  Int?
  buyin_total     Decimal  @default(0) @db.Decimal(10, 2)
  cashout_total   Decimal  @default(0) @db.Decimal(10, 2)
  resultado       Decimal  @default(0) @db.Decimal(10, 2)
  rake_pago       Decimal  @default(0) @db.Decimal(10, 2)
  dealer_tip      Decimal  @default(0) @db.Decimal(10, 2)
  status          CashSessionStatus @default(ATIVA)
  inicio          DateTime @default(now())
  fim             DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  chip_transactions CashChipTransaction[]

  @@index([cash_table_id, status])
  @@index([jogador_id])
  @@map("cash_sessions")
}

enum CashSessionStatus {
  ATIVA
  FINALIZADA
}

model CashChipTransaction {
  id              String   @id @default(uuid())
  session_id      String
  session         CashSession @relation(fields: [session_id], references: [id])
  tipo            ChipTransactionTipo
  valor           Decimal  @db.Decimal(10, 2)
  transaction_id  String?  // FK para LedgerTransaction
  created_at      DateTime @default(now())

  @@index([session_id])
  @@map("cash_chip_transactions")
}

enum ChipTransactionTipo {
  COMPRA
  VENDA
}

model CashRakeEntry {
  id              String   @id @default(uuid())
  cash_table_id   String
  cash_table      CashTable @relation(fields: [cash_table_id], references: [id])
  valor           Decimal  @db.Decimal(10, 2)
  registrado_por_id String
  transaction_id  String?  // FK para LedgerTransaction
  created_at      DateTime @default(now())

  @@index([cash_table_id])
  @@map("cash_rake_entries")
}
```

### 7. Bar / Comanda

```prisma
// ============================================
// BAR / COMANDA
// ============================================

model Tab {
  id                String   @id @default(uuid())
  organization_id   String
  organization      Organization @relation(fields: [organization_id], references: [id])
  jogador_id        String
  jogador           User     @relation(fields: [jogador_id], references: [id])
  is_acompanhante   Boolean  @default(false)
  status            TabStatus @default(ABERTA)
  total             Decimal  @default(0) @db.Decimal(10, 2)
  total_pago        Decimal  @default(0) @db.Decimal(10, 2)
  dia_operacional   DateTime @db.Date
  aberta_em         DateTime @default(now())
  fechada_em        DateTime?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  items             TabItem[]

  @@index([organization_id, jogador_id])
  @@index([organization_id, status])
  @@index([organization_id, dia_operacional])
  @@map("tabs")
}

enum TabStatus {
  ABERTA
  FECHADA
}

model TabItem {
  id              String   @id @default(uuid())
  tab_id          String
  tab             Tab      @relation(fields: [tab_id], references: [id])
  produto_id      String
  produto         Product  @relation(fields: [produto_id], references: [id])
  quantidade      Int
  valor_unitario  Decimal  @db.Decimal(10, 2)
  valor_total     Decimal  @db.Decimal(10, 2)
  transaction_id  String?  // FK para LedgerTransaction
  created_at      DateTime @default(now())

  @@index([tab_id])
  @@map("tab_items")
}

model Product {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  nome            String
  categoria_id    String
  categoria       ProductCategory @relation(fields: [categoria_id], references: [id])
  preco           Decimal  @db.Decimal(10, 2)
  status          ProductStatus @default(ATIVO)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  tab_items       TabItem[]

  @@index([organization_id, categoria_id])
  @@map("products")
}

enum ProductStatus {
  ATIVO
  INATIVO
}

model ProductCategory {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  nome            String
  ordem           Int      @default(0)
  created_at      DateTime @default(now())

  products        Product[]

  @@unique([organization_id, nome])
  @@map("product_categories")
}
```

### 8. Ranking

```prisma
// ============================================
// RANKING
// ============================================

model Ranking {
  id                  String   @id @default(uuid())
  organization_id     String
  organization        Organization @relation(fields: [organization_id], references: [id])
  nome                String
  tipo                RankingTipo
  periodo_inicio      DateTime @db.Date
  periodo_fim         DateTime @db.Date
  status              RankingStatus @default(ATIVO)
  desempate_criterios Json     // ["mais_torneios", "mais_itm", "confronto_direto"]
  premios             Json?    // [{posicao: 1, valor: 5000}, ...]
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  point_structure     RankingPointStructure[]
  entries             RankingEntry[]
  standings           RankingStanding[]

  @@index([organization_id, status])
  @@map("rankings")
}

enum RankingTipo {
  SEMESTRAL
  ANUAL
}

enum RankingStatus {
  ATIVO
  FINALIZADO
  CANCELADO
}

model RankingPointStructure {
  id          String   @id @default(uuid())
  ranking_id  String
  ranking     Ranking  @relation(fields: [ranking_id], references: [id])
  posicao     Int
  pontos      Int
  created_at  DateTime @default(now())

  @@unique([ranking_id, posicao])
  @@map("ranking_point_structures")
}

model RankingEntry {
  id                  String   @id @default(uuid())
  ranking_id          String
  ranking             Ranking  @relation(fields: [ranking_id], references: [id])
  jogador_id          String
  jogador             User     @relation(fields: [jogador_id], references: [id])
  tournament_id       String
  posicao_no_torneio  Int
  peso_torneio        Int
  pontos_base         Int
  pontos_final        Int      // base × peso
  created_at          DateTime @default(now())

  @@index([ranking_id, jogador_id])
  @@index([ranking_id, tournament_id])
  @@map("ranking_entries")
}

model RankingStanding {
  id                String   @id @default(uuid())
  ranking_id        String
  ranking           Ranking  @relation(fields: [ranking_id], references: [id])
  jogador_id        String
  jogador           User     @relation(fields: [jogador_id], references: [id])
  pontos_total      Int
  posicao           Int
  torneios_jogados  Int
  itm_count         Int      @default(0)
  vitorias          Int      @default(0)
  updated_at        DateTime @updatedAt

  @@unique([ranking_id, jogador_id])
  @@index([ranking_id, posicao])
  @@map("ranking_standings")
}
```

### 9. Estrutura de Blinds

```prisma
// ============================================
// BLIND STRUCTURES
// ============================================

model BlindStructure {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  nome            String
  is_template     Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  levels          BlindLevel[]
  tournaments     Tournament[]
  satellites      Satellite[]

  @@index([organization_id])
  @@map("blind_structures")
}

model BlindLevel {
  id                    String   @id @default(uuid())
  structure_id          String
  structure             BlindStructure @relation(fields: [structure_id], references: [id], onDelete: Cascade)
  nivel                 Int
  small_blind           Int
  big_blind             Int
  ante                  Int      @default(0)
  duracao_minutos       Int
  is_break              Boolean  @default(false)
  break_duracao_minutos Int?
  ordem                 Int

  @@index([structure_id, ordem])
  @@map("blind_levels")
}
```

### 10. Presença, Notificações, WhatsApp, Auditoria

```prisma
// ============================================
// PRESENÇA
// ============================================

model Presence {
  id                String   @id @default(uuid())
  organization_id   String
  organization      Organization @relation(fields: [organization_id], references: [id])
  jogador_id        String
  jogador           User     @relation(fields: [jogador_id], references: [id])
  checkin_at        DateTime @default(now())
  checkout_at       DateTime?
  duracao_minutos   Int?
  dia_operacional   DateTime @db.Date
  registrado_por_id String
  registrado_por    User     @relation("PresenceRegisteredBy", fields: [registrado_por_id], references: [id])
  created_at        DateTime @default(now())

  @@index([organization_id, jogador_id])
  @@index([organization_id, dia_operacional])
  @@map("presences")
}

// ============================================
// NOTIFICAÇÕES
// ============================================

model Notification {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  tipo            NotificationType
  titulo          String
  mensagem        String
  lida            Boolean  @default(false)
  referencia_tipo String?
  referencia_id   String?
  created_at      DateTime @default(now())
  read_at         DateTime?

  @@index([organization_id, user_id, lida])
  @@index([organization_id, created_at])
  @@map("notifications")
}

enum NotificationType {
  BUYIN
  REBUY
  ADDON
  CONTA
  PREMIO
  PAGAMENTO
  SALDO
  INSCRICAO
  RANKING
  RAKEBACK
  SISTEMA
}

// ============================================
// WHATSAPP
// ============================================

model WhatsAppTemplate {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  nome            String
  tipo            WhatsAppTipo
  conteudo        String   // com variáveis: {nome}, {valor}, {data}, {torneio}
  status          TemplateStatus @default(ATIVO)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  logs            WhatsAppLog[]

  @@unique([organization_id, nome])
  @@map("whatsapp_templates")
}

enum WhatsAppTipo {
  COBRANCA
  CONTA_ENCERRADA
  PREMIACAO
  INSCRICAO
  PAGAMENTO
}

enum TemplateStatus {
  ATIVO
  INATIVO
}

model WhatsAppLog {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  template_id     String
  template        WhatsAppTemplate @relation(fields: [template_id], references: [id])
  jogador_id      String
  telefone        String
  mensagem_enviada String
  status          WhatsAppStatus
  enviado_por_id  String?
  enviado_por     User?    @relation(fields: [enviado_por_id], references: [id])
  created_at      DateTime @default(now())

  @@index([organization_id, created_at])
  @@map("whatsapp_logs")
}

enum WhatsAppStatus {
  ENVIADO
  FALHOU
}

// ============================================
// AUDITORIA
// ============================================

model AuditLog {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  acao            String
  entidade        String
  entidade_id     String
  valores_antigos Json?
  valores_novos   Json?
  ip_address      String?
  user_agent      String?
  created_at      DateTime @default(now())

  // SEM updated_at, SEM deleted_at — IMUTÁVEL

  @@index([organization_id, created_at])
  @@index([organization_id, user_id])
  @@index([organization_id, entidade, entidade_id])
  @@map("audit_logs")
}
```

### 11. Templates, Configurações, Fidelidade

```prisma
// ============================================
// TEMPLATES
// ============================================

model Template {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  tipo            TemplateTipo
  nome            String
  dados           Json
  is_favorito     Boolean  @default(false)
  is_padrao       Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([organization_id, tipo])
  @@map("templates")
}

enum TemplateTipo {
  TORNEIO
  BLIND_STRUCTURE
  PREMIACAO
  RANKING
  CASH_GAME
  MENSAGEM
  RELATORIO
  PRODUTO
  CONFIGURACAO
}

// ============================================
// CONFIGURAÇÕES DA CASA
// ============================================

model OrgConfig {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  chave           String
  valor           Json
  updated_at      DateTime @updatedAt

  @@unique([organization_id, chave])
  @@map("org_configs")
}

// ============================================
// PROGRAMA DE FIDELIDADE
// ============================================

model LoyaltyProgram {
  id              String   @id @default(uuid())
  organization_id String
  organization    Organization @relation(fields: [organization_id], references: [id])
  nome            String
  status          LoyaltyStatus @default(INATIVO) // só ativa mediante escolha do admin
  regras          Json     // [{tipo, meta, premio_tipo, premio_valor}]
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  progress        LoyaltyProgress[]

  @@index([organization_id, status])
  @@map("loyalty_programs")
}

enum LoyaltyStatus {
  ATIVO
  INATIVO
}

model LoyaltyProgress {
  id                String   @id @default(uuid())
  program_id        String
  program           LoyaltyProgram @relation(fields: [program_id], references: [id])
  jogador_id        String
  jogador           User     @relation(fields: [jogador_id], references: [id])
  progresso_atual   Int      @default(0)
  meta              Int
  completado        Boolean  @default(false)
  completado_em     DateTime?
  premio_creditado  Boolean  @default(false)
  transaction_id    String?  // FK para LedgerTransaction
  updated_at        DateTime @updatedAt

  @@unique([program_id, jogador_id])
  @@map("loyalty_progress")
}
```

---

## Diagrama de Relacionamentos (Resumo)

```
Organization (1) ──── (N) User
Organization (1) ──── (N) Role
User (N) ──────────── (N) Role         [via UserRole]
User (1) ──────────── (1) Wallet       [jogadores]
User (1) ──────────── (N) Account
Account (1) ───────── (N) AccountItem
Organization (1) ──── (N) LedgerTransaction
Organization (1) ──── (N) CashRegister

Organization (1) ──── (N) Tournament
Tournament (1) ─────── (N) TournamentDay
Tournament (1) ─────── (N) TournamentEntry
TournamentEntry (1) ── (N) TournamentRebuy
TournamentEntry (1) ── (N) TournamentReentry
TournamentEntry (1) ── (N) TournamentAddon
Tournament (1) ─────── (N) TournamentPrize
Tournament (1) ─────── (N) TournamentDeal
Tournament (1) ─────── (1) BlindStructure

Organization (1) ──── (N) Satellite
Satellite (N) ──────── (N) Tournament  [torneios alvo]
Satellite (1) ──────── (N) SatelliteTicket

Organization (1) ──── (N) CashTable
CashTable (1) ──────── (N) CashSession
CashSession (1) ────── (N) CashChipTransaction
CashTable (1) ──────── (N) CashRakeEntry
CashTable (1) ──────── (N) CashTableWaitlist
CashTable (1) ──────── (N) CashTableReservation

Organization (1) ──── (N) Tab
Tab (1) ────────────── (N) TabItem
TabItem (N) ────────── (1) Product
Product (N) ────────── (1) ProductCategory

Organization (1) ──── (N) Ranking
Ranking (1) ────────── (N) RankingPointStructure
Ranking (1) ────────── (N) RankingEntry
Ranking (1) ────────── (N) RankingStanding

Organization (1) ──── (N) BlindStructure
BlindStructure (1) ── (N) BlindLevel

Organization (1) ──── (N) Presence
Organization (1) ──── (N) Notification
Organization (1) ──── (N) WhatsAppTemplate
Organization (1) ──── (N) WhatsAppLog
Organization (1) ──── (N) AuditLog
Organization (1) ──── (N) Template
Organization (1) ──── (N) OrgConfig
Organization (1) ──── (N) LoyaltyProgram
LoyaltyProgram (1) ── (N) LoyaltyProgress
Organization (1) ──── (1) Subscription
```

---

## Regras de Integridade

1. **organization_id** presente em TODAS as tabelas (exceto Subscription que é 1:1)
2. **LedgerTransaction** e **AuditLog** são IMUTÁVEIS — sem UPDATE, sem DELETE
3. **Wallet** saldos são caches — recalculáveis do Ledger
4. **RankingStanding** é cache — recalculável dos RankingEntries
5. **CPF único por organização** — não globalmente (jogador pode estar em múltiplas casas)
6. **E-mail único por organização** — para funcionários/admin
7. **Soft delete NÃO será usado** — registros históricos são mantidos com status (inativo, cancelado)
8. **Cascade delete** apenas em relações de composição (BlindLevel quando BlindStructure é removida, TournamentDay quando Tournament é removido)
9. **Todas as tabelas com índice em organization_id** como primeiro campo dos índices compostos
10. **Decimal(10,2)** para todos os valores monetários — nunca float
