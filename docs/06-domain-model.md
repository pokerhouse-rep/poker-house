# Etapa 6 — Modelagem do Domínio (Domain Model)

## Bounded Contexts (Contextos Delimitados)

O sistema é dividido nos seguintes contextos, cada um com responsabilidades claras:

```
┌─────────────────────────────────────────────────────────┐
│                    PLATAFORMA SaaS                       │
│  ┌───────────┐  ┌───────────┐  ┌──────────────────┐    │
│  │  Tenant   │  │  Billing  │  │   Super Admin    │    │
│  │ Management│  │  (Planos) │  │   (Plataforma)   │    │
│  └───────────┘  └───────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              CONTEXTO DE CADA CASA (Tenant)              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Identity │  │  Poker   │  │ Financial│              │
│  │ & Access │  │Operations│  │  (Ledger)│              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Bar    │  │ Ranking  │  │  Display │              │
│  │& Comanda │  │& Stats   │  │& Realtime│              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Notif.  │  │  Audit   │  │  Config  │              │
│  │& WhatsApp│  │  & Logs  │  │& Template│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## Entidades Principais

### Aggregate Root: Organization (Casa de Poker)
```
Organization
├── id (UUID)
├── cnpj
├── razao_social
├── nome_fantasia
├── endereco
├── telefone
├── email
├── logo_url
├── theme
├── timezone
├── status: ativa | suspensa | cancelada
├── horario_funcionamento
├── created_at
└── updated_at
```
**Responsabilidade:** Raiz de todo o isolamento multi-tenant. TODAS as entidades pertencem a uma Organization.

---

### Aggregate Root: User (Usuário do Sistema)
```
User
├── id (UUID)
├── organization_id (FK)
├── tipo: admin | funcionario | jogador
├── email (login para admin/funcionário)
├── cpf (login para jogador)
├── senha_hash
├── nome
├── telefone
├── data_nascimento
├── endereco
├── foto_url
├── nickname (jogador)
├── status: ativo | inativo | bloqueado
├── tags[] (VIP, regular, novo...)
├── observacoes_internas (visível só funcionários)
├── ultimo_acesso
├── tentativas_login
├── created_at
└── updated_at
```

---

### Aggregate Root: Role (Perfil de Permissão)
```
Role
├── id (UUID)
├── organization_id (FK)
├── nome (Admin, Gerente, Floor, Caixa, Dealer, Barman, Custom)
├── permissions (JSON)
│   ├── modulo
│   ├── acao: criar | ler | editar | deletar | estornar
│   └── habilitado: boolean
├── is_system: boolean (cargos padrão não editáveis)
└── created_at

UserRole (N:N)
├── user_id
├── role_id
└── assigned_at
```

---

### Aggregate Root: Wallet (Carteira do Jogador)
```
Wallet
├── id (UUID)
├── organization_id (FK)
├── jogador_id (FK → User)
├── saldo_disponivel (calculado do ledger)
├── saldo_pendente (calculado)
├── saldo_bloqueado (calculado)
├── saldo_promocional (calculado)
├── saldo_bonus (calculado)
├── saldo_rakeback (calculado)
├── saldo_premiacoes (calculado)
└── updated_at

Nota: os saldos são CACHES calculados a partir do Ledger.
A fonte de verdade é sempre o Ledger.
Recalculáveis a qualquer momento.
```

---

### Aggregate Root: Account (Conta Corrente do Jogador)
```
Account
├── id (UUID)
├── organization_id (FK)
├── jogador_id (FK → User)
├── saldo_devedor (calculado do ledger)
├── status: aberta | fechada
└── updated_at

AccountItem (itens da conta aberta)
├── id (UUID)
├── account_id (FK)
├── tipo: buyin | rebuy | addon | reentrada | bar | cash | outros
├── descricao
├── valor
├── pago: boolean
├── valor_pago
├── transaction_id (FK → LedgerTransaction)
├── created_at
└── paid_at
```

---

### Aggregate Root: LedgerTransaction (Transação Financeira)
```
LedgerTransaction
├── id (UUID)
├── organization_id (FK)
├── tipo: credito | debito
├── categoria: buyin | rebuy | addon | reentrada | rake | chip_dealer
│            | premio | bar | deposito | saque | rakeback | bonus
│            | promocional | estorno | ajuste | sangria | suprimento
│            | pagamento | deal | overlay | fidelidade
├── valor (sempre positivo)
├── saldo_tipo: disponivel | pendente | bloqueado | promocional
│             | bonus | rakeback | premiacoes | null (caixa)
├── jogador_id (FK → User, nullable)
├── funcionario_id (FK → User)
├── referencia_tipo: torneio | mesa_cash | bar | carteira | caixa | ranking
├── referencia_id (UUID)
├── caixa_id (FK → CashRegister)
├── forma_pagamento: dinheiro | pix | cartao_credito | cartao_debito
│                  | transferencia | carteira | null
├── descricao
├── metadata (JSON — dados extras do evento)
├── created_at
└── NUNCA: updated_at, deleted_at (IMUTÁVEL)
```
**Responsabilidade:** Única fonte de verdade financeira. Imutável. Estornos são novas transações, nunca alterações.

---

### Aggregate Root: CashRegister (Caixa)
```
CashRegister
├── id (UUID)
├── organization_id (FK)
├── tipo: torneio | mesa_cash | bar | geral
├── referencia_id (UUID, nullable — id do torneio ou mesa)
├── aberto_por (FK → User)
├── fechado_por (FK → User, nullable)
├── fundo_troco
├── valor_esperado (calculado do ledger)
├── valor_informado (digitado no fechamento)
├── diferenca (calculado)
├── justificativa_diferenca
├── status: aberto | fechado
├── aberto_em
├── fechado_em
└── dia_operacional (date)
```

---

### Aggregate Root: Tournament (Torneio)
```
Tournament
├── id (UUID)
├── organization_id (FK)
├── template_id (FK, nullable)
├── nome
├── status: rascunho | inscricoes_abertas | em_andamento | pausado
│         | finalizado | cancelado
├── buyin_valor
├── rake_valor
├── chip_dealer_valor
├── starting_stack
├── garantido_ativo: boolean
├── garantido_valor
├── late_registration_ativo: boolean
├── late_registration_ate_nivel
├── rebuy_ativo: boolean
├── rebuy_condicao: bust | abaixo_de_x
├── rebuy_condicao_valor (fichas mínimas, se abaixo_de_x)
├── rebuy_maximo
├── rebuy_valor
├── reentrada_ativa: boolean
├── reentrada_maxima
├── reentrada_valor
├── addon_ativo: boolean
├── addon_valor
├── addon_fichas
├── multiday: boolean
├── dia_atual
├── ranking_ids[] (quais rankings pontua)
├── ranking_peso
├── prize_pool (calculado)
├── overlay_valor (calculado)
├── caixa_id (FK → CashRegister)
├── blind_structure_id (FK → BlindStructure)
├── data_inicio
├── data_fim
├── created_at
└── updated_at

TournamentDay (Multi-day)
├── id (UUID)
├── tournament_id (FK)
├── dia_label (1A, 1B, 1C, 2)
├── data
├── status: pendente | em_andamento | finalizado
└── created_at

TournamentEntry (Inscrição)
├── id (UUID)
├── tournament_id (FK)
├── tournament_day_id (FK, nullable)
├── jogador_id (FK → User)
├── tipo: inscricao | reentrada
├── buyin_transaction_id (FK → Ledger)
├── mesa_numero
├── assento_numero
├── stack_atual
├── melhor_stack (multi-day)
├── classificado_dia2: boolean
├── posicao_final (nullable)
├── eliminado: boolean
├── eliminado_em
├── rebuys_realizados
├── addon_realizado: boolean
├── created_at
└── updated_at

TournamentRebuy
├── id (UUID)
├── entry_id (FK → TournamentEntry)
├── transaction_id (FK → Ledger)
├── fichas_recebidas
├── created_at

TournamentAddon
├── id (UUID)
├── entry_id (FK → TournamentEntry)
├── transaction_id (FK → Ledger)
├── fichas_recebidas
├── created_at

TournamentPrize (Premiação)
├── id (UUID)
├── tournament_id (FK)
├── posicao
├── percentual (nullable)
├── valor_fixo (nullable)
├── valor_final
├── jogador_id (FK → User, nullable)
├── transaction_id (FK → Ledger, nullable)
├── is_deal: boolean
├── deal_valor (valor acordado no deal, se diferente)
└── created_at

TournamentDeal
├── id (UUID)
├── tournament_id (FK)
├── jogadores_ids[] 
├── valores_acordados (JSON: {jogador_id: valor})
├── registrado_por (FK → User)
├── created_at
```

---

### Aggregate Root: Satellite (Satélite)
```
Satellite
├── id (UUID)
├── organization_id (FK)
├── nome
├── buyin_valor
├── rake_valor
├── torneio_alvo_ids[] (FK → Tournament)
├── status: inscricoes_abertas | em_andamento | finalizado | cancelado
├── (herda demais campos de Tournament)
└── created_at

SatelliteTicket
├── id (UUID)
├── satellite_id (FK)
├── jogador_id (FK → User)
├── torneio_alvo_id (FK → Tournament)
├── status: ativo | utilizado | transferido | expirado
├── validade
├── transferido_para_id (FK → User, nullable)
├── created_at
└── updated_at
```

---

### Aggregate Root: CashTable (Mesa de Cash)
```
CashTable
├── id (UUID)
├── organization_id (FK)
├── nome
├── modalidade (NL Hold'em, PLO, etc.)
├── stakes (ex: "1/2", "2/5", "5/10")
├── blind_small
├── blind_big
├── buyin_minimo
├── buyin_maximo
├── max_jogadores (6, 8, 9, 10)
├── rake_tipo: pot_rake | time_rake
├── rake_percentual (se pot_rake)
├── rake_cap (se pot_rake)
├── rake_valor_hora (se time_rake)
├── status: fechada | aberta | cheia
├── caixa_id (FK → CashRegister)
├── created_at
└── updated_at

CashTableWaitlist (Lista de Espera)
├── id (UUID)
├── cash_table_id (FK)
├── jogador_id (FK → User)
├── posicao
├── created_at

CashTableReservation (Reserva)
├── id (UUID)
├── cash_table_id (FK)
├── jogador_id (FK → User)
├── assento_numero
├── status: ativa | utilizada | cancelada | expirada
├── expira_em
├── created_at

CashSession (Sessão do Jogador)
├── id (UUID)
├── cash_table_id (FK)
├── jogador_id (FK → User)
├── assento_numero
├── buyin_total (soma das compras de fichas)
├── cashout_total (soma das vendas de fichas)
├── resultado (cashout - buyin)
├── rake_pago
├── dealer_tip
├── inicio
├── fim
├── status: ativa | finalizada
└── created_at

CashChipTransaction (Compra/Venda de Fichas)
├── id (UUID)
├── session_id (FK → CashSession)
├── tipo: compra | venda
├── valor
├── transaction_id (FK → Ledger)
├── created_at

CashRakeEntry (Rake registrado pelo dealer)
├── id (UUID)
├── cash_table_id (FK)
├── session_id (FK → CashSession, nullable)
├── valor
├── registrado_por (FK → User — dealer)
├── transaction_id (FK → Ledger)
├── created_at
```

---

### Aggregate Root: Tab (Comanda)
```
Tab
├── id (UUID)
├── organization_id (FK)
├── jogador_id (FK → User)
├── is_acompanhante: boolean
├── status: aberta | fechada
├── total (calculado)
├── total_pago (calculado)
├── dia_operacional
├── aberta_em
├── fechada_em
└── created_at

TabItem (Item da Comanda)
├── id (UUID)
├── tab_id (FK)
├── produto_id (FK → Product)
├── quantidade
├── valor_unitario
├── valor_total
├── transaction_id (FK → Ledger)
├── created_at
```

---

### Entity: Product (Produto do Bar)
```
Product
├── id (UUID)
├── organization_id (FK)
├── nome
├── categoria_id (FK → ProductCategory)
├── preco
├── status: ativo | inativo
├── created_at
└── updated_at

ProductCategory
├── id (UUID)
├── organization_id (FK)
├── nome (Bebidas, Comidas, Combos, etc.)
├── ordem
└── created_at
```

---

### Aggregate Root: Ranking
```
Ranking
├── id (UUID)
├── organization_id (FK)
├── nome
├── tipo: semestral | anual
├── periodo_inicio
├── periodo_fim
├── status: ativo | finalizado | cancelado
├── desempate_criterios (JSON: ["mais_torneios", "mais_itm", ...])
├── premios (JSON: [{posicao, valor}])
├── created_at
└── updated_at

RankingPointStructure (Pontuação por Posição)
├── id (UUID)
├── ranking_id (FK)
├── posicao
├── pontos
└── created_at

RankingEntry (Pontuação do Jogador)
├── id (UUID)
├── ranking_id (FK)
├── jogador_id (FK → User)
├── tournament_id (FK → Tournament)
├── posicao_no_torneio
├── peso_torneio
├── pontos_base
├── pontos_final (base × peso)
├── created_at

RankingStanding (Classificação Atual — Cache)
├── id (UUID)
├── ranking_id (FK)
├── jogador_id (FK → User)
├── pontos_total
├── posicao
├── torneios_jogados
├── itm_count
├── vitorias
├── updated_at
```

---

### Entity: BlindStructure (Estrutura de Blinds)
```
BlindStructure
├── id (UUID)
├── organization_id (FK)
├── nome
├── is_template: boolean
├── created_at
└── updated_at

BlindLevel
├── id (UUID)
├── structure_id (FK)
├── nivel
├── small_blind
├── big_blind
├── ante
├── duracao_minutos
├── is_break: boolean
├── break_duracao_minutos
└── ordem
```

---

### Aggregate Root: Presence (Controle de Presença)
```
Presence
├── id (UUID)
├── organization_id (FK)
├── jogador_id (FK → User)
├── checkin_at
├── checkout_at (nullable)
├── duracao_minutos (calculado)
├── dia_operacional
├── registrado_por (FK → User)
└── created_at
```

---

### Entity: Notification
```
Notification
├── id (UUID)
├── organization_id (FK)
├── user_id (FK → User — destinatário)
├── tipo: buyin | rebuy | addon | conta | premio | pagamento
│       | saldo | inscricao | ranking | rakeback | sistema
├── titulo
├── mensagem
├── lida: boolean
├── referencia_tipo
├── referencia_id
├── created_at
└── read_at
```

---

### Entity: WhatsAppMessage
```
WhatsAppTemplate
├── id (UUID)
├── organization_id (FK)
├── nome
├── tipo: cobranca | conta_encerrada | premiacao | inscricao | pagamento
├── conteudo (com variáveis: {nome}, {valor}, {data}, {torneio})
├── status: ativo | inativo
├── created_at
└── updated_at

WhatsAppLog
├── id (UUID)
├── organization_id (FK)
├── template_id (FK)
├── jogador_id (FK → User)
├── telefone
├── mensagem_enviada
├── status: enviado | falhou
├── enviado_por (FK → User, nullable — null se automático)
├── created_at
```

---

### Entity: AuditLog
```
AuditLog
├── id (UUID)
├── organization_id (FK)
├── user_id (FK → User)
├── acao: criar | editar | deletar | estornar | login | logout
│       | abrir_caixa | fechar_caixa | ...
├── entidade
├── entidade_id (UUID)
├── valores_antigos (JSON)
├── valores_novos (JSON)
├── ip_address
├── user_agent
├── created_at
└── NUNCA: updated_at, deleted_at (IMUTÁVEL)
```

---

### Entity: Template
```
Template
├── id (UUID)
├── organization_id (FK)
├── tipo: torneio | blind_structure | premiacao | ranking | cash_game
│       | mensagem | relatorio | produto | configuracao
├── nome
├── dados (JSON — conteúdo do template)
├── is_favorito: boolean
├── is_padrao: boolean
├── created_at
└── updated_at
```

---

### Entity: OrgConfig (Configurações da Casa)
```
OrgConfig
├── id (UUID)
├── organization_id (FK)
├── chave
├── valor (JSON)
├── updated_at

Exemplos de chaves:
- rakeback_percentual
- rakeback_periodo: semanal | quinzenal | mensal
- rakeback_progressivo: boolean
- rakeback_tiers: [{min_rake, percentual}]
- fidelidade_ativo: boolean
- fidelidade_regras: [{condicao, premio}]
- pix_chave
- pix_tipo
- whatsapp_numero
- whatsapp_api_url
- alerta_desbalanceamento_fichas: boolean
- alerta_diferenca_caixa_valor
- sessao_expiracao_funcionario_horas
- sessao_expiracao_jogador_horas
- tentativas_login_bloqueio
```

---

### Aggregate Root: LoyaltyProgram (Programa de Fidelidade)
```
LoyaltyProgram
├── id (UUID)
├── organization_id (FK)
├── nome
├── status: ativo | inativo
├── regras (JSON)
│   ├── tipo: torneios_jogados | rake_acumulado | presenca
│   ├── meta (ex: 10)
│   ├── premio_tipo: bonus | buyin_gratis | produto
│   └── premio_valor
├── created_at
└── updated_at

LoyaltyProgress (Progresso do Jogador)
├── id (UUID)
├── program_id (FK)
├── jogador_id (FK → User)
├── progresso_atual
├── meta
├── completado: boolean
├── completado_em
├── premio_creditado: boolean
├── transaction_id (FK → Ledger, nullable)
└── updated_at
```

---

## Mapa de Agregados e Relacionamentos

```
Organization (Raiz de tudo)
│
├── User (admin, funcionário, jogador)
│   ├── UserRole → Role
│   ├── Wallet (1:1 para jogadores)
│   ├── Account (N contas ao longo do tempo)
│   └── Presence (N check-ins)
│
├── Tournament
│   ├── TournamentDay
│   ├── TournamentEntry
│   │   ├── TournamentRebuy
│   │   └── TournamentAddon
│   ├── TournamentPrize
│   ├── TournamentDeal
│   ├── BlindStructure → BlindLevel
│   └── CashRegister (1:1)
│
├── Satellite
│   ├── SatelliteTicket
│   └── (herda estrutura de Tournament)
│
├── CashTable
│   ├── CashSession
│   │   └── CashChipTransaction
│   ├── CashRakeEntry
│   ├── CashTableWaitlist
│   ├── CashTableReservation
│   └── CashRegister (1:1)
│
├── Tab (Comanda)
│   └── TabItem → Product
│
├── Product → ProductCategory
│
├── Ranking
│   ├── RankingPointStructure
│   ├── RankingEntry
│   └── RankingStanding (cache)
│
├── LedgerTransaction (IMUTÁVEL)
│
├── CashRegister
│
├── Notification
├── WhatsAppTemplate / WhatsAppLog
├── AuditLog (IMUTÁVEL)
├── Template
├── OrgConfig
└── LoyaltyProgram → LoyaltyProgress
```

---

## Eventos do Domínio

### Identity & Access
- UsuarioCriado
- UsuarioAtualizado
- UsuarioBloqueado
- UsuarioDesbloqueado
- LoginRealizado
- LoginFalhou
- SenhaAlterada
- PermissaoAlterada

### Carteira
- DepositoRealizado
- SaqueRealizado
- BonusCreditado
- PromocionalCreditado
- RakebackCreditado
- SaldoExpirado
- CompensacaoRealizada (carteira abateu conta corrente)

### Conta Corrente
- ContaAberta
- ItemAdicionado
- PagamentoParcialRegistrado
- ContaFechada

### Torneio
- TorneioCriado
- TorneioAberto
- InscricaoRealizada
- InscricaoOnlineRealizada
- LateRegistrationRealizada
- BuyinRegistrado
- RebuyRealizado
- ReentradaRealizada
- AddonRealizado
- JogadorEliminado
- MesaBalanceada
- MesaQuebrada
- BlindAtualizado
- BreakIniciado
- BreakFinalizado
- ChipCountRegistrado
- PremiacaoSugerida
- PremiacaoConfirmada
- DealRegistrado
- TorneioFinalizado
- TorneioCancelado
- EstornoTorneioRealizado
- OverlayRegistrado

### Satélite
- SateliteCriado
- TicketGanho
- TicketUtilizado
- TicketTransferido
- TicketExpirado

### Cash Game
- MesaAberta
- MesaFechada
- JogadorSentou
- JogadorSaiu
- FichasCompradas
- FichasVendidas
- RakeRegistrado
- CaixinhaRegistrada
- TrocaDeMesaRealizada
- ListaEsperaEntrou
- ListaEsperaSaiu
- ReservaRealizada
- ReservaCancelada
- DesbalanceamentoDetectado

### Caixa
- CaixaAberto
- CaixaFechado
- SangriaRealizada
- SuprimentoRealizado
- DiferencaRegistrada

### Bar
- ComandaAberta
- ItemAdicionadoComanda
- ComandaFechada

### Financeiro (Ledger)
- TransacaoRegistrada
- EstornoRealizado
- PagamentoRecebido
- PagamentoParcialRecebido

### Ranking
- PontuacaoRegistrada
- PontuacaoRemovida (cancelamento de torneio)
- RankingRecalculado
- PremioRankingCreditado

### Rakeback
- RakeApurado
- RakebackCalculado
- RakebackCreditado

### Presença
- CheckinRealizado
- CheckoutRealizado

### Notificação
- NotificacaoCriada
- NotificacaoLida
- WhatsAppEnviado
- WhatsAppFalhou

### Fidelidade
- ProgressoAtualizado
- MetaAtingida
- PremioCreditado

### Auditoria
- LogRegistrado (meta-evento, registra tudo)
