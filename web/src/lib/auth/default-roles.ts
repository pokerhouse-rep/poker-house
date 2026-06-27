type Permission = {
  modulo: string
  acoes: Record<string, boolean>
}

type RoleDefinition = {
  nome: string
  descricao: string
  permissions: Permission[]
}

const ALL_TRUE = {
  listar: true, ver: true, criar: true, editar: true,
  deletar: true, estornar: true,
}

const READ_ONLY = {
  listar: true, ver: true, criar: false, editar: false,
  deletar: false, estornar: false,
}

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    nome: 'Admin',
    descricao: 'Acesso total dentro da organização',
    permissions: [
      { modulo: 'jogadores', acoes: ALL_TRUE },
      { modulo: 'funcionarios', acoes: ALL_TRUE },
      { modulo: 'roles', acoes: ALL_TRUE },
      { modulo: 'torneios', acoes: ALL_TRUE },
      { modulo: 'satelites', acoes: ALL_TRUE },
      { modulo: 'cash_game', acoes: ALL_TRUE },
      { modulo: 'caixa', acoes: ALL_TRUE },
      { modulo: 'carteira', acoes: ALL_TRUE },
      { modulo: 'conta_corrente', acoes: ALL_TRUE },
      { modulo: 'financeiro', acoes: ALL_TRUE },
      { modulo: 'bar', acoes: ALL_TRUE },
      { modulo: 'produtos', acoes: ALL_TRUE },
      { modulo: 'ranking', acoes: ALL_TRUE },
      { modulo: 'rakeback', acoes: ALL_TRUE },
      { modulo: 'presenca', acoes: ALL_TRUE },
      { modulo: 'notificacoes', acoes: ALL_TRUE },
      { modulo: 'whatsapp', acoes: ALL_TRUE },
      { modulo: 'templates', acoes: ALL_TRUE },
      { modulo: 'configuracoes', acoes: ALL_TRUE },
      { modulo: 'fidelidade', acoes: ALL_TRUE },
      { modulo: 'relatorios', acoes: ALL_TRUE },
      { modulo: 'auditoria', acoes: ALL_TRUE },
      { modulo: 'display', acoes: ALL_TRUE },
      { modulo: 'dashboard', acoes: ALL_TRUE },
    ],
  },
  {
    nome: 'Gerente',
    descricao: 'Quase tudo do admin, exceto configurações críticas',
    permissions: [
      { modulo: 'jogadores', acoes: { ...ALL_TRUE, deletar: false } },
      { modulo: 'funcionarios', acoes: READ_ONLY },
      { modulo: 'roles', acoes: READ_ONLY },
      { modulo: 'torneios', acoes: { ...ALL_TRUE, deletar: false } },
      { modulo: 'satelites', acoes: { ...ALL_TRUE, deletar: false } },
      { modulo: 'cash_game', acoes: ALL_TRUE },
      { modulo: 'caixa', acoes: ALL_TRUE },
      { modulo: 'carteira', acoes: ALL_TRUE },
      { modulo: 'conta_corrente', acoes: ALL_TRUE },
      { modulo: 'financeiro', acoes: { ...ALL_TRUE, estornar: true } },
      { modulo: 'bar', acoes: ALL_TRUE },
      { modulo: 'produtos', acoes: { ...ALL_TRUE, deletar: false } },
      { modulo: 'ranking', acoes: READ_ONLY },
      { modulo: 'rakeback', acoes: READ_ONLY },
      { modulo: 'presenca', acoes: { listar: true, ver: true, criar: true, editar: false, deletar: false, estornar: false } },
      { modulo: 'notificacoes', acoes: READ_ONLY },
      { modulo: 'whatsapp', acoes: { ...READ_ONLY, criar: true } },
      { modulo: 'templates', acoes: { ...ALL_TRUE, deletar: false } },
      { modulo: 'configuracoes', acoes: READ_ONLY },
      { modulo: 'fidelidade', acoes: READ_ONLY },
      { modulo: 'relatorios', acoes: READ_ONLY },
      { modulo: 'auditoria', acoes: READ_ONLY },
      { modulo: 'display', acoes: READ_ONLY },
      { modulo: 'dashboard', acoes: READ_ONLY },
    ],
  },
  {
    nome: 'Floor',
    descricao: 'Gerencia torneios e cash games',
    permissions: [
      { modulo: 'jogadores', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, buscar: true } },
      { modulo: 'torneios', acoes: { ...ALL_TRUE, deletar: false, estornar: false } },
      { modulo: 'satelites', acoes: { ...ALL_TRUE, deletar: false, estornar: false } },
      { modulo: 'cash_game', acoes: { ...ALL_TRUE, deletar: false, estornar: false } },
      { modulo: 'presenca', acoes: { listar: true, ver: true, criar: true, editar: false, deletar: false, estornar: false } },
      { modulo: 'templates', acoes: { listar: true, ver: true, criar: true, editar: true, deletar: false, estornar: false } },
      { modulo: 'display', acoes: READ_ONLY },
      { modulo: 'dashboard', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false } },
    ],
  },
  {
    nome: 'Caixa',
    descricao: 'Operações de caixa, pagamentos e inscrições',
    permissions: [
      { modulo: 'jogadores', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, buscar: true } },
      { modulo: 'torneios', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, inscrever: true, rebuy: true, reentrada: true, addon: true, pagar_premio: true, confirmar_pagamento: true } },
      { modulo: 'cash_game', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, sentar: true, comprar_fichas: true, cashout: true } },
      { modulo: 'caixa', acoes: { listar: true, ver: true, criar: true, editar: false, deletar: false, estornar: false, abrir: true, fechar: true } },
      { modulo: 'carteira', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, depositar: true, sacar: true } },
      { modulo: 'conta_corrente', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, pagar: true, fechar: true } },
      { modulo: 'bar', acoes: { listar: true, ver: true, criar: true, editar: false, deletar: false, estornar: false } },
      { modulo: 'presenca', acoes: { listar: true, ver: true, criar: true, editar: false, deletar: false, estornar: false } },
    ],
  },
  {
    nome: 'Dealer',
    descricao: 'Registra rake no cash game',
    permissions: [
      { modulo: 'cash_game', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false, registrar_rake: true, registrar_tip: true } },
    ],
  },
  {
    nome: 'Barman',
    descricao: 'Lança consumo na comanda',
    permissions: [
      { modulo: 'jogadores', acoes: { listar: false, ver: false, criar: false, editar: false, deletar: false, estornar: false, buscar: true } },
      { modulo: 'bar', acoes: { listar: true, ver: true, criar: true, editar: false, deletar: false, estornar: false } },
      { modulo: 'produtos', acoes: { listar: true, ver: true, criar: false, editar: false, deletar: false, estornar: false } },
    ],
  },
]
