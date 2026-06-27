import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { createTransaction, recalculateAllBalances } from '../ledger/ledger.service'
import { eventBus, Events } from '@/server/events/event-bus'
import type { FormaPagamento, SaldoTipo } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

const SALDO_PRIORITY: SaldoTipo[] = [
  'PROMOCIONAL',
  'BONUS',
  'RAKEBACK',
  'DISPONIVEL',
  'PREMIACOES',
]

export async function getWallet(organizationId: string, jogadorId: string) {
  let wallet = await prisma.wallet.findUnique({
    where: { jogador_id: jogadorId },
  })

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        organization_id: organizationId,
        jogador_id: jogadorId,
      },
    })
  }

  return wallet
}

export async function refreshWalletCache(
  organizationId: string,
  jogadorId: string
) {
  const balances = await recalculateAllBalances(organizationId, jogadorId)

  const wallet = await prisma.wallet.upsert({
    where: { jogador_id: jogadorId },
    update: {
      saldo_disponivel: new Prisma.Decimal(balances.DISPONIVEL),
      saldo_pendente: new Prisma.Decimal(balances.PENDENTE),
      saldo_bloqueado: new Prisma.Decimal(balances.BLOQUEADO),
      saldo_promocional: new Prisma.Decimal(balances.PROMOCIONAL),
      saldo_bonus: new Prisma.Decimal(balances.BONUS),
      saldo_rakeback: new Prisma.Decimal(balances.RAKEBACK),
      saldo_premiacoes: new Prisma.Decimal(balances.PREMIACOES),
    },
    create: {
      organization_id: organizationId,
      jogador_id: jogadorId,
      saldo_disponivel: new Prisma.Decimal(balances.DISPONIVEL),
      saldo_pendente: new Prisma.Decimal(balances.PENDENTE),
      saldo_bloqueado: new Prisma.Decimal(balances.BLOQUEADO),
      saldo_promocional: new Prisma.Decimal(balances.PROMOCIONAL),
      saldo_bonus: new Prisma.Decimal(balances.BONUS),
      saldo_rakeback: new Prisma.Decimal(balances.RAKEBACK),
      saldo_premiacoes: new Prisma.Decimal(balances.PREMIACOES),
    },
  })

  eventBus.emit(Events.WALLET_BALANCE_CHANGED, {
    jogador_id: jogadorId,
    organization_id: organizationId,
    wallet,
  })

  return wallet
}

export async function deposit(params: {
  organization_id: string
  jogador_id: string
  funcionario_id: string
  valor: number
  forma_pagamento: FormaPagamento
  saldo_tipo?: SaldoTipo
  caixa_id?: string
  descricao?: string
}) {
  if (params.valor <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor deve ser positivo' })
  }

  const transaction = await createTransaction({
    organization_id: params.organization_id,
    tipo: 'CREDITO',
    categoria: 'DEPOSITO',
    valor: params.valor,
    saldo_tipo: params.saldo_tipo || 'DISPONIVEL',
    jogador_id: params.jogador_id,
    funcionario_id: params.funcionario_id,
    referencia_tipo: 'CARTEIRA',
    referencia_id: params.jogador_id,
    caixa_id: params.caixa_id,
    forma_pagamento: params.forma_pagamento,
    descricao: params.descricao || 'Depósito na carteira',
    dia_operacional: new Date(),
  })

  const wallet = await refreshWalletCache(
    params.organization_id,
    params.jogador_id
  )

  eventBus.emit(Events.WALLET_DEPOSIT, {
    jogador_id: params.jogador_id,
    valor: params.valor,
    transaction,
    wallet,
  })

  return { wallet, transaction }
}

export async function withdraw(params: {
  organization_id: string
  jogador_id: string
  funcionario_id: string
  valor: number
  forma_pagamento: FormaPagamento
  caixa_id?: string
}) {
  if (params.valor <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor deve ser positivo' })
  }

  const wallet = await getWallet(params.organization_id, params.jogador_id)
  const saldoTotal =
    Number(wallet.saldo_disponivel) +
    Number(wallet.saldo_bonus) +
    Number(wallet.saldo_rakeback) +
    Number(wallet.saldo_premiacoes) +
    Number(wallet.saldo_promocional)

  if (saldoTotal < params.valor) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Saldo insuficiente. Disponível: R$ ${saldoTotal.toFixed(2)}`,
    })
  }

  const transaction = await createTransaction({
    organization_id: params.organization_id,
    tipo: 'DEBITO',
    categoria: 'SAQUE',
    valor: params.valor,
    saldo_tipo: 'DISPONIVEL',
    jogador_id: params.jogador_id,
    funcionario_id: params.funcionario_id,
    referencia_tipo: 'CARTEIRA',
    referencia_id: params.jogador_id,
    caixa_id: params.caixa_id,
    forma_pagamento: params.forma_pagamento,
    descricao: 'Saque da carteira',
    dia_operacional: new Date(),
  })

  const updatedWallet = await refreshWalletCache(
    params.organization_id,
    params.jogador_id
  )

  eventBus.emit(Events.WALLET_WITHDRAW, {
    jogador_id: params.jogador_id,
    valor: params.valor,
    transaction,
    wallet: updatedWallet,
  })

  return { wallet: updatedWallet, transaction }
}

export async function debitFromWallet(params: {
  organization_id: string
  jogador_id: string
  funcionario_id: string
  valor: number
  categoria: 'BUYIN' | 'REBUY' | 'ADDON' | 'REENTRADA' | 'BAR' | 'CASH_COMPRA_FICHAS'
  referencia_tipo: 'TORNEIO' | 'SATELITE' | 'MESA_CASH' | 'BAR'
  referencia_id: string
  caixa_id?: string
  descricao?: string
  tx?: Prisma.TransactionClient
}) {
  const wallet = await getWallet(params.organization_id, params.jogador_id)
  const saldoTotal =
    Number(wallet.saldo_disponivel) +
    Number(wallet.saldo_bonus) +
    Number(wallet.saldo_rakeback) +
    Number(wallet.saldo_premiacoes) +
    Number(wallet.saldo_promocional)

  if (saldoTotal < params.valor) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Saldo insuficiente na carteira',
    })
  }

  let remaining = params.valor
  const transactions = []

  for (const saldoTipo of SALDO_PRIORITY) {
    if (remaining <= 0) break

    const saldoKey = `saldo_${saldoTipo.toLowerCase()}` as keyof typeof wallet
    const available = Number(wallet[saldoKey])

    if (available <= 0) continue

    const toDebit = Math.min(available, remaining)

    const transaction = await createTransaction(
      {
        organization_id: params.organization_id,
        tipo: 'DEBITO',
        categoria: params.categoria,
        valor: toDebit,
        saldo_tipo: saldoTipo,
        jogador_id: params.jogador_id,
        funcionario_id: params.funcionario_id,
        referencia_tipo: params.referencia_tipo,
        referencia_id: params.referencia_id,
        caixa_id: params.caixa_id,
        descricao: params.descricao,
        dia_operacional: new Date(),
      },
      params.tx
    )

    transactions.push(transaction)
    remaining -= toDebit
  }

  if (!params.tx) {
    await refreshWalletCache(params.organization_id, params.jogador_id)
  }

  return transactions
}

export async function creditToWallet(params: {
  organization_id: string
  jogador_id: string
  funcionario_id: string
  valor: number
  saldo_tipo: SaldoTipo
  categoria: 'PREMIO' | 'RAKEBACK' | 'BONUS' | 'PROMOCIONAL' | 'FIDELIDADE' | 'ESTORNO' | 'DEAL'
  referencia_tipo: 'TORNEIO' | 'SATELITE' | 'MESA_CASH' | 'RANKING' | 'FIDELIDADE' | 'MANUAL' | 'CARTEIRA'
  referencia_id: string
  caixa_id?: string
  descricao?: string
  tx?: Prisma.TransactionClient
}) {
  const transaction = await createTransaction(
    {
      organization_id: params.organization_id,
      tipo: 'CREDITO',
      categoria: params.categoria,
      valor: params.valor,
      saldo_tipo: params.saldo_tipo,
      jogador_id: params.jogador_id,
      funcionario_id: params.funcionario_id,
      referencia_tipo: params.referencia_tipo,
      referencia_id: params.referencia_id,
      caixa_id: params.caixa_id,
      descricao: params.descricao,
      dia_operacional: new Date(),
    },
    params.tx
  )

  if (!params.tx) {
    await refreshWalletCache(params.organization_id, params.jogador_id)
  }

  return transaction
}

export async function getStatement(params: {
  organization_id: string
  jogador_id: string
  saldo_tipo?: SaldoTipo
  from?: Date
  to?: Date
  page: number
  limit: number
}) {
  const where: Record<string, unknown> = {
    organization_id: params.organization_id,
    jogador_id: params.jogador_id,
  }

  if (params.saldo_tipo) where.saldo_tipo = params.saldo_tipo

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
    }),
    prisma.ledgerTransaction.count({ where }),
  ])

  return { transactions, total }
}
