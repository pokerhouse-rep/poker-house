# Etapa 1 — Requisitos Funcionais

## 1. Modelo SaaS Multi-Tenant

- Plataforma SaaS com planos fixos (a definir posteriormente)
- Cada casa de poker = 1 empresa isolada (tenant)
- Nenhuma informação compartilhada entre casas
- Cadastro de novas casas feito manualmente pelo administrador da plataforma
- Primeiro usuário admin criado junto com a empresa
- Cada unidade/filial é uma empresa separada
- Preparado para milhares de empresas

## 2. Cadastro de Jogadores

- Dados obrigatórios: CPF, nome, telefone, e-mail, data de nascimento, endereço
- Foto: opcional, escolhida pelo jogador
- Bloqueio automático para menores de 18 anos
- Um jogador pode jogar em múltiplas casas com contas independentes (mesmo CPF, registros separados por casa)
- Login do jogador: CPF + senha, liberado pelo admin da casa
- O jogador NÃO precisa se cadastrar sozinho — a casa cria o registro

## 3. Modelo Financeiro — Híbrido (Conta Corrente + Carteira)

### Conta Corrente (fiado)
- Jogador joga, consome, participa de torneios
- No final do dia (ou quando sair), acerta tudo
- Não há crédito/limite — mas o pagamento pode ser posterior
- O sistema NÃO trava ações do jogador por falta de pagamento

### Carteira (depósito prévio)
- Jogador deposita dinheiro antecipadamente
- Todas as despesas abatem da carteira
- Prêmios entram na carteira
- Funciona como conta digital

### Híbrido
- O jogador pode usar carteira OU conta corrente
- Se tem saldo na carteira, pode usar para abater gastos (cash, torneios, bar)
- Se não tem saldo, fica em conta corrente para pagamento posterior
- Compensação: saldo de carteira pode abater dívida de conta corrente

## 4. Torneios

### Criação e Configuração
- Torneios configuráveis com templates reutilizáveis
- Campos: nome, buy-in, rake, chip dealer, blinds (estrutura), late registration (sim/não, até qual nível), garantido (sim/não + valor), rebuy (sim/não + quantidade + valor), add-on (sim/não + valor), starting stack, duração dos níveis
- Multi-day: suporte a Dia 1A, 1B, 1C, Dia 2 Final
- Definir se participa do ranking e com qual peso

### Premiação
- Sistema gera sugestão automática de premiação baseada no prize pool
- O responsável pode aceitar ou alterar: quantidade de premiados, percentual ou valor fixo para cada posição
- Se houver garantido e a arrecadação não cobrir, a casa paga o overlay

### Operação
- Controle de inscrições (presencial e online pelo portal do jogador)
- Controle de rebuys e add-ons
- Distribuição e balanceamento de mesas
- Quebra de mesas
- Caixa separado por torneio
- Rake e chip dealer como custos/receitas do torneio

## 5. Satélites

- Prêmio = entrada para outro torneio (obrigatoriamente inscrição)
- Pode haver saldo excedente na premiação, pago em dinheiro
- Jogador pode transferir a inscrição conquistada para outro jogador

## 6. Cash Game

### Mesas
- Registro completo: fichas compradas, fichas vendidas, entrada e saída de jogadores
- No final, quantidade de fichas deve bater exatamente com valor recebido/pago
- Rake configurável: time rake OU pot rake (configuração por mesa)
- Caixinha do dealer registrada
- Lista de espera para mesas cheias
- Reserva de assento
- Caixa separado por mesa de cash

## 7. Caixa

- Caixa separado por: torneio, mesa de cash, bar (diário), e caixa geral (financeiro)
- Abertura e fechamento diário com conferência
- Sangria e suprimento
- O "dia operacional" termina quando as atividades finalizam (pode cruzar meia-noite)

## 8. Ranking

- Pontuação por torneio finalizado
- Na criação do ranking: definir pontuação por posição (1º = 100pts, 2º = 70pts, etc.)
- Cada torneio define se participa do ranking e com qual peso (peso 1 = pontos normais, peso 2 = pontos dobrados, etc.)
- Períodos: semestrais ou anuais
- Prêmios do ranking creditados automaticamente na carteira

## 9. Bar / Comanda

- Comanda vinculada ao jogador
- Possível consumir sem estar jogando (acompanhante pode ter comanda)
- Pagamento: via pagamento do jogador (sistema apenas confirma)
- SEM controle de estoque (apenas registro de vendas)
- Caixa do bar separado e diário

## 10. Formas de Pagamento

- Dinheiro, PIX, cartão de crédito, cartão de débito, transferência, carteira do jogador
- PIX: registro manual (sem integração com gateway por enquanto)

## 11. Rakeback

- Configurável por casa
- Creditado automaticamente na carteira do jogador
- Regras de cálculo definidas pela casa nas configurações

## 12. Tournament Display

- Módulo para exibição em televisores
- Atualização em tempo real
- Informações: blind atual, próximo blind, tempo restante, jogadores restantes, média de fichas, prize pool, premiação, add-ons, rebuys, break, estrutura, logo, QR Code

## 13. Portal do Jogador

- Login: CPF + senha (liberado pelo admin)
- Visualizações:
  - Dashboard pessoal
  - Carteira (saldo disponível, pendente, bloqueado, promocional, bônus, rakeback, premiações)
  - Extrato e histórico financeiro
  - Histórico de torneios, cash games, consumo
  - Estatísticas: ROI, lucro, ITM, mesas finais, torneios vencidos
  - Ranking
  - Torneios e satélites disponíveis
  - Inscrição online em torneios
  - Contas em aberto
  - Notificações

## 14. Templates

- Modelos reutilizáveis para: torneios, estruturas de blinds, premiações, ranking, cash games, mensagens, relatórios, produtos, configurações

## 15. Notificações

- Eventos que geram notificação: buy-in, rebuy, add-on, conta alterada, premiação, pagamento, saldo atualizado, inscrição realizada, mudança no ranking, crédito de rakeback
- Notificações internas (no sistema) + WhatsApp

## 16. WhatsApp

- Mensagens com templates configuráveis
- Modelos: cobrança, conta encerrada, premiação, confirmação de inscrição, pagamentos
- Totalmente configuráveis pela casa

## 17. Auditoria

- Todo evento gera log
- Campos: usuário, data, hora, empresa, IP, ação, entidade afetada, valores antigos, valores novos
- Nada pode ser apagado

## 18. Centro de Configuração

- Cada casa configura: ranking, pontuação, rake, rakeback, permissões, PIX, WhatsApp, produtos, categorias, relatórios, templates, financeiro, regras de torneios, satélites, temas, logo
- Preferir parametrização sobre regras fixas

## 19. Área Administrativa

- Dashboard, jogadores, funcionários, permissões, torneios, cash games, satélites, ranking, financeiro, caixa, carteira, rake, rakeback, bar, produtos, estoque, templates, auditoria, relatórios, configurações, tournament display

## 20. Funcionários e Permissões

- RBAC (Role-Based Access Control)
- Cadastro de funcionários com perfis de permissão
- Permissões granulares por módulo e ação
