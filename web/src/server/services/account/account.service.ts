import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { createTransaction } from '../ledger/ledger.service'
import { refreshWalletCache } from '../wallet/wallet.service'
import { eventBus, Events } from '@/server/events/event-bus'
import type { AccountItemTipo, FormaPagamento } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

export async function getOrCreateOpenAccount(
  organizationId: string,
  jogadorId: string,
  diaOperacional: Date
) {
  let account = await prisma.account.findFirst({
    where: {
      organization_id: organizationId,
      jogador_id: jogadorId,
      status: 'ABERTA',
    },
    include: { items: true },
  })

  if (!account) {
    account = await prisma.account.create({
      data: {
        organization_id: organizationId,
        jogador_id: jogadorId,
        dia_operacional: diaOperacional,
      },
      include: { items: true },
    })

    eventBus.emit(Events.ACCOUNT_OPENED, {
      account_id: account.id,
      jogador_id: jogadorId,
      organization_id: organizationId,
    })
  }

  return account
}

export async function addItem(params: {
  organization_id: string
  jogador_id: string
  tipo: AccountItemTipo
  descricao: string
  valor: number
  transaction_id?: string
  tx?: Prisma.TransactionClient
}) {
  const db = params.tx || prisma

  const account = await getOrCreateOpenAccount(
    params.organization_id,
    params.jogador_id,
    new Date()
  )

  const item = await db.accountItem.create({
    data: {
      account_id: account.id,
      tipo: params.tipo,
      descricao: params.descricao,
      valor: new Prisma.Decimal(params.valor),
      transaction_id: params.transaction_id,
    },
  })

  await db.account.update({
    where: { id: account.id },
    data: {
      total: { increment: new Prisma.Decimal(params.valor) },
    },
  })

  if (!params.tx) {
    eventBus.emit(Events.ACCOUNT_ITEM_ADDED, {
      account_id: account.id,
      item,
      jogador_id: params.jogador_id,
    })
  }

  return item
}

export async function payAccount(params: {
  organization_id: string
  account_id: string
  valor: number
  forma_pagamento: FormaPagamento
  funcionario_id: string
  caixa_id?: string
  item_ids?: string[]
}) {
  if (params.valor <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Valor deve ser positivo' })
  }

  const account = await prisma.account.findFirst({
    where: {
      id: params.account_id,
      organization_id: params.organization_id,
      status: 'ABERTA',
    },
    include: { items: { where: { pago: false } } },
  })

  if (!account) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Conta não encontrada ou já fechada' })
  }

  return prisma.$transaction(async (tx) => {
    const transaction = await createTransaction(
      {
        organization_id: params.organization_id,
        tipo: 'CREDITO',
        categoria: 'PAGAMENTO',
        valor: params.valor,
        jogador_id: account.jogador_id,
        funcionario_id: params.funcionario_id,
        referencia_tipo: 'CAIXA',
        referencia_id: params.account_id,
        caixa_id: params.caixa_id,
        forma_pagamento: params.forma_pagamento,
        descricao: 'Pagamento de conta corrente',
        dia_operacional: new Date(),
      },
      tx
    )

    let remaining = params.valor

    const itemsToUpdate = params.item_ids
      ? account.items.filter((i) => params.item_ids!.includes(i.id))
      : account.items

    for (const item of itemsToUpdate) {
      if (remaining <= 0) break

      const devendo = Number(item.valor) - Number(item.valor_pago)
      const pagar = Math.min(devendo, remaining)

      await tx.accountItem.update({
        where: { id: item.id },
        data: {
          valor_pago: { increment: new Prisma.Decimal(pagar) },
          pago: pagar >= devendo,
          paid_at: pagar >= devendo ? new Date() : undefined,
        },
      })

      remaining -= pagar
    }

    const updatedAccount = await tx.account.update({
      where: { id: account.id },
      data: {
        total_pago: { increment: new Prisma.Decimal(params.valor) },
      },
      include: { items: true },
    })

    const allPaid = updatedAccount.items.every((i) => i.pago)
    if (allPaid) {
      await tx.account.update({
        where: { id: account.id },
        data: { status: 'FECHADA', fechada_em: new Date() },
      })
    }

    return { account: updatedAccount, transaction, closed: allPaid }
  }).then((result) => {
    eventBus.emit(Events.ACCOUNT_PAYMENT, {
      account_id: params.account_id,
      valor: params.valor,
      closed: result.closed,
      jogador_id: account.jogador_id,
    })

    if (result.closed) {
      eventBus.emit(Events.ACCOUNT_CLOSED, {
        account_id: params.account_id,
        jogador_id: account.jogador_id,
      })
    }

    return result
  })
}

export async function compensateWithWallet(params: {
  organization_id: string
  account_id: string
  jogador_id: string
  funcionario_id: string
}) {
  const [account, wallet] = await Promise.all([
    prisma.account.findFirst({
      where: {
        id: params.account_id,
        organization_id: params.organization_id,
        status: 'ABERTA',
      },
    }),
    prisma.wallet.findUnique({
      where: { jogador_id: params.jogador_id },
    }),
  ])

  if (!account) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Conta não encontrada' })
  }

  if (!wallet) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Jogador não possui carteira' })
  }

  const devendo = Number(account.total) - Number(account.total_pago)
  if (devendo <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Conta sem saldo devedor' })
  }

  const saldoCarteira =
    Number(wallet.saldo_disponivel) +
    Number(wallet.saldo_bonus) +
    Number(wallet.saldo_rakeback) +
    Number(wallet.saldo_premiacoes) +
    Number(wallet.saldo_promocional)

  const valorCompensar = Math.min(devendo, saldoCarteira)

  if (valorCompensar <= 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Sem saldo na carteira para compensar' })
  }

  const result = await payAccount({
    organization_id: params.organization_id,
    account_id: params.account_id,
    valor: valorCompensar,
    forma_pagamento: 'CARTEIRA',
    funcionario_id: params.funcionario_id,
  })

  await refreshWalletCache(params.organization_id, params.jogador_id)

  return result
}

export async function getAccountSummary(
  organizationId: string,
  jogadorId: string
) {
  const accounts = await prisma.account.findMany({
    where: {
      organization_id: organizationId,
      jogador_id: jogadorId,
      status: 'ABERTA',
    },
    include: {
      items: {
        orderBy: { created_at: 'desc' },
      },
    },
  })

  const totalDevendo = accounts.reduce(
    (sum, acc) => sum + Number(acc.total) - Number(acc.total_pago),
    0
  )

  return {
    accounts,
    total_devendo: totalDevendo,
    has_open_accounts: accounts.length > 0,
  }
}

export async function listOpenAccounts(params: {
  organization_id: string
  page: number
  limit: number
}) {
  const where = {
    organization_id: params.organization_id,
    status: 'ABERTA' as const,
  }

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      include: {
        jogador: { select: { id: true, nome: true, nickname: true, cpf: true } },
        items: { where: { pago: false } },
      },
      orderBy: { aberta_em: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.account.count({ where }),
  ])

  return { accounts, total }
}

export async function listOverdueAccounts(params: {
  organization_id: string
  dias_minimo?: number
  page: number
  limit: number
}) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - (params.dias_minimo || 1))

  const where = {
    organization_id: params.organization_id,
    status: 'ABERTA' as const,
    aberta_em: { lte: cutoffDate },
  }

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      include: {
        jogador: { select: { id: true, nome: true, nickname: true, cpf: true, telefone: true } },
      },
      orderBy: { aberta_em: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.account.count({ where }),
  ])

  return { accounts, total }
}
