# Etapa 15 — Definição das Permissões

## Modelo: RBAC (Role-Based Access Control)

Cada usuário possui um ou mais Roles (perfis). Cada Role possui permissões granulares por módulo e ação.

---

## Níveis de Acesso

```
SUPERADMIN (dono da plataforma)
│   Acesso total à plataforma. Não pertence a nenhuma organização.
│   Gerencia casas, planos, assinaturas.
│
└── ADMIN (dono da casa)
    │   Acesso total dentro da sua organização.
    │   Cria funcionários, configura sistema, vê auditoria.
    │
    ├── GERENTE
    │   │   Quase tudo do admin, exceto configurações críticas.
    │   │   Pode autorizar estornos, sangrias, fechamento de caixa.
    │   │
    │   ├── FLOOR
    │   │   │   Gerencia torneios e cash games.
    │   │   │   Inscreve jogadores, balanceia mesas, registra eliminações.
    │   │   │
    │   │   ├── CAIXA
    │   │   │   Abre/fecha caixa, registra pagamentos, depósitos, saques.
    │   │   │   Não gerencia torneios nem mesas.
    │   │   │
    │   │   ├── DEALER
    │   │   │   Interface simplificada. Registra rake no cash game.
    │   │   │   Não acessa financeiro, jogadores, configurações.
    │   │   │
    │   │   └── BARMAN
    │   │       Lança consumo na comanda. Vê produtos.
    │   │       Não acessa financeiro, torneios, cash.
    │   │
    │   └── (Cargos customizáveis pela casa)
    │
    └── JOGADOR
        Acesso ao portal do jogador apenas.
        Vê seus próprios dados, carteira, histórico, ranking.
        Pode se inscrever em torneios online.
```

---

## Matriz de Permissões por Módulo

### Legenda
- ✅ = Permitido por padrão
- ❌ = Negado por padrão
- ⚙️ = Configurável (admin pode habilitar/desabilitar)

### Módulo: Jogadores

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver detalhes | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Próprio |
| Criar | — | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | Próprio (foto, senha) |
| Bloquear | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Excluir (LGPD) | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Solicitar |
| Ver estatísticas | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Próprio |
| Buscar | — | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

### Módulo: Funcionários

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Criar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Atribuir role | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Desativar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Roles/Permissões

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Criar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Excluir | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Torneios

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Disponíveis |
| Ver detalhes | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Próprios |
| Criar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar (rascunho) | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Abrir inscrições | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Iniciar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pausar/Retomar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Finalizar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cancelar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inscrever jogador | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Próprio (online) |
| Registrar rebuy | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrar reentrada | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrar add-on | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Eliminar jogador | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Balancear mesas | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Confirmar premiação | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pagar prêmio | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrar deal | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Chip count | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Confirmar pagamento online | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Módulo: Satélites

Mesmas permissões do módulo de Torneios.

### Módulo: Cash Game

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar mesas | — | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Criar mesa | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Abrir mesa | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Fechar mesa | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sentar jogador | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Comprar fichas | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cashout jogador | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrar rake | — | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Registrar tip | — | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Gerenciar waitlist | — | ✅ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Gerenciar reservas | — | ✅ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |

### Módulo: Caixa

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar caixas | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Abrir caixa | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ❌ | ❌ |
| Fechar caixa | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ❌ | ❌ |
| Sangria | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Suprimento | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver resumo | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Módulo: Carteira

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Ver saldo | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Próprio |
| Depositar | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ❌ | ❌ |
| Sacar | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ❌ | ❌ |
| Creditar bônus | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Creditar promocional | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver extrato | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ❌ | Próprio |
| Recalcular | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Conta Corrente

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Ver contas abertas | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Próprio |
| Registrar pagamento | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ❌ | ❌ |
| Compensar carteira | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fechar conta | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver inadimplência | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Financeiro (Ledger)

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar transações | — | ✅ | ✅ | ❌ | ⚙️ | ❌ | ❌ | ❌ |
| Estorno | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ajuste manual | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Resumo diário | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Bar / Comanda

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar comandas | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ✅ | Própria |
| Abrir comanda | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ✅ | ❌ |
| Lançar consumo | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ✅ | ❌ |
| Remover item | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fechar comanda | — | ✅ | ✅ | ⚙️ | ✅ | ❌ | ⚙️ | ❌ |

### Módulo: Produtos

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Criar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Excluir | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Ranking

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Ativos |
| Ver standings | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Criar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Finalizar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Recalcular | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Rakeback

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Calcular | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Creditar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver histórico | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Próprio |

### Módulo: Presença

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Check-in | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Check-out | — | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Listar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Relatório frequência | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Notificações

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Ver próprias | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marcar lida | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Módulo: WhatsApp

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Ver templates | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Criar/editar template | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Enviar mensagem | — | ✅ | ✅ | ⚙️ | ⚙️ | ❌ | ❌ | ❌ |
| Enviar em massa | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver logs | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Templates

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Listar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Criar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Excluir | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Configurações

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Ver | — | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Fidelidade

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Configurar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ativar/Desativar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver progresso | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | Próprio |

### Módulo: Relatórios

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Financeiro diário | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Financeiro mensal | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rake | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inadimplência | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Frequência | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Rentabilidade jogadores | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Resumo torneio | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vendas bar | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Overlay | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ações funcionário | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exportar PDF/CSV | — | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Auditoria

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Consultar logs | — | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exportar | — | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Módulo: Display

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Gerar token | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver display | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Módulo: Dashboard

| Ação | SuperAdmin | Admin | Gerente | Floor | Caixa | Dealer | Barman | Jogador |
|------|-----------|-------|---------|-------|-------|--------|--------|---------|
| Dashboard admin | — | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| Dashboard operação | — | ✅ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Dashboard jogador | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Estrutura JSON de Permissões no Banco

```json
{
  "permissions": [
    {
      "modulo": "jogadores",
      "acoes": {
        "listar": true,
        "ver": true,
        "criar": true,
        "editar": true,
        "bloquear": false,
        "excluir": false,
        "estatisticas": true,
        "buscar": true
      }
    },
    {
      "modulo": "torneios",
      "acoes": {
        "listar": true,
        "ver": true,
        "criar": true,
        "editar": true,
        "abrir": true,
        "iniciar": true,
        "pausar": true,
        "finalizar": true,
        "cancelar": false,
        "inscrever": true,
        "rebuy": true,
        "reentrada": true,
        "addon": true,
        "eliminar": true,
        "balancear": true,
        "premiacao": true,
        "pagar_premio": true,
        "deal": true,
        "chipcount": true,
        "confirmar_pagamento": true
      }
    },
    {
      "modulo": "caixa",
      "acoes": {
        "listar": true,
        "abrir": true,
        "fechar": true,
        "sangria": false,
        "suprimento": false,
        "resumo": true
      }
    }
    // ... demais módulos
  ]
}
```

---

## Roles Padrão (System Roles)

Na criação de cada organização, o sistema cria automaticamente estes roles com `is_system = true`:

1. **Admin** — todas as permissões = true
2. **Gerente** — tudo exceto: configurações editar, ajuste manual, excluir jogador, roles, exportar auditoria
3. **Floor** — torneios, cash, presença, buscar jogadores, dashboard operação
4. **Caixa** — caixa, pagamentos, depósitos, saques, inscrições, comandas
5. **Dealer** — registrar rake, registrar tip, ver mesas
6. **Barman** — comandas, lançar consumo, ver produtos, buscar jogadores

O admin pode editar as permissões dos roles não-system e criar novos roles customizados.

---

## Regras de Segurança

1. **Nenhum usuário pode escalar privilégios:** um Gerente não pode criar um usuário Admin
2. **Admin não pode remover seu próprio acesso:** proteção contra lock-out
3. **Jogador SEMPRE acessa apenas seus próprios dados:** filtro por user_id + organization_id
4. **Permissões são verificadas no middleware:** antes de executar qualquer lógica de negócio
5. **Permissões ⚙️ (configuráveis):** admin decide se aquele role tem ou não acesso — padrão é desabilitado
6. **SuperAdmin é hardcoded:** não é um role no banco — é verificado por flag especial no JWT
