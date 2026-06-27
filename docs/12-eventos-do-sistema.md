# Etapa 12 — Eventos do Sistema

## Arquitetura de Eventos

Cada ação no sistema emite um evento tipado. Os módulos assinam eventos de outros módulos via Event Bus interno (in-process). Isso garante desacoplamento — o módulo de torneio não precisa saber que o módulo de notificação existe.

```
Ação do usuário
    → Service executa lógica + persiste no banco (transação atômica)
    → Emite evento tipado
    → Event Bus distribui para assinantes
    → Assinantes executam side effects (async, não bloqueiam resposta)
```

### Regra fundamental
- A **persistência** (ledger, banco) acontece DENTRO da transação (síncrona)
- Os **side effects** (notificação, display, WhatsApp, auditoria) acontecem DEPOIS do commit (assíncrona)
- Se um side effect falhar, a operação principal NÃO é revertida

---

## Catálogo Completo de Eventos

### IDENTITY & ACCESS

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `user.created` | {user, tipo, organization_id} | Audit, Notification (boas-vindas) |
| `user.updated` | {user, changes, old_values} | Audit |
| `user.blocked` | {user, motivo} | Audit, Notification |
| `user.unblocked` | {user} | Audit, Notification |
| `user.deleted` | {user_id, anonymized} | Audit |
| `auth.login.success` | {user, ip, user_agent} | Audit |
| `auth.login.failed` | {cpf_or_email, ip, attempts} | Audit, Security (bloqueio) |
| `auth.password.changed` | {user} | Audit, Notification |
| `auth.session.expired` | {user} | Audit |
| `role.created` | {role} | Audit |
| `role.updated` | {role, changes} | Audit |
| `role.assigned` | {user, role} | Audit, Notification |
| `role.revoked` | {user, role} | Audit |

### CARTEIRA (WALLET)

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `wallet.deposit` | {jogador, valor, forma_pagamento, transaction} | Audit, Notification, Realtime (saldo), CashRegister |
| `wallet.withdraw` | {jogador, valor, forma_pagamento, transaction} | Audit, Notification, Realtime (saldo), CashRegister |
| `wallet.bonus.credited` | {jogador, valor, motivo, transaction} | Audit, Notification, Realtime |
| `wallet.promotional.credited` | {jogador, valor, validade, transaction} | Audit, Notification, Realtime |
| `wallet.rakeback.credited` | {jogador, valor, periodo, transaction} | Audit, Notification, Realtime |
| `wallet.balance.expired` | {jogador, tipo_saldo, valor_expirado} | Audit, Notification, Realtime |
| `wallet.compensation` | {jogador, valor, de: "carteira", para: "conta_corrente"} | Audit, Notification, Realtime |

### CONTA CORRENTE (ACCOUNT)

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `account.opened` | {jogador, dia_operacional} | Audit |
| `account.item.added` | {account, item, tipo, valor} | Audit, Realtime (conta) |
| `account.payment.partial` | {account, valor_pago, saldo_restante, forma_pagamento} | Audit, Notification, Ledger, CashRegister, Realtime |
| `account.closed` | {account, total, total_pago} | Audit, Notification |
| `account.suggestion.close` | {jogador, resumo_conta} | Realtime (tela do caixa) |

### TORNEIO (TOURNAMENT)

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `tournament.created` | {tournament} | Audit |
| `tournament.opened` | {tournament} | Audit, Notification (jogadores), Realtime (display) |
| `tournament.started` | {tournament} | Audit, Realtime (display) |
| `tournament.paused` | {tournament} | Audit, Realtime (display — modo break) |
| `tournament.resumed` | {tournament} | Audit, Realtime (display) |
| `tournament.finished` | {tournament, resultados} | Audit, Ranking, Notification, Realtime |
| `tournament.cancelled` | {tournament, inscritos} | Audit, Ledger (estornos), Wallet, Ranking (remover pontos), Notification |
| `tournament.entry.registered` | {entry, jogador, tournament, transaction} | Audit, Ledger, Wallet/Account, CashRegister, Notification, Realtime (display — jogadores), Ranking |
| `tournament.entry.online` | {entry, jogador, tournament} | Audit, Notification (admin), Realtime |
| `tournament.rebuy` | {entry, jogador, tournament, transaction, fichas} | Audit, Ledger, Wallet/Account, CashRegister, Notification, Realtime (display — rebuys) |
| `tournament.reentry` | {entry, jogador, tournament, transaction, novo_assento} | Audit, Ledger, Wallet/Account, CashRegister, Notification, Realtime (display) |
| `tournament.addon` | {entry, jogador, tournament, transaction, fichas} | Audit, Ledger, Wallet/Account, CashRegister, Notification, Realtime (display — addons) |
| `tournament.player.eliminated` | {entry, jogador, posicao, tournament} | Audit, Realtime (display — jogadores restantes), Account (sugerir fechamento) |
| `tournament.table.balanced` | {tournament, mesas, movimentos} | Audit, Realtime (display) |
| `tournament.table.broken` | {tournament, mesa_removida, redistribuicao} | Audit, Realtime (display) |
| `tournament.blind.changed` | {tournament, nivel, small, big, ante} | Realtime (display — atualiza blind) |
| `tournament.break.started` | {tournament, duracao} | Realtime (display — modo break) |
| `tournament.break.ended` | {tournament} | Realtime (display) |
| `tournament.chipcount` | {tournament, chipcount: [{jogador, stack}]} | Realtime (display) |
| `tournament.prize.suggested` | {tournament, sugestao: [{posicao, valor}]} | Realtime (tela admin) |
| `tournament.prize.confirmed` | {tournament, premiacoes} | Audit |
| `tournament.prize.paid` | {jogador, tournament, posicao, valor, transaction} | Audit, Ledger, Wallet, Notification, Realtime |
| `tournament.deal.registered` | {tournament, jogadores, valores} | Audit, Notification, Realtime |
| `tournament.overlay` | {tournament, valor_overlay} | Audit, Alert (admin), Ledger |

### SATÉLITE (SATELLITE)

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `satellite.created` | {satellite, torneios_alvo} | Audit |
| `satellite.finished` | {satellite, vencedores} | Audit, Notification |
| `satellite.ticket.won` | {ticket, jogador, torneio_alvo} | Audit, Notification, Realtime |
| `satellite.ticket.used` | {ticket, jogador, torneio} | Audit, Notification |
| `satellite.ticket.transferred` | {ticket, de_jogador, para_jogador} | Audit, Notification (ambos) |
| `satellite.ticket.expired` | {ticket, jogador} | Audit, Notification |
| `satellite.surplus.paid` | {jogador, valor, transaction} | Audit, Ledger, Wallet, Notification |

### CASH GAME

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `cash.table.opened` | {table} | Audit, Realtime (dashboard, display) |
| `cash.table.closed` | {table, resumo} | Audit, Realtime, CashRegister |
| `cash.table.status.changed` | {table, old_status, new_status} | Realtime (waitlist no display) |
| `cash.player.seated` | {session, jogador, table, assento, buyin} | Audit, Ledger, Wallet/Account, CashRegister, Realtime (dashboard) |
| `cash.player.left` | {session, jogador, table, resultado} | Audit, Ledger, Wallet/Account, CashRegister, Realtime, Account (sugerir fechamento) |
| `cash.chips.bought` | {session, jogador, valor, transaction} | Audit, Ledger, CashRegister, Realtime |
| `cash.chips.sold` | {session, jogador, valor, transaction} | Audit, Ledger, CashRegister, Realtime |
| `cash.rake.registered` | {table, valor, dealer, transaction} | Audit, Ledger, CashRegister |
| `cash.dealer.tip` | {table, session, valor, transaction} | Audit, Ledger, CashRegister |
| `cash.table.switch` | {jogador, from_table, to_table, old_session, new_session} | Audit, Realtime |
| `cash.waitlist.joined` | {table, jogador, posicao} | Audit, Realtime (display — waitlist) |
| `cash.waitlist.left` | {table, jogador} | Audit, Realtime |
| `cash.waitlist.called` | {table, jogador} | Notification, Realtime |
| `cash.reservation.created` | {table, jogador, assento, expira_em} | Audit, Realtime |
| `cash.reservation.cancelled` | {table, jogador} | Audit, Realtime |
| `cash.reservation.expired` | {table, jogador} | Audit, Notification, Realtime |
| `cash.imbalance.detected` | {table, esperado, real, diferenca} | Alert (admin), Audit |

### CAIXA (CASH REGISTER)

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `cashregister.opened` | {caixa, tipo, aberto_por, fundo_troco} | Audit |
| `cashregister.closed` | {caixa, valor_esperado, valor_informado, diferenca} | Audit, Alert (se diferença > X) |
| `cashregister.withdrawal` | {caixa, valor, motivo} | Audit, Ledger |
| `cashregister.supply` | {caixa, valor, motivo} | Audit, Ledger |
| `cashregister.difference.alert` | {caixa, diferenca, justificativa} | Alert (admin), Audit |

### BAR / COMANDA

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `tab.opened` | {tab, jogador, is_acompanhante} | Audit |
| `tab.item.added` | {tab, item, produto, quantidade, valor} | Audit, Ledger, Account/Wallet, CashRegister (bar), Realtime |
| `tab.closed` | {tab, total, total_pago} | Audit |

### RANKING

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `ranking.points.registered` | {ranking, jogador, tournament, pontos} | Audit, Realtime (ranking) |
| `ranking.points.removed` | {ranking, tournament, motivo} | Audit, Realtime (ranking) |
| `ranking.recalculated` | {ranking, standings} | Audit, Notification (top N mudou), Realtime |
| `ranking.finished` | {ranking, standings_final} | Audit, Notification |
| `ranking.prize.credited` | {ranking, jogador, posicao, valor, transaction} | Audit, Ledger, Wallet, Notification |

### RAKEBACK

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `rakeback.calculated` | {periodo, jogadores_rake: [{jogador, rake_total, rakeback_valor}]} | Audit |
| `rakeback.credited` | {jogador, valor, periodo, transaction} | Audit, Wallet, Notification, Realtime |

### PRESENÇA

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `presence.checkin` | {jogador, registrado_por, dia_operacional} | Audit |
| `presence.checkout` | {jogador, duracao_minutos} | Audit |

### NOTIFICAÇÃO

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `notification.created` | {notification, user} | Realtime (push para portal do jogador) |
| `notification.read` | {notification} | — |

### WHATSAPP

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `whatsapp.sent` | {log, jogador, template} | Audit |
| `whatsapp.failed` | {log, jogador, erro} | Audit, Alert (admin) |

### FIDELIDADE

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `loyalty.progress.updated` | {program, jogador, progresso, meta} | Realtime |
| `loyalty.goal.reached` | {program, jogador} | Audit, Notification |
| `loyalty.prize.credited` | {program, jogador, premio, transaction} | Audit, Wallet, Notification, Realtime |

### PLATAFORMA (SUPER ADMIN)

| Evento | Payload | Assinantes |
|--------|---------|------------|
| `platform.org.created` | {organization} | Audit (plataforma) |
| `platform.org.suspended` | {organization, motivo} | Audit, Notification (admin da casa) |
| `platform.org.cancelled` | {organization} | Audit |
| `platform.subscription.changed` | {organization, plano_anterior, plano_novo} | Audit, Notification |
| `platform.subscription.overdue` | {organization} | Audit, Notification, Alert |

---

## Mapa de Assinantes por Módulo

Cada módulo assina os eventos relevantes:

### AuditModule
**Assina:** TODOS os eventos
**Ação:** Registra AuditLog com payload completo

### NotificationModule
**Assina:** Eventos que afetam jogadores/funcionários
**Ação:** Cria Notification no banco + envia via Realtime

### RealtimeModule
**Assina:** Eventos que afetam displays/dashboards
**Ação:** Publica via Supabase Realtime para canais específicos

### LedgerModule
**Assina:** Eventos financeiros (buy-in, rebuy, pagamento, etc.)
**Ação:** Cria LedgerTransaction (já feito na transação atômica, o evento serve para recalcular caches)

### WalletModule
**Assina:** Eventos que afetam saldo
**Ação:** Recalcula cache de saldos na tabela Wallet

### RankingModule
**Assina:** `tournament.finished`, `tournament.cancelled`
**Ação:** Calcula/remove pontuação, recalcula standings

### AlertModule
**Assina:** Eventos de alerta (imbalance, diferença de caixa, overlay)
**Ação:** Notifica admin/gerente via Notification + Realtime

### AccountModule
**Assina:** `tournament.player.eliminated`, `cash.player.left`
**Ação:** Verifica se jogador tem conta aberta e sugere fechamento

---

## Fluxo Completo: Buy-in com Conta Corrente

```
Funcionário clica "Inscrever Jogador"
│
├─ [SÍNCRONO — dentro da transação DB]
│  ├─ Verifica torneio aberto para inscrições
│  ├─ Verifica jogador não inscrito
│  ├─ Cria TournamentEntry
│  ├─ Cria LedgerTransaction (DEBITO, BUYIN, jogador)
│  ├─ Cria LedgerTransaction (CREDITO, RAKE, caixa torneio)
│  ├─ Cria LedgerTransaction (CREDITO, CHIP_DEALER, caixa torneio)
│  ├─ Cria AccountItem (BUYIN, R$150, pago: false)
│  ├─ Atualiza CashRegister (valor_esperado += buyin)
│  ├─ Atualiza Tournament (total_inscritos++, prize_pool += buyin - rake - chip_dealer)
│  └─ COMMIT
│
├─ [ASSÍNCRONO — após commit]
│  ├─ Emite evento "tournament.entry.registered"
│  │
│  ├─ AuditModule → cria AuditLog
│  ├─ NotificationModule → cria Notification para jogador
│  ├─ RealtimeModule → atualiza Tournament Display (jogadores restantes)
│  ├─ RealtimeModule → atualiza Dashboard (total inscritos)
│  └─ RealtimeModule → atualiza saldo/conta do jogador no portal
│
└─ Response 201 → {entry, transaction_id}
```

## Fluxo Completo: Buy-in com Carteira

```
Funcionário clica "Inscrever Jogador" (pagamento via carteira)
│
├─ [SÍNCRONO — dentro da transação DB]
│  ├─ Verifica torneio aberto
│  ├─ Verifica saldo suficiente na carteira (ordem de prioridade)
│  │   1. Saldo promocional (se houver, usa primeiro)
│  │   2. Saldo bônus
│  │   3. Saldo rakeback
│  │   4. Saldo disponível
│  │   5. Saldo premiações
│  ├─ Cria TournamentEntry
│  ├─ Cria LedgerTransaction (DEBITO, BUYIN, jogador, saldo_tipo: DISPONIVEL)
│  ├─ Cria LedgerTransaction (CREDITO, RAKE, caixa)
│  ├─ Cria LedgerTransaction (CREDITO, CHIP_DEALER, caixa)
│  ├─ Atualiza Wallet (saldo -= buyin)
│  ├─ Atualiza CashRegister
│  ├─ Atualiza Tournament
│  └─ COMMIT
│
├─ [ASSÍNCRONO]
│  ├─ Emite "tournament.entry.registered"
│  ├─ Emite "wallet.balance.changed"
│  └─ (mesmos assinantes)
│
└─ Response 201
```

## Fluxo Completo: Fechamento de Conta

```
Funcionário clica "Fechar Conta" do jogador
│
├─ Sistema mostra resumo:
│  ├─ Torneios: R$150 (buy-in) + R$50 (rebuy) = R$200
│  ├─ Bar: R$82
│  ├─ Cash: comprou R$500, vendeu R$800 = +R$300
│  ├─ Prêmio torneio: -R$1.000
│  ├─ TOTAL: R$200 + R$82 - R$300 - R$1.000 = -R$1.018 (casa deve ao jogador)
│  └─ Ou se invertido: jogador deve à casa
│
├─ Funcionário confirma forma de pagamento
│
├─ [SÍNCRONO]
│  ├─ Cria LedgerTransaction (PAGAMENTO)
│  ├─ Atualiza AccountItems (pago: true)
│  ├─ Atualiza Account (status: FECHADA)
│  ├─ Atualiza CashRegister
│  └─ Se jogador optou por deixar na carteira:
│     ├─ Cria LedgerTransaction (DEPOSITO, DISPONIVEL)
│     └─ Atualiza Wallet
│  └─ COMMIT
│
├─ [ASSÍNCRONO]
│  ├─ Emite "account.closed"
│  ├─ Emite "wallet.deposit" (se aplicável)
│  └─ NotificationModule, AuditModule, RealtimeModule
│
└─ Response 200
```
