# Etapa 14 — Definição das APIs

## Arquitetura da API

- **Tecnologia:** tRPC (type-safe, end-to-end)
- **Autenticação:** JWT via header Authorization
- **Multi-tenant:** organization_id extraído do JWT (nunca enviado pelo client)
- **Formato:** JSON
- **Erros:** códigos padronizados com mensagens em português

### Estrutura tRPC

```
src/server/
├── trpc.ts                    # Configuração base (context, middleware)
├── routers/
│   ├── _app.ts                # Router raiz (merge de todos)
│   ├── auth.router.ts
│   ├── user.router.ts
│   ├── player.router.ts
│   ├── employee.router.ts
│   ├── role.router.ts
│   ├── wallet.router.ts
│   ├── account.router.ts
│   ├── ledger.router.ts
│   ├── cashRegister.router.ts
│   ├── tournament.router.ts
│   ├── satellite.router.ts
│   ├── cashTable.router.ts
│   ├── tab.router.ts
│   ├── product.router.ts
│   ├── ranking.router.ts
│   ├── rakeback.router.ts
│   ├── presence.router.ts
│   ├── notification.router.ts
│   ├── whatsapp.router.ts
│   ├── template.router.ts
│   ├── config.router.ts
│   ├── loyalty.router.ts
│   ├── display.router.ts
│   ├── report.router.ts
│   ├── audit.router.ts
│   └── platform.router.ts    # Super Admin
└── middleware/
    ├── auth.ts                # Valida JWT
    ├── tenant.ts              # Injeta organization_id
    ├── rbac.ts                # Verifica permissões
    └── rateLimit.ts           # Rate limiting
```

### Middlewares tRPC

```typescript
// Middleware chain para procedures protegidas:
protectedProcedure = t.procedure
  .use(authMiddleware)       // Valida JWT, extrai user
  .use(tenantMiddleware)     // Injeta organization_id no context
  .use(auditMiddleware)      // Registra ação no AuditLog

// Para procedures que exigem role específica:
adminProcedure = protectedProcedure.use(rbacMiddleware(["ADMIN"]))
managerProcedure = protectedProcedure.use(rbacMiddleware(["ADMIN", "GERENTE"]))
playerProcedure = protectedProcedure.use(rbacMiddleware(["JOGADOR"]))

// Procedure pública (login, display):
publicProcedure = t.procedure.use(rateLimitMiddleware)
```

---

## Catálogo Completo de Procedures

### AUTH

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `auth.loginAdmin` | mutation | {email, senha} | {token, refreshToken, user} | public |
| `auth.loginPlayer` | mutation | {cpf, senha, organization_id?} | {token, refreshToken, user} | public |
| `auth.refreshToken` | mutation | {refreshToken} | {token, refreshToken} | public |
| `auth.logout` | mutation | — | {success} | protected |
| `auth.changePassword` | mutation | {senha_atual, nova_senha} | {success} | protected |
| `auth.requestPasswordReset` | mutation | {email_or_cpf} | {success} | public |
| `auth.resetPassword` | mutation | {token, nova_senha} | {success} | public |
| `auth.me` | query | — | {user, roles, permissions} | protected |

### PLAYERS (Jogadores)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `player.list` | query | {search?, status?, tags?, page, limit} | {players[], total} | protected |
| `player.getById` | query | {id} | {player, wallet, stats} | protected |
| `player.create` | mutation | {cpf, nome, telefone, email, data_nascimento, endereco} | {player} | protected (permissão: jogador:criar) |
| `player.update` | mutation | {id, ...campos} | {player} | protected (permissão: jogador:editar) |
| `player.block` | mutation | {id, motivo} | {player} | admin/gerente |
| `player.unblock` | mutation | {id} | {player} | admin/gerente |
| `player.setPassword` | mutation | {id, senha} | {success} | admin/gerente |
| `player.addTag` | mutation | {id, tag} | {player} | protected |
| `player.removeTag` | mutation | {id, tag} | {player} | protected |
| `player.delete` | mutation | {id} | {success} | admin (LGPD) |
| `player.getStats` | query | {id} | {roi, lucro, itm, mesas_finais, vitorias, torneios_jogados} | protected |
| `player.getHistory` | query | {id, tipo?, page, limit} | {items[]} | protected |
| `player.search` | query | {term} | {players[]} | protected |

### EMPLOYEES (Funcionários)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `employee.list` | query | {search?, status?, role?, page, limit} | {employees[], total} | protected |
| `employee.getById` | query | {id} | {employee, roles} | protected |
| `employee.create` | mutation | {nome, email, cpf, telefone, senha, role_ids[]} | {employee} | admin |
| `employee.update` | mutation | {id, ...campos} | {employee} | admin |
| `employee.deactivate` | mutation | {id} | {employee} | admin |
| `employee.activate` | mutation | {id} | {employee} | admin |
| `employee.assignRole` | mutation | {user_id, role_id} | {userRole} | admin |
| `employee.revokeRole` | mutation | {user_id, role_id} | {success} | admin |

### ROLES (Perfis de Permissão)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `role.list` | query | — | {roles[]} | protected |
| `role.getById` | query | {id} | {role, users[]} | admin |
| `role.create` | mutation | {nome, descricao, permissions} | {role} | admin |
| `role.update` | mutation | {id, nome?, descricao?, permissions?} | {role} | admin |
| `role.delete` | mutation | {id} | {success} | admin (não system roles) |

### WALLET (Carteira)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `wallet.getByPlayer` | query | {jogador_id} | {wallet, saldos} | protected |
| `wallet.deposit` | mutation | {jogador_id, valor, forma_pagamento} | {wallet, transaction} | protected (permissão: carteira:deposito) |
| `wallet.withdraw` | mutation | {jogador_id, valor, forma_pagamento} | {wallet, transaction} | protected (permissão: carteira:saque) |
| `wallet.creditBonus` | mutation | {jogador_id, valor, motivo} | {wallet, transaction} | admin/gerente |
| `wallet.creditPromotional` | mutation | {jogador_id, valor, validade, motivo} | {wallet, transaction} | admin/gerente |
| `wallet.getStatement` | query | {jogador_id, saldo_tipo?, from?, to?, page, limit} | {transactions[], total} | protected |
| `wallet.recalculate` | mutation | {jogador_id} | {wallet} | admin |
| `wallet.myWallet` | query | — | {wallet, saldos} | player |
| `wallet.myStatement` | query | {saldo_tipo?, from?, to?, page, limit} | {transactions[]} | player |

### ACCOUNT (Conta Corrente)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `account.getOpen` | query | {jogador_id} | {account, items[]} | protected |
| `account.listOpen` | query | {page, limit} | {accounts[], total} | protected |
| `account.listOverdue` | query | {dias_minimo?, page, limit} | {accounts[], total} | protected |
| `account.pay` | mutation | {account_id, valor, forma_pagamento, item_ids?} | {account, transaction} | protected (permissão: conta:pagar) |
| `account.compensate` | mutation | {account_id, jogador_id} | {account, wallet, transaction} | admin/gerente |
| `account.close` | mutation | {account_id} | {account} | protected |
| `account.getSummary` | query | {jogador_id} | {resumo: torneios, bar, cash, premios, total} | protected |
| `account.myAccounts` | query | — | {accounts[]} | player |

### LEDGER (Financeiro)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `ledger.list` | query | {categoria?, tipo?, jogador_id?, from?, to?, dia_operacional?, page, limit} | {transactions[], total} | protected |
| `ledger.getById` | query | {id} | {transaction} | protected |
| `ledger.refund` | mutation | {transaction_id, motivo} | {refund_transaction} | admin/gerente |
| `ledger.adjust` | mutation | {jogador_id?, tipo, valor, categoria, motivo} | {transaction} | admin |
| `ledger.getDailySummary` | query | {dia_operacional} | {receitas, despesas, resultado, por_categoria} | protected |

### CASH REGISTER (Caixa)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `cashRegister.list` | query | {tipo?, status?, dia_operacional?, page, limit} | {registers[], total} | protected |
| `cashRegister.getById` | query | {id} | {register, transactions[]} | protected |
| `cashRegister.open` | mutation | {tipo, referencia_id?, fundo_troco} | {register} | protected (permissão: caixa:abrir) |
| `cashRegister.close` | mutation | {id, valor_informado, justificativa_diferenca?} | {register} | protected (permissão: caixa:fechar) |
| `cashRegister.withdraw` | mutation | {id, valor, motivo} | {register, transaction} | admin/gerente |
| `cashRegister.supply` | mutation | {id, valor, motivo} | {register, transaction} | admin/gerente |
| `cashRegister.getSummary` | query | {id} | {resumo: entradas, saidas, esperado} | protected |

### TOURNAMENT (Torneios)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `tournament.list` | query | {status?, from?, to?, page, limit} | {tournaments[], total} | protected |
| `tournament.getById` | query | {id} | {tournament, entries[], prizes[], structure} | protected |
| `tournament.create` | mutation | {dados completos ou template_id} | {tournament} | protected (permissão: torneio:criar) |
| `tournament.update` | mutation | {id, ...campos} | {tournament} | protected (somente RASCUNHO) |
| `tournament.openRegistration` | mutation | {id} | {tournament, cashRegister} | protected |
| `tournament.start` | mutation | {id} | {tournament} | protected |
| `tournament.pause` | mutation | {id} | {tournament} | protected |
| `tournament.resume` | mutation | {id} | {tournament} | protected |
| `tournament.finish` | mutation | {id} | {tournament} | protected |
| `tournament.cancel` | mutation | {id} | {tournament, refunds[]} | admin/gerente |
| `tournament.registerEntry` | mutation | {tournament_id, jogador_id, forma_pagamento} | {entry, transaction} | protected (permissão: torneio:inscrever) |
| `tournament.registerOnlineEntry` | mutation | {tournament_id, forma_pagamento: "CARTEIRA" ou "PIX"} | {entry, transaction?} | player |
| `tournament.registerRebuy` | mutation | {entry_id} | {rebuy, transaction} | protected |
| `tournament.registerReentry` | mutation | {entry_id} | {reentry, new_entry, transaction} | protected |
| `tournament.registerAddon` | mutation | {entry_id} | {addon, transaction} | protected |
| `tournament.eliminatePlayer` | mutation | {entry_id} | {entry} | protected |
| `tournament.updateChipCount` | mutation | {tournament_id, chipcounts: [{entry_id, stack}]} | {entries[]} | protected |
| `tournament.suggestPrizes` | query | {tournament_id} | {suggestions: [{posicao, percentual, valor}]} | protected |
| `tournament.confirmPrizes` | mutation | {tournament_id, prizes: [{posicao, valor}]} | {prizes[]} | protected |
| `tournament.payPrize` | mutation | {prize_id, forma_pagamento} | {prize, transaction} | protected |
| `tournament.registerDeal` | mutation | {tournament_id, deal: {jogador_id: valor}} | {deal, prizes[]} | protected |
| `tournament.advanceBlind` | mutation | {tournament_id} | {tournament} | protected |
| `tournament.balanceTables` | query | {tournament_id} | {suggestions: [{from, to, jogador}]} | protected |
| `tournament.applyBalance` | mutation | {tournament_id, moves: [{entry_id, mesa, assento}]} | {entries[]} | protected |
| `tournament.breakTable` | mutation | {tournament_id, mesa_numero} | {redistribuicao[]} | protected |
| `tournament.getAvailable` | query | — | {tournaments[]} | player |
| `tournament.getMyHistory` | query | {page, limit} | {entries[]} | player |

### TOURNAMENT DAY (Multi-day)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `tournamentDay.create` | mutation | {tournament_id, dia_label, data} | {day} | protected |
| `tournamentDay.start` | mutation | {day_id} | {day} | protected |
| `tournamentDay.finish` | mutation | {day_id} | {day, classificados[]} | protected |
| `tournamentDay.getBestStacks` | query | {tournament_id} | {jogadores_classificados[]} | protected |

### SATELLITE (Satélites)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `satellite.list` | query | {status?, page, limit} | {satellites[], total} | protected |
| `satellite.getById` | query | {id} | {satellite, tickets[]} | protected |
| `satellite.create` | mutation | {dados + torneio_alvo_ids} | {satellite} | protected |
| `satellite.finish` | mutation | {id, vencedores: [{jogador_id, torneio_alvo_id}]} | {satellite, tickets[]} | protected |
| `satellite.transferTicket` | mutation | {ticket_id, para_jogador_id} | {ticket} | protected |
| `satellite.useTicket` | mutation | {ticket_id, tournament_id} | {ticket, entry} | protected |
| `satellite.getAvailable` | query | — | {satellites[]} | player |

### CASH TABLE (Mesas de Cash)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `cashTable.list` | query | {status?, modalidade?, page, limit} | {tables[], total} | protected |
| `cashTable.getById` | query | {id} | {table, sessions[], waitlist[]} | protected |
| `cashTable.create` | mutation | {nome, modalidade, stakes, blinds, buyin_min, buyin_max, max_jogadores, rake_config} | {table} | protected |
| `cashTable.open` | mutation | {id} | {table, cashRegister} | protected |
| `cashTable.close` | mutation | {id} | {table, conciliacao} | protected |
| `cashTable.seatPlayer` | mutation | {table_id, jogador_id, assento?, buyin_valor, forma_pagamento} | {session, transaction} | protected |
| `cashTable.buyChips` | mutation | {session_id, valor, forma_pagamento} | {chipTransaction, transaction} | protected |
| `cashTable.cashoutPlayer` | mutation | {session_id, fichas_valor} | {session, transaction} | protected |
| `cashTable.registerRake` | mutation | {table_id, valor} | {rakeEntry, transaction} | protected (dealer) |
| `cashTable.registerTip` | mutation | {session_id, valor} | {transaction} | protected |
| `cashTable.switchTable` | mutation | {session_id, to_table_id, assento?, buyin_valor} | {old_session, new_session} | protected |
| `cashTable.joinWaitlist` | mutation | {table_id, jogador_id} | {waitlistEntry} | protected |
| `cashTable.leaveWaitlist` | mutation | {table_id, jogador_id} | {success} | protected |
| `cashTable.callFromWaitlist` | mutation | {table_id} | {jogador_chamado} | protected |
| `cashTable.reserveSeat` | mutation | {table_id, jogador_id, assento, duracao_minutos} | {reservation} | protected |
| `cashTable.cancelReservation` | mutation | {reservation_id} | {success} | protected |
| `cashTable.getWaitlistForDisplay` | query | — | {tables_with_waitlist[]} | public (display) |

### TAB (Comanda / Bar)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `tab.getOpen` | query | {jogador_id} | {tab, items[]} | protected |
| `tab.listOpen` | query | {dia_operacional?, page, limit} | {tabs[], total} | protected |
| `tab.open` | mutation | {jogador_id, is_acompanhante?} | {tab} | protected |
| `tab.addItem` | mutation | {tab_id, produto_id, quantidade} | {tabItem, transaction} | protected (permissão: bar:vender) |
| `tab.removeItem` | mutation | {tab_item_id, motivo} | {success, refund_transaction} | admin/gerente |
| `tab.close` | mutation | {tab_id} | {tab} | protected |
| `tab.myTab` | query | — | {tab, items[]} | player |

### PRODUCT (Produtos do Bar)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `product.list` | query | {categoria_id?, status?, search?} | {products[]} | protected |
| `product.create` | mutation | {nome, categoria_id, preco} | {product} | admin/gerente |
| `product.update` | mutation | {id, nome?, preco?, status?} | {product} | admin/gerente |
| `product.delete` | mutation | {id} | {success} | admin |
| `productCategory.list` | query | — | {categories[]} | protected |
| `productCategory.create` | mutation | {nome} | {category} | admin/gerente |
| `productCategory.update` | mutation | {id, nome?, ordem?} | {category} | admin/gerente |
| `productCategory.delete` | mutation | {id} | {success} | admin |

### RANKING

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `ranking.list` | query | {status?, page, limit} | {rankings[]} | protected |
| `ranking.getById` | query | {id} | {ranking, standings[], point_structure[]} | protected |
| `ranking.create` | mutation | {nome, tipo, periodo_inicio, periodo_fim, pontuacao[], desempate, premios?} | {ranking} | admin |
| `ranking.update` | mutation | {id, ...campos} | {ranking} | admin |
| `ranking.finish` | mutation | {id} | {ranking, premiacoes[]} | admin |
| `ranking.cancel` | mutation | {id} | {ranking} | admin |
| `ranking.recalculate` | mutation | {id} | {standings[]} | admin |
| `ranking.getStandings` | query | {id, page, limit} | {standings[]} | protected |
| `ranking.getMyPosition` | query | {ranking_id} | {standing} | player |
| `ranking.listActive` | query | — | {rankings[]} | player |

### RAKEBACK

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `rakeback.calculate` | mutation | {periodo_inicio, periodo_fim} | {jogadores_rakeback[]} | admin |
| `rakeback.credit` | mutation | {jogadores_rakeback: [{jogador_id, valor}]} | {transactions[]} | admin |
| `rakeback.getHistory` | query | {jogador_id?, periodo?, page, limit} | {items[]} | protected |
| `rakeback.myRakeback` | query | {page, limit} | {items[]} | player |

### PRESENCE (Controle de Presença)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `presence.checkin` | mutation | {jogador_id} | {presence} | protected |
| `presence.checkout` | mutation | {jogador_id} | {presence} | protected |
| `presence.list` | query | {dia_operacional?, jogador_id?, page, limit} | {presences[]} | protected |
| `presence.getActive` | query | — | {presences[]} | protected |
| `presence.getPlayerFrequency` | query | {jogador_id, from?, to?} | {stats} | protected |

### NOTIFICATION

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `notification.list` | query | {lida?, page, limit} | {notifications[], unread_count} | protected |
| `notification.markRead` | mutation | {id} | {notification} | protected |
| `notification.markAllRead` | mutation | — | {count} | protected |
| `notification.myNotifications` | query | {lida?, page, limit} | {notifications[], unread_count} | player |

### WHATSAPP

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `whatsapp.listTemplates` | query | — | {templates[]} | admin/gerente |
| `whatsapp.createTemplate` | mutation | {nome, tipo, conteudo} | {template} | admin |
| `whatsapp.updateTemplate` | mutation | {id, conteudo?, status?} | {template} | admin |
| `whatsapp.deleteTemplate` | mutation | {id} | {success} | admin |
| `whatsapp.send` | mutation | {template_id, jogador_id, variaveis?} | {log} | protected |
| `whatsapp.sendBulk` | mutation | {template_id, jogador_ids[], variaveis?} | {logs[]} | admin/gerente |
| `whatsapp.getLogs` | query | {jogador_id?, status?, page, limit} | {logs[]} | protected |

### TEMPLATE

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `template.list` | query | {tipo?} | {templates[]} | protected |
| `template.getById` | query | {id} | {template} | protected |
| `template.create` | mutation | {tipo, nome, dados} | {template} | protected |
| `template.update` | mutation | {id, nome?, dados?} | {template} | protected |
| `template.delete` | mutation | {id} | {success} | protected |
| `template.duplicate` | mutation | {id, novo_nome} | {template} | protected |
| `template.setDefault` | mutation | {id} | {template} | protected |
| `template.setFavorite` | mutation | {id, is_favorito} | {template} | protected |

### CONFIG (Configurações)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `config.getAll` | query | — | {configs[]} | admin |
| `config.get` | query | {chave} | {config} | admin |
| `config.set` | mutation | {chave, valor} | {config} | admin |
| `config.setBulk` | mutation | {configs: [{chave, valor}]} | {configs[]} | admin |

### LOYALTY (Fidelidade)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `loyalty.list` | query | — | {programs[]} | admin |
| `loyalty.create` | mutation | {nome, regras} | {program} | admin |
| `loyalty.update` | mutation | {id, nome?, regras?, status?} | {program} | admin |
| `loyalty.activate` | mutation | {id} | {program} | admin |
| `loyalty.deactivate` | mutation | {id} | {program} | admin |
| `loyalty.getProgress` | query | {program_id?, jogador_id?} | {progress[]} | protected |
| `loyalty.myProgress` | query | — | {progress[]} | player |

### DISPLAY (Tournament Display)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `display.getTournamentState` | query | {tournament_id} | {state completo para display} | public (token) |
| `display.getCashWaitlists` | query | — | {tables_with_waitlist[]} | public (token) |
| `display.generateToken` | mutation | {tipo: "tournament" ou "cash", referencia_id?} | {token, url} | protected |

### REPORT (Relatórios)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `report.financialDaily` | query | {dia_operacional} | {resumo, detalhes} | admin/gerente |
| `report.financialMonthly` | query | {mes, ano} | {resumo, detalhes} | admin/gerente |
| `report.financialPeriod` | query | {from, to} | {resumo, detalhes} | admin/gerente |
| `report.rakeByPeriod` | query | {from, to, tipo?: "torneio"\|"cash"} | {detalhes} | admin/gerente |
| `report.rakebackDistributed` | query | {from, to} | {detalhes} | admin/gerente |
| `report.overdue` | query | {dias_minimo?} | {jogadores_inadimplentes[]} | admin/gerente |
| `report.playerFrequency` | query | {from, to, limit?} | {jogadores_frequencia[]} | admin/gerente |
| `report.topRevenuePlayers` | query | {from, to, limit?} | {jogadores_rentaveis[]} | admin/gerente |
| `report.tournamentSummary` | query | {tournament_id} | {resumo_completo} | protected |
| `report.cashTableSummary` | query | {table_id} | {resumo_completo} | protected |
| `report.barSales` | query | {from, to} | {vendas_por_produto[], total} | admin/gerente |
| `report.overlayHistory` | query | {from, to} | {torneios_com_overlay[]} | admin/gerente |
| `report.employeeActions` | query | {employee_id, from, to} | {acoes[]} | admin |
| `report.exportPdf` | mutation | {report_type, params} | {pdf_url} | admin/gerente |
| `report.exportCsv` | mutation | {report_type, params} | {csv_url} | admin/gerente |

### AUDIT (Auditoria)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `audit.list` | query | {user_id?, entidade?, acao?, from?, to?, search?, page, limit} | {logs[], total} | admin |
| `audit.getById` | query | {id} | {log} | admin |
| `audit.export` | mutation | {from, to, filtros?} | {csv_url} | admin |

### PLATFORM (Super Admin — Plataforma)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `platform.listOrgs` | query | {status?, search?, page, limit} | {orgs[], total} | superadmin |
| `platform.getOrg` | query | {id} | {org, subscription, stats} | superadmin |
| `platform.createOrg` | mutation | {cnpj, razao_social, nome_fantasia, email, admin_data} | {org, admin_user} | superadmin |
| `platform.suspendOrg` | mutation | {id, motivo} | {org} | superadmin |
| `platform.activateOrg` | mutation | {id} | {org} | superadmin |
| `platform.cancelOrg` | mutation | {id} | {org} | superadmin |
| `platform.updateSubscription` | mutation | {org_id, plano, valor} | {subscription} | superadmin |
| `platform.getDashboard` | query | — | {total_orgs, total_players, total_tournaments, revenue} | superadmin |
| `platform.broadcast` | mutation | {titulo, mensagem} | {count} | superadmin |

### DASHBOARD (Consultas agregadas)

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `dashboard.admin` | query | — | {kpis: receita_dia, jogadores_ativos, torneios_ativos, cash_abertas, contas_abertas} | protected |
| `dashboard.operations` | query | — | {torneios[], cash_tables[], caixas[], contas_abertas_count} | protected |
| `dashboard.player` | query | — | {wallet, stats, proximos_torneios, contas_abertas} | player |

---

## Observações de Inscrição Online (Ajuste aprovado)

### tournament.registerOnlineEntry

```
Input: {
  tournament_id: string
  forma_pagamento: "CARTEIRA" | "PIX"
}

Se CARTEIRA:
  → Verifica saldo, debita automaticamente
  → Entry criada imediatamente
  → Status: CONFIRMADA

Se PIX:
  → Entry criada com status PENDENTE_PAGAMENTO
  → Sistema retorna dados do PIX da casa (chave, valor)
  → Jogador faz PIX e envia comprovante via WhatsApp da casa
  → Funcionário confirma no sistema:
    tournament.confirmOnlinePayment({entry_id, transaction_ref})
  → Entry muda para CONFIRMADA
  → Se não confirmar em X horas → entry cancelada automaticamente
```

Procedure adicional:

| Procedure | Tipo | Input | Output | Acesso |
|-----------|------|-------|--------|--------|
| `tournament.confirmOnlinePayment` | mutation | {entry_id} | {entry, transaction} | protected |
| `tournament.cancelPendingEntry` | mutation | {entry_id} | {success} | protected |
| `tournament.listPendingPayments` | query | — | {entries_pendentes[]} | protected |

---

## Padrão de Resposta de Erro

```typescript
{
  code: "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" 
      | "BUSINESS_RULE_ERROR" | "INSUFFICIENT_BALANCE" | "CONFLICT" 
      | "INTERNAL_ERROR",
  message: "Mensagem em português para o usuário",
  details?: {
    field?: string,
    expected?: any,
    received?: any
  }
}
```

---

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| auth.login* | 5 req/min por IP |
| auth.requestPasswordReset | 3 req/hora por IP |
| *.list / *.get* (queries) | 60 req/min por usuário |
| *.create / *.update (mutations) | 30 req/min por usuário |
| display.* | 120 req/min por token (atualização frequente) |
| report.export* | 5 req/min por usuário |
