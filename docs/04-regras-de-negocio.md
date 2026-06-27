# Etapa 4 — Regras de Negócio

## Torneios

### Multi-day
- Jogador pode jogar múltiplos Dia 1 (1A, 1B, 1C) e escolher o melhor stack para o Dia 2
- O sistema deve armazenar o stack final de cada Dia 1 jogado

### Late Registration
- Jogador que entra via late registration pode fazer rebuy normalmente (se o torneio permitir rebuy)

### Rebuy — Condições
- As condições para rebuy são configuráveis na criação do torneio
- Opções: apenas no bust (fichas = 0), ou abaixo de X fichas (ex: abaixo do starting stack)
- Quantidade máxima de rebuys: configurável

### Reentrada vs Rebuy
- São conceitos diferentes e o sistema DEVE diferenciá-los
- **Rebuy:** jogador compra fichas e continua no mesmo assento
- **Reentrada:** jogador é eliminado, recebe novo assento (como se fosse nova inscrição)
- Ambos são configuráveis na criação do torneio (habilitado/desabilitado, quantidade máxima, valor)

### Deal entre Finalistas
- O ranking considera a posição em que cada jogador parou de jogar (não empata)
- O deal afeta apenas a distribuição do prêmio, não as posições para ranking
- O sistema registra: posição original + valor acordado no deal

### Cancelamento de Torneio
- Estorno automático para a carteira de todos os jogadores inscritos
- Inclui: buy-in, rebuys e add-ons já pagos
- Gera evento no ledger: "Estorno por cancelamento de torneio"

### Configurações por Torneio (resumo)
- Buy-in, rake, chip dealer
- Estrutura de blinds (template)
- Starting stack
- Late registration: sim/não + até qual nível
- Rebuy: sim/não + condição (bust ou abaixo de X) + quantidade máxima + valor
- Reentrada: sim/não + quantidade máxima + valor
- Add-on: sim/não + valor + quantidade de fichas
- Garantido: sim/não + valor
- Multi-day: sim/não + estrutura de dias
- Ranking: sim/não + qual(is) ranking(s) + peso
- Valores de rebuy e add-on podem ser diferentes entre si

## Cash Game

### Troca de Mesa
- Jogador pode trocar de mesa durante operação
- Ao trocar, a sessão atual é fechada (conciliação de fichas) e uma nova sessão é aberta na nova mesa
- Cada sessão tem seu próprio resultado

### Rake — Pot Rake
- Registrado manualmente pelo dealer a cada mão (ou acumulado)
- O sistema registra o valor total de rake coletado na mesa

### Fichas
- Sistema controla apenas o valor total em reais
- Não há controle de denominações de fichas

## Financeiro

### Ordem de Consumo dos Saldos da Carteira
1. Promocional (expira primeiro)
2. Bônus
3. Rakeback
4. Disponível
5. Premiação

### Estorno
- Somente admin e gerente podem autorizar estornos
- Estorno gera evento no ledger (nunca altera transação original)
- Motivo obrigatório

### Pagamento Parcial
- Jogador pode pagar parte da conta e deixar o resto em aberto
- O sistema registra pagamentos parciais vinculados à conta original
- Saldo restante continua em conta corrente

## Ranking

### Pontuação em Múltiplos Rankings
- Um mesmo torneio pode pontuar em mais de um ranking
- Configurável na criação do torneio: informar quais rankings e com qual peso

### Cancelamento
- Se um torneio que pontuava no ranking é cancelado, toda a pontuação atribuída é removida automaticamente
- Recálculo automático do ranking

## Bar / Comanda

### Acompanhante
- Acompanhante NÃO precisa ser cadastrado
- Comanda aberta no nome do jogador responsável
- Marcação de "acompanhante" nos itens (para controle, mas a responsabilidade é do jogador)

## Geral

### Moeda
- Exclusivamente Real (BRL)
- Sem suporte a moedas estrangeiras ou fichas com valor diferente

### Impressão
- Sistema gera documentos em PDF
- Impressão fica a cargo do usuário (imprimir do PDF)
- PDFs disponíveis: recibos, comprovantes, comandas, relatórios
