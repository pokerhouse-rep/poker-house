import { prisma } from '@/lib/prisma'
import { eventBus, Events } from '@/server/events/event-bus'
import type {
  LedgerTipo,
  LedgerCategoria,
  SaldoTipo,
  ReferenciaTipo,
  FormaPagamento,
} from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

export type CreateTransactionInput = {
  organization_id: string
  tipo: LedgerTipo
  categoria: LedgerCategoria
  valor: number
  saldo_tipo?: SaldoTipo | null
  jogador_id?: string | null
  funcionario_id: string
  referencia_tipo: ReferenciaTipo
  referencia_id: string
  caixa_id?: string | null
  forma_pagamento?: FormaPagamento | null
  descricao?: string | null
  metadata?: Record<string, unknown> | null
  dia_operacional: Date
}

export async function createTransaction(
  input: CreateTransactionInput,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma

  const transaction = await db.ledgerTransaction.create({
    data: {
      organization_id: input.organization_id,
      tipo: input.tipo,
      categoria: input.categoria,
      valor: new Prisma.Decimal(input.valor),
      saldo_tipo: input.saldo_tipo ?? null,
      jogador_id: input.jogador_id ?? null,
      funcionario_id: input.funcionario_id,
      referencia_tipo: input.referencia_tipo,
      referencia_id: input.referencia_id,
      caixa_id: input.caixa_id ?? null,
      forma_pagamento: input.forma_pagamento ?? null,
      descricao: input.descricao ?? null,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      dia_operacional: input.dia_operacional,
    },
  })

  if (!tx) {
    eventBus.emit(Events.LEDGER_TRANSACTION_CREATED, transaction)
  }

  return transaction
}

export async function createRefund(
  originalTransactionId: string,
  motivo: string,
  funcionario_id: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma

  const original = await db.ledgerTransaction.findUnique({
    where: { id: originalTransactionId },
  })

  if (!original) {
    throw new Error('Transação original não encontrada')
  }

  const tipoEstorno = original.tipo === 'CREDITO' ? 'DEBITO' : 'CREDITO'

  return createTransaction(
    {
      organization_id: original.organization_id,
      tipo: tipoEstorno as LedgerTipo,
      categoria: 'ESTORNO',
      valor: Number(original.valor),
      saldo_tipo: original.saldo_tipo,
      jogador_id: original.jogador_id,
      funcionario_id,
      referencia_tipo: original.referencia_tipo as ReferenciaTipo,
      referencia_id: original.referencia_id,
      caixa_id: original.caixa_id,
      forma_pagamento: original.forma_pagamento,
      descricao: `Estorno: ${motivo}`,
      metadata: { original_transaction_id: originalTransactionId },
      dia_operacional: new Date(),
    },
    tx
  )
}

export async function getPlayerBalance(
  organizationId: string,
  jogadorId: string,
  saldoTipo?: SaldoTipo
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    jogador_id: jogadorId,
  }

  if (saldoTipo) {
    where.saldo_tipo = saldoTipo
  }

  const creditos = await prisma.ledgerTransaction.aggregate({
    where: { ...where, tipo: 'CREDITO' },
    _sum: { valor: true },
  })

  const debitos = await prisma.ledgerTransaction.aggregate({
    where: { ...where, tipo: 'DEBITO' },
    _sum: { valor: true },
  })

  const totalCreditos = Number(creditos._sum.valor || 0)
  const totalDebitos = Number(debitos._sum.valor || 0)

  return totalCreditos - totalDebitos
}

export async function recalculateAllBalances(
  organizationId: string,
  jogadorId: string
) {
  const saldoTipos: SaldoTipo[] = [
    'DISPONIVEL',
    'PENDENTE',
    'BLOQUEADO',
    'PROMOCIONAL',
    'BONUS',
    'RAKEBACK',
    'PREMIACOES',
  ]

  const balances: Record<string, number> = {}

  for (const tipo of saldoTipos) {
    balances[tipo] = await getPlayerBalance(organizationId, jogadorId, tipo)
  }

  return balances
}

export async function getTransactions(params: {
  organization_id: string
  jogador_id?: string
  categoria?: LedgerCategoria
  tipo?: LedgerTipo
  dia_operacional?: Date
  from?: Date
  to?: Date
  page: number
  limit: number
}) {
  const where: Record<string, unknown> = {
    organization_id: params.organization_id,
  }

  if (params.jogador_id) where.jogador_id = params.jogador_id
  if (params.categoria) where.categoria = params.categoria
  if (params.tipo) where.tipo = params.tipo
  if (params.dia_operacional) where.dia_operacional = params.dia_operacional

  if (params.from || params.to) {
    where.created_at = {}
    if (params.from) (where.created_at as Record<string, unknown>).gte = params.from
    if (params.to) (where.created_at as Record<string, unknown>).lte = params.to
  }

  const [transactions, total] = await Promise.all([
    prisma.ledgerTransaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      include: {
        jogador: { select: { id: true, nome: true, nickname: true } },
        funcionario: { select: { id: true, nome: true } },
      },
    }),
    prisma.ledgerTransaction.count({ where }),
  ])

  return { transactions, total }
}

export async function getDailySummary(
  organizationId: string,
  diaOperacional: Date
) {
  const where = {
    organization_id: organizationId,
    dia_operacional: diaOperacional,
  }

  const [receitas, despesas] = await Promise.all([
    prisma.ledgerTransaction.groupBy({
      by: ['categoria'],
      where: { ...where, tipo: 'CREDITO' },
      _sum: { valor: true },
    }),
    prisma.ledgerTransaction.groupBy({
      by: ['categoria'],
      where: { ...where, tipo: 'DEBITO' },
      _sum: { valor: true },
    }),
  ])

  const totalReceitas = receitas.reduce(
    (acc, r) => acc + Number(r._sum.valor || 0),
    0
  )
  const totalDespesas = despesas.reduce(
    (acc, d) => acc + Number(d._sum.valor || 0),
    0
  )

  return {
    receitas: receitas.map((r) => ({
      categoria: r.categoria,
      valor: Number(r._sum.valor || 0),
    })),
    despesas: despesas.map((d) => ({
      categoria: d.categoria,
      valor: Number(d._sum.valor || 0),
    })),
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    resultado: totalReceitas - totalDespesas,
  }
}
