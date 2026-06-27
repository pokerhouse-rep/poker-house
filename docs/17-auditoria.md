# Etapa 17 — Definição da Auditoria

---

## Princípio

Toda ação que altera estado no sistema é registrada. Nenhum log pode ser alterado ou removido. A auditoria é a prova legal e operacional de tudo que aconteceu.

---

## Estrutura do Log

```
AuditLog {
  id              UUID
  organization_id UUID
  user_id         UUID        // quem executou
  acao            String      // o que fez
  entidade        String      // tabela/módulo afetado
  entidade_id     UUID        // registro afetado
  valores_antigos JSON        // snapshot antes da ação (null se criação)
  valores_novos   JSON        // snapshot depois da ação (null se exclusão)
  ip_address      String
  user_agent      String
  created_at      DateTime    // IMUTÁVEL — sem updated_at, sem deleted_at
}
```

---

## Ações Auditadas

### Autenticação
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `login.sucesso` | user | IP, user_agent, tipo de login |
| `login.falha` | user | IP, tentativa número, CPF/e-mail tentado |
| `login.bloqueio` | user | Motivo, tentativas acumuladas |
| `logout` | user | — |
| `senha.alterada` | user | Por quem (próprio ou admin) |
| `senha.resetada` | user | Via link de recuperação |

### Jogadores
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `jogador.criado` | user | Todos os dados cadastrais |
| `jogador.editado` | user | Campos alterados com antes/depois |
| `jogador.bloqueado` | user | Motivo |
| `jogador.desbloqueado` | user | — |
| `jogador.anonimizado` | user | LGPD — dados removidos |
| `jogador.acesso_liberado` | user | Admin liberou portal |
| `jogador.tag_adicionada` | user | Tag |
| `jogador.tag_removida` | user | Tag |

### Funcionários
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `funcionario.criado` | user | Dados + roles atribuídas |
| `funcionario.editado` | user | Campos alterados |
| `funcionario.desativado` | user | — |
| `funcionario.ativado` | user | — |
| `funcionario.role_atribuida` | user_role | Qual role |
| `funcionario.role_revogada` | user_role | Qual role |

### Roles
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `role.criada` | role | Nome, permissões |
| `role.editada` | role | Permissões antes/depois |
| `role.excluida` | role | — |

### Carteira
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `carteira.deposito` | wallet | Valor, forma pagamento, saldo anterior/novo |
| `carteira.saque` | wallet | Valor, forma pagamento, saldo anterior/novo |
| `carteira.bonus_creditado` | wallet | Valor, motivo |
| `carteira.promocional_creditado` | wallet | Valor, validade |
| `carteira.rakeback_creditado` | wallet | Valor, período |
| `carteira.saldo_expirado` | wallet | Tipo, valor expirado |
| `carteira.compensacao` | wallet | Valor, conta abatida |
| `carteira.recalculada` | wallet | Saldos antes/depois |

### Conta Corrente
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `conta.aberta` | account | Jogador, dia operacional |
| `conta.item_adicionado` | account_item | Tipo, valor, descrição |
| `conta.pagamento_parcial` | account | Valor pago, restante, forma pagamento |
| `conta.fechada` | account | Total, total pago |

### Torneios
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `torneio.criado` | tournament | Configuração completa |
| `torneio.editado` | tournament | Campos alterados |
| `torneio.inscricoes_abertas` | tournament | — |
| `torneio.iniciado` | tournament | Total inscritos |
| `torneio.pausado` | tournament | — |
| `torneio.retomado` | tournament | — |
| `torneio.finalizado` | tournament | Resultado final, prize pool, overlay |
| `torneio.cancelado` | tournament | Motivo, estornos gerados |
| `torneio.jogador_inscrito` | tournament_entry | Jogador, forma pagamento, valor |
| `torneio.inscricao_online` | tournament_entry | Jogador, forma pagamento |
| `torneio.pagamento_confirmado` | tournament_entry | Entry que estava pendente PIX |
| `torneio.rebuy` | tournament_rebuy | Jogador, valor, fichas |
| `torneio.reentrada` | tournament_reentry | Jogador, novo assento |
| `torneio.addon` | tournament_addon | Jogador, valor, fichas |
| `torneio.jogador_eliminado` | tournament_entry | Jogador, posição |
| `torneio.mesas_balanceadas` | tournament | Movimentos realizados |
| `torneio.mesa_quebrada` | tournament | Mesa, redistribuição |
| `torneio.premiacao_sugerida` | tournament | Sugestão automática |
| `torneio.premiacao_confirmada` | tournament | Premiação definida |
| `torneio.premio_pago` | tournament_prize | Jogador, posição, valor |
| `torneio.deal_registrado` | tournament_deal | Jogadores, valores |
| `torneio.chipcount` | tournament | Stacks registrados |
| `torneio.blind_avancado` | tournament | Nível anterior/novo |

### Satélites
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `satelite.criado` | satellite | Torneios alvo |
| `satelite.finalizado` | satellite | Vencedores |
| `satelite.ticket_ganho` | satellite_ticket | Jogador, torneio alvo |
| `satelite.ticket_utilizado` | satellite_ticket | Jogador, torneio |
| `satelite.ticket_transferido` | satellite_ticket | De quem, para quem |
| `satelite.ticket_expirado` | satellite_ticket | Jogador |

### Cash Game
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `cash.mesa_aberta` | cash_table | Modalidade, stakes |
| `cash.mesa_fechada` | cash_table | Conciliação |
| `cash.jogador_sentou` | cash_session | Jogador, assento, buy-in |
| `cash.jogador_saiu` | cash_session | Resultado, fichas |
| `cash.fichas_compradas` | cash_chip_transaction | Valor |
| `cash.fichas_vendidas` | cash_chip_transaction | Valor |
| `cash.rake_registrado` | cash_rake_entry | Valor, dealer |
| `cash.tip_registrado` | cash_session | Valor |
| `cash.troca_mesa` | cash_session | Mesa anterior, nova mesa |
| `cash.waitlist_entrada` | cash_table_waitlist | Jogador, posição |
| `cash.waitlist_saida` | cash_table_waitlist | Jogador |
| `cash.waitlist_chamado` | cash_table_waitlist | Jogador |
| `cash.reserva_criada` | cash_table_reservation | Jogador, assento, validade |
| `cash.reserva_cancelada` | cash_table_reservation | — |
| `cash.reserva_expirada` | cash_table_reservation | — |
| `cash.desbalanceamento` | cash_table | Esperado vs real |

### Caixa
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `caixa.aberto` | cash_register | Tipo, fundo troco, funcionário |
| `caixa.fechado` | cash_register | Esperado, informado, diferença, justificativa |
| `caixa.sangria` | cash_register | Valor, motivo |
| `caixa.suprimento` | cash_register | Valor, motivo |

### Financeiro
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `ledger.transacao_criada` | ledger_transaction | Todos os campos |
| `ledger.estorno` | ledger_transaction | Transação original, motivo, autorizado por |
| `ledger.ajuste_manual` | ledger_transaction | Valor, motivo, autorizado por |

### Bar
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `comanda.aberta` | tab | Jogador, acompanhante |
| `comanda.item_adicionado` | tab_item | Produto, quantidade, valor |
| `comanda.item_removido` | tab_item | Produto, motivo, autorizado por |
| `comanda.fechada` | tab | Total |

### Ranking
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `ranking.criado` | ranking | Configuração completa |
| `ranking.editado` | ranking | Campos alterados |
| `ranking.pontuacao_registrada` | ranking_entry | Jogador, torneio, pontos |
| `ranking.pontuacao_removida` | ranking_entry | Torneio cancelado |
| `ranking.recalculado` | ranking | Standings antes/depois (top 10) |
| `ranking.finalizado` | ranking | Standings final |
| `ranking.premio_creditado` | ranking | Jogador, posição, valor |

### Rakeback
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `rakeback.calculado` | — | Período, total jogadores, total valor |
| `rakeback.creditado` | wallet | Jogador, valor, período |

### Presença
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `presenca.checkin` | presence | Jogador, registrado por |
| `presenca.checkout` | presence | Jogador, duração |

### WhatsApp
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `whatsapp.enviado` | whatsapp_log | Jogador, template, status |
| `whatsapp.falhou` | whatsapp_log | Jogador, template, erro |

### Templates
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `template.criado` | template | Tipo, nome |
| `template.editado` | template | Campos alterados |
| `template.excluido` | template | — |
| `template.duplicado` | template | Original → cópia |

### Configurações
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `config.alterada` | org_config | Chave, valor anterior, valor novo |

### Fidelidade
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `fidelidade.programa_criado` | loyalty_program | Regras |
| `fidelidade.programa_editado` | loyalty_program | Alterações |
| `fidelidade.ativado` | loyalty_program | — |
| `fidelidade.desativado` | loyalty_program | — |
| `fidelidade.meta_atingida` | loyalty_progress | Jogador, programa |
| `fidelidade.premio_creditado` | loyalty_progress | Jogador, valor |

### Plataforma (Super Admin)
| Ação | Entidade | Detalhes |
|------|----------|---------|
| `plataforma.org_criada` | organization | CNPJ, nome, admin |
| `plataforma.org_suspensa` | organization | Motivo |
| `plataforma.org_ativada` | organization | — |
| `plataforma.org_cancelada` | organization | — |
| `plataforma.plano_alterado` | subscription | Plano anterior/novo |

---

## Consulta de Auditoria

### Filtros Disponíveis
```
- Por usuário (quem fez)
- Por entidade (tabela afetada)
- Por ação (tipo de operação)
- Por período (de/até)
- Por entidade_id (registro específico)
- Busca textual (nos valores JSON)
```

### Índices para Performance
```sql
(organization_id, created_at DESC)          -- listagem cronológica
(organization_id, user_id, created_at DESC) -- por funcionário
(organization_id, entidade, entidade_id)    -- histórico de um registro
(organization_id, acao)                     -- por tipo de ação
```

### Exportação
```
- CSV para compliance
- Filtros aplicáveis antes do export
- Somente Admin pode exportar
- A exportação em si é auditada
```

---

## Implementação Técnica

### Middleware Automático

```typescript
// Toda mutation tRPC passa por este middleware
const auditMiddleware = t.middleware(async ({ ctx, next, path, rawInput }) => {
  const result = await next();
  
  // Após execução bem-sucedida, registra no audit
  if (result.ok) {
    await prisma.auditLog.create({
      data: {
        organization_id: ctx.organizationId,
        user_id: ctx.user.id,
        acao: path,           // ex: "tournament.registerEntry"
        entidade: extractEntity(path),
        entidade_id: extractEntityId(result.data),
        valores_antigos: ctx._auditOldValues || null,
        valores_novos: result.data,
        ip_address: ctx.ip,
        user_agent: ctx.userAgent,
      }
    });
  }
  
  return result;
});
```

### Captura de Valores Antigos

```typescript
// Nos services, antes de fazer update:
const old = await prisma.tournament.findUnique({ where: { id } });
ctx._auditOldValues = old;  // Disponível pro middleware

await prisma.tournament.update({ where: { id }, data: changes });
// O middleware captura automaticamente o novo valor
```

---

## Regras Invioláveis

1. **AuditLog NÃO tem updated_at** — registros são imutáveis
2. **AuditLog NÃO tem deleted_at** — registros nunca são removidos
3. **Prisma schema NÃO permite delete** na tabela audit_logs
4. **RLS no banco** impede DELETE mesmo com acesso direto
5. **Nenhuma API expõe** operação de edição ou exclusão de logs
6. **Backup separado** dos logs de auditoria (proteção extra)

```sql
-- Proteção adicional no banco
REVOKE DELETE ON audit_logs FROM ALL;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
```
