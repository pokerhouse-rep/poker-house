# Etapa 2 — Requisitos Não Funcionais

## 1. Performance

- **Tempo de resposta máximo:** 1 segundo para TODAS as operações do sistema (caixa, torneios, cash, bar, consultas, relatórios, cadastros)
- **Jogadores simultâneos por casa:** média 150, pico até 500
- **Funcionários simultâneos por casa:** 10 a 20
- **Projeção de casas:** 100 em 1 ano, 1.000 em 3 anos
- **Carga estimada em 3 anos:** até 500.000 jogadores ativos, 20.000 funcionários, 1.000 tenants simultâneos

## 2. Disponibilidade

- **Uptime:** 24/7, sem janela de manutenção programada
- **SLA alvo:** 99.9% (máximo ~8.7h de downtime/ano)
- **Sem modo offline:** a casa é responsável por garantir internet
- **Resiliência:** em caso de queda de internet, nenhuma informação pode ser perdida — todas as operações do dia devem estar salvas
- **Implicação técnica:** toda operação deve ser persistida imediatamente no banco (sem cache local que possa ser perdido)

## 3. Escalabilidade

- **Horizontal:** a arquitetura deve suportar crescimento de 100 para 1.000 casas sem reescrita
- **Banco de dados:** preparado para milhões de registros de transações financeiras (ledger cresce indefinidamente)
- **Tempo real:** Tournament Display, dashboards e carteira devem escalar com número de conexões simultâneas

## 4. Dados e Retenção

- **Retenção:** indefinida por padrão
- **Exclusão opcional:** a casa pode escolher excluir histórico de jogadores afastados há muito tempo
- **Auditoria:** NUNCA pode ser apagada (mesmo que jogador seja excluído)
- **Ledger:** imutável — transações nunca são alteradas ou removidas

## 5. Conformidade e LGPD

- **Direito à exclusão:** jogador pode solicitar exclusão dos dados pessoais
- **Exceção legal:** dados financeiros e de auditoria são mantidos por obrigação legal/fiscal (anonimizados se necessário)
- **Processo:** ao excluir jogador, anonimizar dados pessoais (nome, CPF, telefone, e-mail, endereço) mas manter registros financeiros com referência anônima

## 6. Responsividade e Dispositivos

- **Desktop:** uso principal do administrador — experiência completa
- **Tablet/Celular:** funcionários e jogadores — interface deve funcionar bem em telas menores
- **Abordagem:** responsive design (mobile-first para portal do jogador, desktop-first para admin)
- **Tournament Display:** compatível com Smart TVs via navegador web, conexão Bluetooth ou cabo (HDMI)

## 7. Segurança

- **Multi-tenancy:** isolamento total entre casas (nível de banco + aplicação)
- **Autenticação:** CPF + senha para jogadores, e-mail + senha para funcionários/admin
- **Autorização:** RBAC com permissões granulares
- **Criptografia:** dados sensíveis em trânsito (TLS) e em repouso
- **Auditoria:** log completo de todas as ações, imutável
- **Prevenção contra fraude:** rastreabilidade total de movimentações financeiras
- **Backup:** automático, com estratégia de recuperação de desastres

## 8. Manutenibilidade

- **Código:** arquitetura modular, separação clara de responsabilidades
- **Deploys:** sem downtime (zero-downtime deployment)
- **Migrações:** banco de dados versionado com rollback
- **Monitoramento:** alertas automáticos para erros, performance degradada e indisponibilidade

## 9. Internacionalização

- **Idioma inicial:** Português (BR)
- **Moeda:** Real (BRL)
- **Fuso horário:** configurável por casa
- **Preparado para:** futuro suporte a outros idiomas e moedas (sem ser prioridade agora)
