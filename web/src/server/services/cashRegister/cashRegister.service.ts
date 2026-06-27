import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { createTransaction } from '../ledger/ledger.service'
import { eventBus, Events } from '@/server/events/event-bus'
import type { CashRegisterTipo } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

export async function openCashRegister(params: {
  organization_id: string
  tipo: CashRegisterTipo
  referencia_id?: string
  funcionario_id: string
  fundo_troco: number
}) {
  const register = await prisma.cashRegister.create({
    data: {
      organization_id: params.organization_id,
      tipo: params.tipo,
      referencia_id: params.referencia_id,
      aberto_por_id: params.funcionario_id,
      fundo_troco: new Prisma.Decimal(params.fundo_troco),
      dia_operacional: new Date(),
    },
  })

  eventBus.emit(Events.CASHREGISTER_OPENED, { caixa_id: register.id, tipo: params.tipo })
  return register
}

export async function closeCashRegister(params: {
  organization_id: string
  id: string
  funcionario_id: string
  valor_informado: number
  justificativa_diferenca?: string
}) {
  const register = await prisma.cashRegister.findFirst({
    where: { id: params.id, organization_id: params.organization_id, status: 'ABERTO' },
  })

  if (!register) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Caixa não encontrado ou já fechado' })
  }

  const transactions = await prisma.ledgerTransaction.findMany({
    where: { caixa_id: params.id },
  })

  const entradas = transactions
    .filter((t) => t.tipo === 'CREDITO')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const saidas = transactions
    .filter((t) => t.tipo === 'DEBITO')
    .reduce((sum, t) => sum + Number(t.valor), 0)

  const valorEsperado = Number(register.fundo_troco) + entradas - saidas
  const diferenca = params.valor_informado - valorEsperado

  if (Math.abs(diferenca) > 0.01 && !params.justificativa_diferenca) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Diferença de R$ ${diferenca.toFixed(2)} detectada. Justificativa obrigatória.`,
    })
  }

  const updated = await prisma.cashRegister.update({
    where: { id: params.id },
    data: {
      status: 'FECHADO',
      fechado_por_id: params.funcionario_id,
      fechado_em: new Date(),
      valor_esperado: new Prisma.Decimal(valorEsperado),
      valor_informado: new Prisma.Decimal(params.valor_informado),
      diferenca: new Prisma.Decimal(diferenca),
      justificativa_diferenca: params.justificativa_diferenca,
    },
  })

  eventBus.emit(Events.CASHREGISTER_CLOSED, {
    caixa_id: params.id,
    valor_esperado: valorEsperado,
    valor_informado: params.valor_informado,
    diferenca,
  })

  return updated
}

export async function registerWithdrawal(params: {
  organization_id: string
  caixa_id: string
  funcionario_id: string
  valor: number
  motivo: string
}) {
  const transaction = await createTransaction({
    organization_id: params.organization_id,
    tipo: 'DEBITO',
    categoria: 'SANGRIA',
    valor: params.valor,
    funcionario_id: params.funcionario_id,
    referencia_tipo: 'CAIXA',
    referencia_id: params.caixa_id,
    caixa_id: params.caixa_id,
    descricao: `Sangria: ${params.motivo}`,
    dia_operacional: new Date(),
  })

  return { transaction }
}

export async function registerSupply(params: {
  organization_id: string
  caixa_id: string
  funcionario_id: string
  valor: number
  motivo: string
}) {
  const transaction = await createTransaction({
    organization_id: params.organization_id,
    tipo: 'CREDITO',
    categoria: 'SUPRIMENTO',
    valor: params.valor,
    funcionario_id: params.funcionario_id,
    referencia_tipo: 'CAIXA',
    referencia_id: params.caixa_id,
    caixa_id: params.caixa_id,
    descricao: `Suprimento: ${params.motivo}`,
    dia_operacional: new Date(),
  })

  return { transaction }
}

export async function listCashRegisters(
  organizationId: string,
  params: { tipo?: string; status?: string; dia_operacional?: Date; page: number; limit: number }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.tipo) where.tipo = params.tipo
  if (params.status) where.status = params.status
  if (params.dia_operacional) where.dia_operacional = params.dia_operacional

  const [registers, total] = await Promise.all([
    prisma.cashRegister.findMany({
      where,
      include: {
        aberto_por: { select: { nome: true } },
        fechado_por: { select: { nome: true } },
      },
      orderBy: { aberto_em: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.cashRegister.count({ where }),
  ])

  return { registers, total }
}

export async function getCashRegisterSummary(organizationId: string, id: string) {
  const register = await prisma.cashRegister.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      aberto_por: { select: { nome: true } },
      fechado_por: { select: { nome: true } },
    },
  })

  if (!register) throw new TRPCError({ code: 'NOT_FOUND' })

  const transactions = await prisma.ledgerTransaction.findMany({
    where: { caixa_id: id },
    orderBy: { created_at: 'desc' },
  })

  const entradas = transactions.filter((t) => t.tipo === 'CREDITO')
  const saidas = transactions.filter((t) => t.tipo === 'DEBITO')

  const totalEntradas = entradas.reduce((sum, t) => sum + Number(t.valor), 0)
  const totalSaidas = saidas.reduce((sum, t) => sum + Number(t.valor), 0)

  return {
    register,
    total_entradas: totalEntradas,
    total_saidas: totalSaidas,
    saldo: Number(register.fundo_troco) + totalEntradas - totalSaidas,
    transactions,
  }
}
