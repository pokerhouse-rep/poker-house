# Etapa 3 — Brainstorm Completo de Funcionalidades

Legenda:
- ✅ = Confirmado pelo cliente
- 💡 = Sugestão do arquiteto (aguardando aprovação)

---

## Módulo 1 — Autenticação e Acesso

- ✅ Login admin/funcionário: e-mail + senha
- ✅ Login jogador: CPF + senha (liberado pelo admin)
- ✅ RBAC com permissões granulares por módulo e ação
- 💡 Recuperação de senha por e-mail
- 💡 Sessão com expiração configurável (ex: 8h para funcionários, 24h para jogadores)
- 💡 Bloqueio de conta após X tentativas de login incorretas
- 💡 Log de todos os acessos (quem, quando, de onde)

---

## Módulo 2 — Gestão da Casa (Tenant)

- ✅ Cadastro da casa feito manualmente pelo dono da plataforma
- ✅ Primeiro admin criado junto com a empresa
- ✅ Cada unidade/filial = empresa separada
- ✅ Centro de configuração completo e parametrizável
- ✅ Logo e tema personalizáveis
- 💡 Dados da empresa: CNPJ, razão social, nome fantasia, endereço, telefone, e-mail
- 💡 Horário de funcionamento configurável
- 💡 Fuso horário configurável por casa
- 💡 Status da casa: ativa, suspensa, cancelada

---

## Módulo 3 — Jogadores

- ✅ Cadastro: CPF, nome, telefone, e-mail, data de nascimento, endereço, foto (opcional)
- ✅ Bloqueio automático para menores de 18 anos
- ✅ Contas independentes por casa (mesmo CPF em casas diferentes)
- ✅ Login próprio (CPF + senha) liberado pelo admin
- 💡 Status do jogador: ativo, inativo, bloqueado, autoexcluído
- 💡 Apelido/nickname (comum no poker)
- 💡 Observações internas (visível só para funcionários)
- 💡 Histórico de bloqueios/desbloqueios
- 💡 Autoexclusão: jogador pode solicitar bloqueio voluntário por período definido (jogo responsável)
- 💡 Tags/categorias (VIP, regular, novo, etc.)

---

## Módulo 4 — Funcionários

- ✅ Cadastro de funcionários com perfis de permissão
- ✅ RBAC granular
- 💡 Cargos pré-definidos: Admin, Gerente, Floor, Caixa, Dealer, Barman
- 💡 Cargos customizáveis pela casa
- 💡 Funcionário pode atuar em múltiplos cargos
- 💡 Horário de trabalho / turno (para saber quem estava operando em cada momento)

---

## Módulo 5 — Carteira do Jogador

- ✅ Saldo disponível
- ✅ Saldo pendente
- ✅ Saldo bloqueado
- ✅ Saldo promocional
- ✅ Saldo bônus
- ✅ Saldo rakeback
- ✅ Saldo premiações
- ✅ Depósito prévio (carteira)
- ✅ Abater gastos (torneios, cash, bar) do saldo
- ✅ Prêmios entram na carteira
- 💡 Regra de prioridade de consumo dos saldos (ex: bônus primeiro, depois disponível)
- 💡 Validade para saldo promocional e bônus (expira em X dias)
- 💡 Extrato detalhado por tipo de saldo

---

## Módulo 6 — Conta Corrente

- ✅ Jogador joga/consome e paga depois
- ✅ Sem limite de crédito — não trava ações
- ✅ Compensação: saldo da carteira pode abater dívida
- 💡 Alerta visual quando jogador tem conta em aberto acima de X valor (configurável)
- 💡 Relatório de inadimplência: jogadores com contas abertas há mais de X dias
- 💡 Histórico de contas abertas e fechadas

---

## Módulo 7 — Torneios

- ✅ Criação com templates reutilizáveis
- ✅ Campos: nome, buy-in, rake, chip dealer, estrutura de blinds, late registration, garantido, rebuy, add-on, starting stack, duração dos níveis
- ✅ Multi-day (Dia 1A, 1B, 1C, Dia 2)
- ✅ Inscrição presencial e online
- ✅ Controle de rebuys e add-ons
- ✅ Balanceamento e quebra de mesas
- ✅ Sugestão automática de premiação (editável)
- ✅ Overlay: casa cobre diferença se garantido não for atingido
- ✅ Define se participa do ranking e com qual peso
- ✅ Caixa separado por torneio
- 💡 Status do torneio: rascunho, aberto para inscrição, em andamento, pausado, finalizado, cancelado
- 💡 Timer de blinds integrado ao Tournament Display
- 💡 Registro de posição final de cada jogador (para ranking e estatísticas)
- 💡 Histórico completo do torneio (quem entrou, rebuys, add-ons, eliminações, premiados)
- 💡 Chip count por jogador nos intervalos (opcional, para display)
- 💡 Deal (acordo entre jogadores finalistas): registrar acordo e distribuição personalizada
- 💡 Addon e rebuy com valores diferentes entre si

---

## Módulo 8 — Satélites

- ✅ Prêmio = inscrição obrigatória em torneio alvo
- ✅ Saldo excedente pago em dinheiro
- ✅ Transferência de inscrição para outro jogador
- 💡 Vincular satélite a um ou mais torneios alvo
- 💡 Controle de tickets ganhos e utilizados
- 💡 Ticket com validade (expira se não usar em X dias — configurável)

---

## Módulo 9 — Cash Game

- ✅ Registro de fichas compradas e vendidas
- ✅ Conciliação: fichas devem bater com valores
- ✅ Rake configurável: time rake ou pot rake
- ✅ Caixinha do dealer registrada
- ✅ Lista de espera
- ✅ Reserva de assento
- ✅ Caixa separado por mesa
- 💡 Tipos de mesa configuráveis: NL Hold'em, PLO, etc.
- 💡 Stakes configuráveis (blinds da mesa)
- 💡 Limite mínimo e máximo de buy-in por mesa
- 💡 Tempo de permanência do jogador na mesa
- 💡 Histórico de sessões do jogador (resultado por sessão)
- 💡 Status da mesa: fechada, aberta, cheia
- 💡 Número máximo de jogadores por mesa (configurável: 6, 8, 9, 10)

---

## Módulo 10 — Caixa

- ✅ Caixa por torneio, por mesa de cash, bar (diário), caixa geral
- ✅ Abertura e fechamento com conferência
- ✅ Sangria e suprimento
- ✅ Dia operacional termina quando atividades finalizam
- 💡 Fundo de troco inicial configurável
- 💡 Conferência obrigatória no fechamento (sistema vs físico)
- 💡 Diferenças registradas (sobra/falta) com justificativa obrigatória
- 💡 Quem abriu e quem fechou registrado em auditoria
- 💡 Relatório de movimentação por caixa

---

## Módulo 11 — Financeiro (Ledger)

- ✅ Toda movimentação registrada — saldos são consequência
- ✅ Ledger como única fonte de verdade
- ✅ Sem controles paralelos
- ✅ Imutável
- ✅ Formas de pagamento: dinheiro, PIX, cartão crédito, cartão débito, transferência, carteira
- ✅ PIX manual (sem integração)
- 💡 Categorização de receitas e despesas
- 💡 Conciliação diária automática (caixas vs ledger)
- 💡 DRE simplificado (receitas - despesas = resultado)
- 💡 Exportação de dados (CSV, PDF)

---

## Módulo 12 — Rake e Rakeback

- ✅ Rake configurável por casa
- ✅ Rakeback creditado automaticamente na carteira
- 💡 Rake por torneio: valor fixo ou percentual do buy-in
- 💡 Rake por cash: percentual do pot (com cap) ou time rake (valor por tempo)
- 💡 Rakeback: percentual configurável por período
- 💡 Rakeback progressivo: percentual aumenta conforme volume jogado (tiers)
- 💡 Período de apuração do rakeback: semanal, quinzenal, mensal (configurável)
- 💡 Relatório de rake gerado e rakeback distribuído

---

## Módulo 13 — Ranking

- ✅ Pontuação por posição final no torneio
- ✅ Peso por torneio
- ✅ Períodos: semestral ou anual
- ✅ Prêmios creditados na carteira
- 💡 Múltiplos rankings simultâneos (ex: ranking geral + ranking de PLO + ranking feminino)
- 💡 Ranking parcial visível em tempo real
- 💡 Desempate configurável (mais torneios jogados, mais ITMs, etc.)
- 💡 Histórico de rankings anteriores
- 💡 Exibição no Tournament Display

---

## Módulo 14 — Bar / Comanda

- ✅ Comanda vinculada ao jogador
- ✅ Acompanhante pode consumir (comanda sem ser jogador)
- ✅ Pagamento via sistema do jogador
- ✅ Sem controle de estoque
- ✅ Caixa do bar separado e diário
- 💡 Produtos com categorias (bebidas, comidas, combos)
- 💡 Produtos com preço configurável
- 💡 Comanda do acompanhante vinculada a um jogador responsável
- 💡 Fechamento da comanda individual ou em lote

---

## Módulo 15 — Tournament Display

- ✅ Exibição em TVs via navegador ou HDMI
- ✅ Tempo real
- ✅ Blind atual, próximo blind, tempo restante, jogadores restantes, média de fichas, prize pool, premiação, add-ons, rebuys, break, estrutura, logo, QR Code
- 💡 Layout customizável (cores, logo, informações exibidas)
- 💡 Modo break (tela diferente durante intervalos)
- 💡 Modo premiação (exibe pódio final)
- 💡 Múltiplos displays simultâneos (ex: TV 1 = torneio A, TV 2 = torneio B)
- 💡 Exibir ranking durante breaks
- 💡 Exibir próximos torneios/satélites
- 💡 Tela de lista de espera do cash (visível na TV)
- 💡 Mensagens/anúncios rotativos configuráveis

---

## Módulo 16 — Templates

- ✅ Torneios, estruturas de blinds, premiações, ranking, cash games, mensagens, relatórios, produtos, configurações
- 💡 Duplicar template existente
- 💡 Marcar template como favorito/padrão

---

## Módulo 17 — Notificações

- ✅ Internas no sistema
- ✅ Eventos: buy-in, rebuy, add-on, conta alterada, premiação, pagamento, saldo atualizado, inscrição, ranking, rakeback
- 💡 Central de notificações com lidas/não lidas
- 💡 Notificações push para o portal do jogador (PWA)
- 💡 Notificações configuráveis (casa escolhe quais eventos notificam)

---

## Módulo 18 — WhatsApp

- ✅ Templates configuráveis: cobrança, conta encerrada, premiação, confirmação de inscrição, pagamentos
- 💡 Variáveis dinâmicas nos templates ({nome}, {valor}, {data}, {torneio})
- 💡 Envio manual (funcionário clica para enviar) ou automático por evento
- 💡 Log de mensagens enviadas
- 💡 Integração via API oficial (WhatsApp Business API) ou via Evolution API (self-hosted)

---

## Módulo 19 — Relatórios

- 💡 Dashboard admin com KPIs: receita do dia, jogadores ativos, torneios realizados, cash games abertos, contas em aberto
- 💡 Relatório financeiro diário
- 💡 Relatório financeiro mensal
- 💡 Relatório de rake (por torneio, por mesa, por período)
- 💡 Relatório de rakeback distribuído
- 💡 Relatório de inadimplência
- 💡 Relatório de frequência de jogadores
- 💡 Relatório de premiações
- 💡 Relatório de bar/vendas
- 💡 Relatório por funcionário (operações realizadas)
- 💡 Relatório de overlay (torneios que deram garantido)
- 💡 Exportação: CSV, PDF

---

## Módulo 20 — Auditoria

- ✅ Todo evento gera log
- ✅ Campos: usuário, data, hora, empresa, IP, ação, entidade, valores antigos, valores novos
- ✅ Nada pode ser apagado
- 💡 Filtros: por usuário, por módulo, por período, por tipo de ação
- 💡 Busca textual nos logs
- 💡 Exportação para compliance

---

## Módulo 21 — Portal do Jogador

- ✅ Dashboard, carteira, extrato, históricos (torneios, cash, consumo)
- ✅ Estatísticas: ROI, lucro, ITM, mesas finais, torneios vencidos
- ✅ Ranking, torneios disponíveis, inscrição online
- ✅ Contas em aberto, notificações
- 💡 PWA (Progressive Web App) — instala no celular sem loja de apps
- 💡 Gráficos de evolução (lucro ao longo do tempo, ROI por mês)
- 💡 Perfil editável (foto, senha, dados de contato)
- 💡 Dark mode / light mode

---

## Módulo 22 — Plataforma SaaS (Super Admin)

- 💡 Painel exclusivo do dono da plataforma
- 💡 Gerenciar casas: criar, suspender, cancelar
- 💡 Gerenciar planos e assinaturas
- 💡 Dashboard global: total de casas, jogadores, torneios, receita da plataforma
- 💡 Monitoramento de uso por casa
- 💡 Comunicados para todas as casas
