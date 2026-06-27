# Etapa 5 — Sugestões de Melhorias Aprovadas

## Aprovadas — Prioridade Alta

### 1. Fechamento Automático de Conta do Jogador
- Quando jogador é eliminado e não está em nenhuma mesa de cash, sistema sugere fechamento
- Exibe resumo: torneios + bar + cash = total
- Funcionário confirma e registra pagamento

### 2. Conciliação Inteligente de Caixa
- No fechamento: sistema mostra valor esperado (ledger) vs valor informado (físico)
- Diferenças registradas com justificativa obrigatória

### 3. Dashboard de Operação em Tempo Real
- Tela para floor/gerente: torneios ativos, mesas de cash (ocupação, lista de espera), posição de caixa, contas abertas

### 4. Alertas Operacionais (aprovados)
- Mesa de cash com desbalanceamento de fichas
- Caixa com diferença acima de X reais (configurável)
- Torneio com garantido não atingido (overlay)
- REMOVIDO: alerta de jogador saindo sem pagar

### 5. QR Code para Inscrição
- QR Code por torneio, jogador escaneia e inscreve pelo portal com carteira

### 6. Relatório de Jogadores Mais Rentáveis
- Ranking interno (invisível ao jogador): rake pago, consumo, frequência

### 7. Controle de Presença
- Check-in/check-out do jogador na casa
- Dados de frequência e tempo de permanência

## Aprovadas — Ajustes

### 8. Acesso do Dealer (não app separado)
- Interface simplificada dentro do sistema para o dealer registrar rake por mão
- Acesso via perfil/permissão de dealer, não um app separado

## Aprovadas — Futuro

### 9. Integração PIX Automático
- Arquitetura preparada para integração futura
- Não será implementado na primeira versão

### 10. Programa de Fidelidade
- Totalmente configurável pela casa
- Só ativado mediante escolha do admin
- Regras parametrizáveis (ex: a cada X torneios, ganhe Y de bônus)
- Não será obrigatório — módulo opcional
