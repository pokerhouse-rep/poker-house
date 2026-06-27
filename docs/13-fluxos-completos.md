# Etapa 13 — Fluxos Completos de Cada Módulo

---

## Módulo 1 — Autenticação e Acesso

### Fluxo 1.1: Login Admin/Funcionário
```
1. Usuário informa e-mail + senha
2. Sistema busca User por (organization_id, email)
3. Se não encontrar → erro "Credenciais inválidas"
4. Se status = BLOQUEADO → erro "Conta bloqueada, contate o administrador"
5. Compara senha_hash (bcrypt)
6. Se incorreta:
   a. Incrementa tentativas_login
   b. Se tentativas >= config.tentativas_login_bloqueio → bloqueia conta
   c. Emite auth.login.failed
   d. Erro "Credenciais inválidas"
7. Se correta:
   a. Reseta tentativas_login = 0
   b. Gera JWT {user_id, organization_id, tipo, roles}
   c. Atualiza ultimo_acesso
   d. Emite auth.login.success
   e. Retorna JWT + refresh token
```

### Fluxo 1.2: Login Jogador
```
1. Jogador informa CPF + senha
2. Jogador seleciona a casa (se CPF existe em múltiplas casas)
   OU casa é identificada pelo domínio/URL
3. Sistema busca User por (organization_id, cpf, tipo: JOGADOR)
4. Se status != ATIVO → erro
5. Verifica se admin liberou acesso (tem senha cadastrada)
6. Mesma validação de senha e bloqueio do fluxo 1.1
7. JWT com tipo: JOGADOR (permissões reduzidas)
```

### Fluxo 1.3: Recuperação de Senha
```
1. Usuário informa e-mail (admin/func) ou CPF (jogador)
2. Sistema gera token temporário (expira em 1h)
3. Envia link por e-mail
4. Usuário clica no link, informa nova senha
5. Sistema atualiza senha_hash
6. Invalida todas as sessões ativas
7. Emite auth.password.changed
```

---

## Módulo 2 — Gestão de Jogadores

### Fluxo 2.1: Cadastro de Jogador
```
1. Funcionário preenche: CPF, nome, telefone, e-mail, data_nascimento, endereço
2. Validações:
   a. CPF válido (algoritmo de validação)
   b. CPF único na organização
   c. Data de nascimento → idade >= 18 anos (senão bloqueia)
   d. Telefone no formato válido
   e. E-mail no formato válido
3. Cria User (tipo: JOGADOR, status: ATIVO)
4. Cria Wallet (todos os saldos = 0)
5. Funcionário opcionalmente define senha para liberar acesso ao portal
6. Emite user.created
```

### Fluxo 2.2: Liberar Acesso ao Portal
```
1. Admin seleciona jogador
2. Define senha temporária
3. Jogador recebe notificação/WhatsApp com credenciais
4. No primeiro login, pode alterar senha
```

### Fluxo 2.3: Exclusão de Jogador (LGPD)
```
1. Jogador solicita exclusão
2. Sistema verifica:
   a. Sem contas em aberto
   b. Sem saldo na carteira (se houver, devolver primeiro)
   c. Sem inscrições ativas em torneios
3. Anonimiza dados pessoais:
   a. nome → "Jogador Removido #hash"
   b. cpf → null
   c. telefone → null
   d. e-mail → null
   e. endereco → null
   f. foto_url → remove arquivo do storage
4. Mantém: LedgerTransactions, AuditLogs, RankingEntries (com referência anônima)
5. Status → INATIVO
6. Emite user.deleted
```

---

## Módulo 3 — Torneios

### Fluxo 3.1: Criar Torneio
```
1. Admin/Floor preenche dados ou seleciona template
2. Se template: carrega dados do template, permite editar
3. Define:
   - Nome, buy-in, rake, chip dealer
   - Estrutura de blinds (seleciona ou cria)
   - Starting stack
   - Late registration (sim/não, até qual nível)
   - Rebuy (sim/não, condição, máximo, valor, fichas)
   - Reentrada (sim/não, máximo, valor, fichas)
   - Add-on (sim/não, valor, fichas)
   - Garantido (sim/não, valor)
   - Multi-day (sim/não, configurar dias)
   - Rankings que pontua + peso
4. Status = RASCUNHO
5. Emite tournament.created
```

### Fluxo 3.2: Abrir Inscrições
```
1. Admin muda status para INSCRICOES_ABERTAS
2. Cria CashRegister (tipo: TORNEIO) e abre
3. Torneio aparece no portal do jogador (inscrição online)
4. Emite tournament.opened
5. Display/dashboard atualizam
```

### Fluxo 3.3: Inscrever Jogador (Presencial)
```
1. Funcionário busca jogador (nome ou CPF)
2. Sistema verifica:
   a. Torneio em INSCRICOES_ABERTAS ou EM_ANDAMENTO (late reg)
   b. Se EM_ANDAMENTO: nível atual <= late_registration_ate_nivel
   c. Jogador não está inscrito (exceto se reentrada)
3. Define forma de pagamento:
   a. CARTEIRA → verifica saldo, ordem de prioridade, debita
   b. CONTA_CORRENTE → cria AccountItem (pago: false)
   c. DINHEIRO/PIX/CARTÃO → registra pagamento direto
4. [TRANSAÇÃO ATÔMICA]
   a. Cria TournamentEntry (tipo: INSCRICAO)
   b. Cria LedgerTransaction DEBITO BUYIN (jogador)
   c. Cria LedgerTransaction CREDITO RAKE (caixa torneio)
   d. Cria LedgerTransaction CREDITO CHIP_DEALER (caixa torneio)
   e. Atualiza prize_pool, total_inscritos
   f. Atualiza Wallet ou Account
   g. Atualiza CashRegister
   h. COMMIT
5. Atribui mesa e assento (balanceamento automático)
6. Emite tournament.entry.registered
```

### Fluxo 3.4: Inscrição Online (Portal do Jogador)
```
1. Jogador vê torneios disponíveis no portal
2. Clica "Inscrever-se"
3. Pagamento SOMENTE via carteira (precisa ter saldo)
4. Se saldo insuficiente → erro "Saldo insuficiente, deposite na casa"
5. Mesma transação atômica do fluxo 3.3
6. Mesa e assento atribuídos quando chegar na casa
7. Emite tournament.entry.online
```

### Fluxo 3.5: Rebuy
```
1. Funcionário seleciona jogador no torneio
2. Sistema verifica:
   a. Rebuy ativo no torneio
   b. Condição atendida (bust ou abaixo de X fichas)
   c. Rebuys realizados < rebuy_maximo
3. [TRANSAÇÃO ATÔMICA]
   a. Cria TournamentRebuy
   b. Cria LedgerTransaction DEBITO REBUY
   c. Incrementa entry.rebuys_realizados
   d. Incrementa tournament.total_rebuys
   e. Atualiza prize_pool += rebuy_valor - rake
   f. Atualiza Wallet/Account/CashRegister
   g. COMMIT
4. Emite tournament.rebuy
```

### Fluxo 3.6: Reentrada
```
1. Jogador foi eliminado e deseja reentrada
2. Sistema verifica:
   a. Reentrada ativa no torneio
   b. Reentradas realizadas < reentrada_maxima
   c. Jogador está eliminado
3. [TRANSAÇÃO ATÔMICA]
   a. Cria TournamentReentry (novo assento)
   b. Cria LedgerTransaction DEBITO REENTRADA
   c. Entry: eliminado = false, novo assento
   d. Incrementa tournament.total_reentradas
   e. Atualiza prize_pool
   f. Atualiza Wallet/Account/CashRegister
   g. COMMIT
4. Emite tournament.reentry
```

### Fluxo 3.7: Add-on
```
1. Geralmente disponível no break
2. Funcionário seleciona jogador
3. Sistema verifica:
   a. Add-on ativo no torneio
   b. Jogador não fez add-on ainda (addon_realizado = false)
4. [TRANSAÇÃO ATÔMICA]
   a. Cria TournamentAddon
   b. Cria LedgerTransaction DEBITO ADDON
   c. Entry: addon_realizado = true
   d. Incrementa tournament.total_addons
   e. Atualiza prize_pool += addon_valor
   f. Atualiza Wallet/Account/CashRegister
   g. COMMIT
5. Emite tournament.addon
```

### Fluxo 3.8: Eliminação de Jogador
```
1. Funcionário marca jogador como eliminado
2. Sistema:
   a. Entry: eliminado = true, eliminado_em = now()
   b. Calcula posição final (baseada em quantos jogadores restantes + 1)
   c. Atualiza tournament jogadores restantes
3. Emite tournament.player.eliminated
4. Se jogador não está em mesa de cash e não tem saldo:
   → Emite account.suggestion.close
5. Display atualiza jogadores restantes
```

### Fluxo 3.9: Balanceamento de Mesas
```
1. Sistema detecta desbalanceamento (diferença > 1 jogador entre mesas)
2. Sugere movimentações para equalizar
3. Floor aprova ou ajusta
4. Sistema atualiza assentos dos jogadores movidos
5. Emite tournament.table.balanced
```

### Fluxo 3.10: Quebra de Mesa
```
1. Mesa atinge número mínimo de jogadores
2. Sistema sugere redistribuição para outras mesas
3. Floor aprova
4. Jogadores redistribuídos
5. Mesa removida
6. Emite tournament.table.broken
```

### Fluxo 3.11: Sugestão de Premiação
```
1. Torneio se aproxima de ITM (in the money)
2. Sistema calcula sugestão baseada no prize_pool:
   a. Define quantidade de premiados (ex: top 15% do field)
   b. Distribui percentuais por posição (curva padrão)
   c. Calcula valores
3. Exibe para o responsável
4. Responsável pode:
   a. Aceitar como está
   b. Alterar quantidade de premiados
   c. Alterar percentuais/valores individuais
5. Confirma → premia quando jogadores são eliminados em posições premiadas
6. Emite tournament.prize.confirmed
```

### Fluxo 3.12: Deal (Acordo entre Finalistas)
```
1. Jogadores restantes solicitam deal
2. Floor registra:
   a. Quais jogadores participam
   b. Valor acordado para cada um
3. Sistema valida:
   a. Soma dos valores = prize pool restante
4. Registra TournamentDeal
5. Para cada jogador:
   a. TournamentPrize com is_deal = true, deal_valor
   b. LedgerTransaction CREDITO DEAL
   c. Wallet ou pagamento direto
6. Posições do ranking: posição onde cada um parou (não empatam)
7. Emite tournament.deal.registered
```

### Fluxo 3.13: Multi-day
```
Dia 1A:
1. Torneio criado com multiday = true
2. Cria TournamentDay (dia_label: "1A")
3. Inscrições e jogo normal
4. No final do dia: registra stack de cada jogador sobrevivente
5. Jogadores com stack são classificados (classificado_dia2 = true)

Dia 1B/1C (mesmo processo):
6. Jogadores que jogaram Dia 1A podem jogar 1B
7. Se jogar múltiplos Dia 1: sistema guarda melhor_stack
8. Classificação para Dia 2 usa melhor_stack entre todos os Dia 1

Dia 2:
9. Apenas classificados entram
10. Stack = melhor_stack do Dia 1
11. Torneio segue normalmente até o final
```

### Fluxo 3.14: Cancelamento de Torneio
```
1. Admin cancela torneio
2. [TRANSAÇÃO ATÔMICA]
   a. Para cada jogador inscrito:
      - Cria LedgerTransaction CREDITO ESTORNO (buy-in)
      - Cria LedgerTransaction CREDITO ESTORNO (rebuys, se houve)
      - Cria LedgerTransaction CREDITO ESTORNO (add-ons, se houve)
      - Cria LedgerTransaction CREDITO ESTORNO (reentradas, se houve)
      - Atualiza Wallet (credita de volta)
      - Atualiza AccountItem (se conta corrente: remove item)
   b. Tournament status = CANCELADO
   c. Fecha CashRegister
   d. Remove pontuação do ranking (se já atribuída)
   e. COMMIT
3. Emite tournament.cancelled
4. Recalcula rankings afetados
5. Notifica todos os inscritos
```

### Fluxo 3.15: Finalizar Torneio
```
1. Último jogador eliminado (ou deal finalizado)
2. Sistema:
   a. Paga premiações pendentes
   b. Calcula overlay (se houver):
      - overlay = garantido_valor - prize_pool arrecadado
      - Se overlay > 0: LedgerTransaction DEBITO OVERLAY (casa paga)
   c. Fecha CashRegister do torneio (conciliação)
   d. Registra pontuação no ranking (se configurado)
   e. Status = FINALIZADO
3. Emite tournament.finished
4. Ranking recalculado
5. Display mostra tela de premiação
```

---

## Módulo 4 — Satélites

### Fluxo 4.1: Criar e Executar Satélite
```
1. Mesmo fluxo de criação de torneio
2. Campos extras: torneio_alvo_ids, saldo_excedente_pago
3. Execução idêntica a um torneio normal
```

### Fluxo 4.2: Finalizar Satélite
```
1. Premiados ganham SatelliteTicket
   a. ticket.status = ATIVO
   b. ticket.torneio_alvo_id = torneio escolhido
   c. ticket.validade = configurável (ou null = sem validade)
2. Se houver saldo excedente na premiação:
   a. LedgerTransaction CREDITO PREMIO (valor excedente)
   b. Pago em dinheiro ou carteira
3. Emite satellite.ticket.won para cada vencedor
```

### Fluxo 4.3: Utilizar Ticket
```
1. Jogador se inscreve no torneio alvo
2. Sistema detecta que tem ticket ativo para esse torneio
3. Inscrição via ticket (sem pagamento de buy-in)
4. Ticket.status = UTILIZADO
5. Emite satellite.ticket.used
```

### Fluxo 4.4: Transferir Ticket
```
1. Jogador solicita transferência
2. Funcionário registra:
   a. De quem → para quem
3. Ticket.jogador_id = novo jogador
4. Ticket.transferido_para_id = novo jogador
5. Ticket.status = TRANSFERIDO (o original)
6. Cria novo ticket para o destinatário (status: ATIVO)
7. Emite satellite.ticket.transferred
8. Notifica ambos os jogadores
```

---

## Módulo 5 — Cash Game

### Fluxo 5.1: Abrir Mesa
```
1. Floor seleciona configuração da mesa (modalidade, stakes, rake)
   Ou seleciona template
2. Cria CashRegister (tipo: MESA_CASH)
3. Mesa status = ABERTA
4. Emite cash.table.opened
5. Aparece no dashboard e no display (lista de espera)
```

### Fluxo 5.2: Sentar Jogador
```
1. Funcionário busca jogador
2. Seleciona assento (ou automático)
3. Define buy-in inicial (entre min e max da mesa)
4. [TRANSAÇÃO ATÔMICA]
   a. Cria CashSession (status: ATIVA)
   b. Cria CashChipTransaction (COMPRA, valor)
   c. Cria LedgerTransaction DEBITO CASH_COMPRA_FICHAS
   d. Session.buyin_total += valor
   e. Atualiza Wallet/Account/CashRegister
   f. COMMIT
5. Se mesa ficou cheia → status = CHEIA
6. Emite cash.player.seated
```

### Fluxo 5.3: Comprar Mais Fichas (Rebuy no Cash)
```
1. Jogador solicita mais fichas
2. [TRANSAÇÃO ATÔMICA]
   a. Cria CashChipTransaction (COMPRA)
   b. Cria LedgerTransaction DEBITO CASH_COMPRA_FICHAS
   c. Session.buyin_total += valor
   d. Atualiza Wallet/Account/CashRegister
   e. COMMIT
3. Emite cash.chips.bought
```

### Fluxo 5.4: Registrar Rake (Dealer)
```
1. Dealer acessa interface simplificada
2. Informa valor do rake coletado
3. Cria CashRakeEntry
4. Cria LedgerTransaction CREDITO RAKE
5. Atualiza CashRegister
6. Emite cash.rake.registered
```

### Fluxo 5.5: Jogador Sai da Mesa
```
1. Funcionário registra saída
2. Informa fichas restantes (valor em reais)
3. [TRANSAÇÃO ATÔMICA]
   a. Cria CashChipTransaction (VENDA, valor das fichas)
   b. Cria LedgerTransaction CREDITO CASH_VENDA_FICHAS
   c. Session.cashout_total = valor
   d. Session.resultado = cashout_total - buyin_total
   e. Session.status = FINALIZADA, fim = now()
   f. Atualiza Wallet/Account/CashRegister
   g. COMMIT
4. Mesa: se estava CHEIA → ABERTA
5. Verifica lista de espera → notifica próximo
6. Emite cash.player.left
7. Se jogador não está em torneio → sugere fechamento de conta
```

### Fluxo 5.6: Troca de Mesa
```
1. Jogador quer trocar para outra mesa
2. Fecha sessão atual (fluxo 5.5)
3. Abre nova sessão na nova mesa (fluxo 5.2)
4. Emite cash.table.switch
```

### Fluxo 5.7: Fechar Mesa
```
1. Floor decide fechar mesa
2. Todos os jogadores devem ter saído (sessões finalizadas)
3. Conciliação:
   a. Total de fichas vendidas - total de fichas compradas = saldo
   b. Rake coletado
   c. Dealer tips
   d. Valor no caixa deve bater
4. Se houver diferença → registra com justificativa
5. Fecha CashRegister
6. Mesa status = FECHADA
7. Emite cash.table.closed
```

### Fluxo 5.8: Lista de Espera
```
1. Jogador quer entrar em mesa cheia
2. Funcionário adiciona à waitlist (posição sequencial)
3. Quando vaga abre:
   a. Sistema notifica primeiro da lista
   b. Jogador tem X minutos para sentar
   c. Se não sentar, passa para o próximo
4. Emite cash.waitlist.joined / cash.waitlist.called
5. Display mostra lista de espera atualizada
```

### Fluxo 5.9: Reserva de Assento
```
1. Jogador reserva assento em mesa específica
2. Reserva tem prazo de expiração (configurável)
3. Se não comparecer → reserva expira, assento liberado
4. Emite cash.reservation.created / expired
```

---

## Módulo 6 — Caixa

### Fluxo 6.1: Abertura de Caixa
```
1. Funcionário abre caixa
2. Define tipo (TORNEIO, MESA_CASH, BAR, GERAL)
3. Informa fundo de troco
4. Sistema cria CashRegister:
   a. status = ABERTO
   b. fundo_troco = valor informado
   c. aberto_por = funcionário
   d. dia_operacional = data atual (ou operacional se cruzou meia-noite)
5. Emite cashregister.opened
```

### Fluxo 6.2: Fechamento de Caixa
```
1. Funcionário fecha caixa
2. Sistema calcula valor_esperado:
   a. fundo_troco
   + soma de entradas (buy-ins, rebuys, addons, pagamentos, depósitos, suprimentos)
   - soma de saídas (prêmios, saques, sangrias, devoluções)
3. Funcionário informa valor_informado (contagem física)
4. Sistema calcula diferença:
   a. diferença = valor_informado - valor_esperado
5. Se diferença != 0:
   a. Justificativa obrigatória
   b. Se abs(diferença) > config.alerta_diferenca_caixa_valor:
      → Emite cashregister.difference.alert
6. CashRegister: status = FECHADO, fechado_por, fechado_em
7. Emite cashregister.closed
```

### Fluxo 6.3: Sangria
```
1. Funcionário registra sangria (retirada de dinheiro do caixa)
2. Informa valor e motivo
3. Cria LedgerTransaction DEBITO SANGRIA
4. Atualiza CashRegister
5. Emite cashregister.withdrawal
6. Somente admin/gerente podem autorizar (RBAC)
```

### Fluxo 6.4: Suprimento
```
1. Funcionário registra suprimento (adicionar dinheiro ao caixa)
2. Informa valor e motivo
3. Cria LedgerTransaction CREDITO SUPRIMENTO
4. Atualiza CashRegister
5. Emite cashregister.supply
```

---

## Módulo 7 — Financeiro (Carteira + Conta Corrente)

### Fluxo 7.1: Depósito na Carteira
```
1. Jogador deseja depositar
2. Funcionário registra:
   a. Valor
   b. Forma de pagamento (dinheiro, PIX, cartão, transferência)
3. [TRANSAÇÃO ATÔMICA]
   a. Cria LedgerTransaction CREDITO DEPOSITO (saldo_tipo: DISPONIVEL)
   b. Atualiza Wallet (saldo_disponivel += valor)
   c. Atualiza CashRegister
   d. COMMIT
4. Emite wallet.deposit
5. Jogador vê saldo atualizado em tempo real no portal
```

### Fluxo 7.2: Saque da Carteira
```
1. Jogador solicita saque
2. Funcionário verifica saldo disponível
3. [TRANSAÇÃO ATÔMICA]
   a. Cria LedgerTransaction DEBITO SAQUE
   b. Atualiza Wallet (saldo_disponivel -= valor)
   c. Atualiza CashRegister
   d. COMMIT
4. Paga em dinheiro, PIX ou transferência
5. Emite wallet.withdraw
```

### Fluxo 7.3: Compensação Automática (Carteira abate Conta)
```
1. Jogador tem saldo na carteira E conta corrente aberta
2. Ao fechar a conta OU ao depositar:
   a. Sistema detecta dívida em conta corrente
   b. Sugere compensação
   c. Funcionário aprova
3. [TRANSAÇÃO ATÔMICA]
   a. Cria LedgerTransaction DEBITO (carteira do jogador)
   b. Cria LedgerTransaction CREDITO (pagamento da conta)
   c. Atualiza Wallet
   d. Atualiza AccountItems (pago: true, até onde o saldo cobrir)
   e. COMMIT
4. Emite wallet.compensation
```

### Fluxo 7.4: Pagamento de Conta (Parcial ou Total)
```
1. Jogador deseja pagar conta
2. Sistema mostra resumo dos itens em aberto
3. Jogador escolhe:
   a. Pagar tudo
   b. Pagar parcial (seleciona itens ou informa valor)
4. Define forma de pagamento
5. [TRANSAÇÃO ATÔMICA]
   a. Cria LedgerTransaction CREDITO PAGAMENTO
   b. Atualiza AccountItems (pago: true, valor_pago)
   c. Account: total_pago += valor
   d. Se tudo pago: Account status = FECHADA
   e. Atualiza CashRegister
   f. COMMIT
6. Emite account.payment.partial ou account.closed
```

### Fluxo 7.5: Estorno
```
1. Erro identificado (buy-in duplicado, valor incorreto, etc.)
2. Somente admin/gerente pode autorizar
3. [TRANSAÇÃO ATÔMICA]
   a. Cria LedgerTransaction CREDITO ESTORNO (referencia a transação original)
   b. Motivo obrigatório
   c. Atualiza Wallet/Account
   d. Atualiza CashRegister
   e. COMMIT
4. Transação original NÃO é alterada (Ledger imutável)
5. Emite evento específico do contexto (tournament.entry.cancelled, etc.)
```

---

## Módulo 8 — Bar / Comanda

### Fluxo 8.1: Abrir Comanda
```
1. Funcionário busca jogador
2. Se comanda já existe (mesma dia_operacional, aberta) → usa existente
3. Senão cria Tab:
   a. jogador_id
   b. is_acompanhante = false (ou true se for acompanhante)
   c. status = ABERTA
   d. dia_operacional = dia atual
4. Emite tab.opened
```

### Fluxo 8.2: Lançar Consumo
```
1. Funcionário seleciona produto e quantidade
2. [TRANSAÇÃO ATÔMICA]
   a. Cria TabItem (produto, quantidade, valor_unitario, valor_total)
   b. Cria LedgerTransaction DEBITO BAR
   c. Tab.total += valor_total
   d. Cria AccountItem (tipo: BAR) na conta corrente do jogador
   e. Atualiza CashRegister (bar)
   f. COMMIT
3. Emite tab.item.added
```

### Fluxo 8.3: Fechar Comanda
```
1. Funcionário fecha comanda
2. Pagamento faz parte do fechamento geral da conta do jogador
3. Tab: status = FECHADA, fechada_em = now()
4. Emite tab.closed
```

---

## Módulo 9 — Ranking

### Fluxo 9.1: Criar Ranking
```
1. Admin define:
   a. Nome (ex: "Ranking Semestral 2025.1")
   b. Tipo: semestral ou anual
   c. Período (início e fim)
   d. Pontuação por posição (1º = 100, 2º = 70, 3º = 50...)
   e. Critérios de desempate (mais torneios, mais ITMs, etc.)
   f. Prêmios (opcional)
2. Status = ATIVO
3. Emite ranking.created
```

### Fluxo 9.2: Torneio Finaliza → Pontuação
```
1. Torneio com ranking configurado finaliza
2. Para cada jogador premiado/posicionado:
   a. Busca pontuação da posição na RankingPointStructure
   b. Multiplica pelo peso do torneio
   c. Cria RankingEntry
3. Recalcula RankingStanding:
   a. Soma total de pontos por jogador
   b. Ordena por pontos (desempate configurado)
   c. Atualiza posições
4. Emite ranking.points.registered + ranking.recalculated
```

### Fluxo 9.3: Torneio Cancelado → Remove Pontuação
```
1. Torneio cancelado tinha pontuação no ranking
2. Remove todos os RankingEntry desse torneio
3. Recalcula RankingStanding
4. Emite ranking.points.removed + ranking.recalculated
```

### Fluxo 9.4: Finalizar Ranking
```
1. Período do ranking encerrou
2. Admin finaliza ranking
3. Status = FINALIZADO
4. Prêmios creditados na carteira dos premiados
5. LedgerTransaction CREDITO PREMIO para cada premiado
6. Emite ranking.finished + ranking.prize.credited
```

---

## Módulo 10 — Rakeback

### Fluxo 10.1: Cálculo de Rakeback
```
1. Período de apuração encerra (semanal/quinzenal/mensal — configurável)
2. Sistema calcula para cada jogador:
   a. Total de rake pago no período (torneios + cash)
   b. Percentual de rakeback aplicável:
      - Se progressivo: verifica tier do jogador
      - Se fixo: usa percentual configurado
   c. Valor de rakeback = rake * percentual
3. Emite rakeback.calculated
```

### Fluxo 10.2: Creditar Rakeback
```
1. Admin revisa valores calculados (opcional)
2. Confirma crédito
3. Para cada jogador:
   a. Cria LedgerTransaction CREDITO RAKEBACK (saldo_tipo: RAKEBACK)
   b. Atualiza Wallet.saldo_rakeback
4. Emite rakeback.credited para cada jogador
5. Jogadores recebem notificação
```

---

## Módulo 11 — Presença

### Fluxo 11.1: Check-in
```
1. Funcionário registra chegada do jogador
2. Cria Presence (checkin_at = now())
3. Emite presence.checkin
```

### Fluxo 11.2: Check-out
```
1. Funcionário registra saída (ou automático ao fechar conta)
2. Atualiza Presence:
   a. checkout_at = now()
   b. duracao_minutos = diferença
3. Emite presence.checkout
```

---

## Módulo 12 — Tournament Display

### Fluxo 12.1: Iniciar Display
```
1. TV acessa URL: /display/{organization_id}/{tournament_id}
2. Autenticação via token temporário (não precisa de login)
3. Página fullscreen carrega dados do torneio
4. Conecta ao Supabase Realtime (canal do torneio)
5. Exibe: blind atual, próximo blind, timer, jogadores, prize pool, etc.
```

### Fluxo 12.2: Timer Client-side
```
1. Servidor envia: nível atual, duração, timestamp de início do nível
2. Client calcula tempo restante localmente
3. Quando timer chega a 0:
   a. Client espera evento "blind.changed" do servidor
   b. Atualiza nível, blinds, antes
   c. Reinicia timer
4. Se TV recarregar: resincroniza com estado atual do servidor
```

### Fluxo 12.3: Modos do Display
```
MODO JOGO:
- Blind atual, próximo, timer, jogadores restantes
- Média de fichas, prize pool, rebuys, addons
- Estrutura de blinds (próximos níveis)

MODO BREAK:
- Tempo do break, próximo blind
- Ranking (se configurado)
- Chip count (se registrado)

MODO PREMIAÇÃO:
- Pódio final, valores pagos
- Campeão destacado

MODO WAITLIST (Cash):
- Lista de espera das mesas de cash
- Mesas abertas com vagas
```

---

## Módulo 13 — Notificações e WhatsApp

### Fluxo 13.1: Notificação Interna
```
1. Evento emitido (ex: tournament.entry.registered)
2. NotificationModule verifica:
   a. Tipo de evento tem notificação habilitada? (OrgConfig)
   b. Quem deve receber?
3. Cria Notification
4. Publica via Supabase Realtime para o portal do jogador
5. Jogador vê badge de notificação + push (PWA)
```

### Fluxo 13.2: WhatsApp
```
1. Evento gatilho ocorre (ex: premiação paga)
2. Sistema busca WhatsAppTemplate correspondente
3. Substitui variáveis ({nome}, {valor}, {torneio}, {data})
4. Envia via API configurada (Evolution API ou WhatsApp Business)
5. Cria WhatsAppLog
6. Se falhar → registra erro, emite whatsapp.failed
```

---

## Módulo 14 — Auditoria

### Fluxo 14.1: Registro de Auditoria
```
1. QUALQUER evento do sistema é capturado pelo AuditModule
2. Cria AuditLog:
   a. user_id = quem executou
   b. acao = tipo de ação
   c. entidade = tabela/módulo afetado
   d. entidade_id = ID do registro
   e. valores_antigos = snapshot antes (JSON)
   f. valores_novos = snapshot depois (JSON)
   g. ip_address = IP do request
   h. user_agent = browser/dispositivo
3. NUNCA pode ser alterado ou deletado
4. Indexado para consulta rápida por admin
```

---

## Módulo 15 — Relatórios

### Fluxo 15.1: Relatório Financeiro Diário
```
1. Admin seleciona dia operacional
2. Sistema agrega do Ledger:
   a. Receitas por categoria (buy-in, rake, bar, etc.)
   b. Despesas por categoria (prêmios, saques, overlay, etc.)
   c. Resultado líquido
   d. Movimentação por caixa
   e. Formas de pagamento
3. Gera PDF e/ou exibe na tela
```

### Fluxo 15.2: Relatório de Inadimplência
```
1. Admin consulta
2. Sistema lista:
   a. Jogadores com contas abertas
   b. Valor total em aberto
   c. Dias em aberto
   d. Ordenado por valor ou antiguidade
3. Ação: enviar cobrança via WhatsApp
```

---

## Módulo 16 — Configuração

### Fluxo 16.1: Alterar Configuração
```
1. Admin acessa Centro de Configuração
2. Seleciona categoria (rakeback, fidelidade, alertas, etc.)
3. Altera valores
4. Sistema valida
5. Salva em OrgConfig
6. Emite config.changed
7. Módulos afetados recarregam configuração (via cache invalidation)
```

---

## Módulo 17 — Programa de Fidelidade

### Fluxo 17.1: Configurar Programa
```
1. Admin ativa módulo de fidelidade
2. Define regras:
   a. Tipo: torneios_jogados | rake_acumulado | presenca
   b. Meta: número alvo
   c. Prêmio: bonus | buyin_gratis | produto
   d. Valor do prêmio
3. Status = ATIVO
```

### Fluxo 17.2: Progresso e Premiação
```
1. Evento relevante ocorre (torneio jogado, rake pago, checkin)
2. Sistema atualiza LoyaltyProgress:
   a. progresso_atual += 1 (ou += rake valor)
3. Se progresso_atual >= meta:
   a. completado = true
   b. Credita prêmio na carteira
   c. Cria LedgerTransaction CREDITO FIDELIDADE
   d. Emite loyalty.goal.reached + loyalty.prize.credited
   e. Reseta progresso para próximo ciclo (se recorrente)
```
