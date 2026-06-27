import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { createTransaction } from '../ledger/ledger.service'
import { debitFromWallet } from '../wallet/wallet.service'
import { addItem } from '../account/account.service'
import { eventBus, Events } from '@/server/events/event-bus'
import type { FormaPagamento, RakeTipo } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

type CreateTableInput = {
  nome: string
  modalidade: string
  stakes: string
  blind_small: number
  blind_big: number
  buyin_minimo: number
  buyin_maximo: number
  max_jogadores?: number
  rake_tipo: RakeTipo
  rake_percentual?: number
  rake_cap?: number
  rake_valor_hora?: number
}

export async function createTable(organizationId: string, input: CreateTableInput) {
  return prisma.cashTable.create({
    data: {
      organization_id: organizationId,
      nome: input.nome,
      modalidade: input.modalidade,
      stakes: input.stakes,
      blind_small: new Prisma.Decimal(input.blind_small),
      blind_big: new Prisma.Decimal(input.blind_big),
      buyin_minimo: new Prisma.Decimal(input.buyin_minimo),
      buyin_maximo: new Prisma.Decimal(input.buyin_maximo),
      max_jogadores: input.max_jogadores || 9,
      rake_tipo: input.rake_tipo,
      rake_percentual: input.rake_percentual ? new Prisma.Decimal(input.rake_percentual) : null,
      rake_cap: input.rake_cap ? new Prisma.Decimal(input.rake_cap) : null,
      rake_valor_hora: input.rake_valor_hora ? new Prisma.Decimal(input.rake_valor_hora) : null,
    },
  })
}

export async function listTables(
  organizationId: string,
  params: { status?: string; modalidade?: string; page: number; limit: number }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.status) where.status = params.status
  if (params.modalidade) where.modalidade = params.modalidade

  const [tables, total] = await Promise.all([
    prisma.cashTable.findMany({
      where,
      include: {
        sessions: { where: { status: 'ATIVA' }, select: { id: true, jogador_id: true, assento_numero: true, jogador: { select: { nome: true, nickname: true } } } },
        waitlist: { orderBy: { posicao: 'asc' }, select: { jogador_id: true, posicao: true } },
        _count: { select: { sessions: { where: { status: 'ATIVA' } } } },
      },
      orderBy: { nome: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.cashTable.count({ where }),
  ])

  return { tables, total }
}

export async function openTable(organizationId: string, tableId: string, funcionarioId: string) {
  const table = await prisma.cashTable.findFirst({
    where: { id: tableId, organization_id: organizationId, status: 'FECHADA' },
  })
  if (!table) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mesa não está fechada' })

  const cashRegister = await prisma.cashRegister.create({
    data: {
      organization_id: organizationId,
      tipo: 'MESA_CASH',
      referencia_id: tableId,
      aberto_por_id: funcionarioId,
      dia_operacional: new Date(),
    },
  })

  const updated = await prisma.cashTable.update({
    where: { id: tableId },
    data: { status: 'ABERTA', caixa_id: cashRegister.id },
  })

  eventBus.emit(Events.CASHREGISTER_OPENED, { table_id: tableId })
  return { table: updated, cashRegister }
}

export async function seatPlayer(params: {
  organization_id: string
  table_id: string
  jogador_id: string
  funcionario_id: string
  assento?: number
  buyin_valor: number
  forma_pagamento: FormaPagamento
}) {
  const table = await prisma.cashTable.findFirst({
    where: { id: params.table_id, organization_id: params.organization_id, status: { in: ['ABERTA', 'CHEIA'] } },
  })
  if (!table) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mesa não está aberta' })

  if (params.buyin_valor < Number(table.buyin_minimo) || params.buyin_valor > Number(table.buyin_maximo)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Buy-in deve ser entre R$ ${table.buyin_minimo} e R$ ${table.buyin_maximo}` })
  }

  const activeSessions = await prisma.cashSession.count({
    where: { cash_table_id: params.table_id, status: 'ATIVA' },
  })
  if (activeSessions >= table.max_jogadores) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Mesa cheia' })
  }

  return prisma.$transaction(async (tx) => {
    const session = await tx.cashSession.create({
      data: {
        cash_table_id: params.table_id,
        jogador_id: params.jogador_id,
        assento_numero: params.assento,
        buyin_total: new Prisma.Decimal(params.buyin_valor),
      },
    })

    const transaction = await createTransaction({
      organization_id: params.organization_id,
      tipo: 'DEBITO',
      categoria: 'CASH_COMPRA_FICHAS',
      valor: params.buyin_valor,
      jogador_id: params.jogador_id,
      funcionario_id: params.funcionario_id,
      referencia_tipo: 'MESA_CASH',
      referencia_id: params.table_id,
      caixa_id: table.caixa_id ?? undefined,
      forma_pagamento: params.forma_pagamento,
      descricao: `Compra fichas: ${table.nome}`,
      dia_operacional: new Date(),
    }, tx)

    await tx.cashChipTransaction.create({
      data: { session_id: session.id, tipo: 'COMPRA', valor: new Prisma.Decimal(params.buyin_valor), transaction_id: transaction.id },
    })

    if (params.forma_pagamento !== 'CARTEIRA') {
      await addItem({
        organization_id: params.organization_id,
        jogador_id: params.jogador_id,
        tipo: 'CASH_COMPRA',
        descricao: `Compra fichas: ${table.nome}`,
        valor: params.buyin_valor,
        transaction_id: transaction.id,
        tx,
      })
    }

    if (activeSessions + 1 >= table.max_jogadores) {
      await tx.cashTable.update({ where: { id: params.table_id }, data: { status: 'CHEIA' } })
    }

    return { session, transaction }
  }).then((result) => {
    eventBus.emit(Events.CASH_PLAYER_SEATED, { session: result.session, table_id: params.table_id })
    return result
  })
}

export async function buyChips(params: {
  organization_id: string
  session_id: string
  funcionario_id: string
  valor: number
  forma_pagamento: FormaPagamento
}) {
  const session = await prisma.cashSession.findFirst({
    where: { id: params.session_id, status: 'ATIVA' },
    include: { cash_table: true },
  })
  if (!session) throw new TRPCError({ code: 'NOT_FOUND' })

  return prisma.$transaction(async (tx) => {
    const transaction = await createTransaction({
      organization_id: params.organization_id,
      tipo: 'DEBITO',
      categoria: 'CASH_COMPRA_FICHAS',
      valor: params.valor,
      jogador_id: session.jogador_id,
      funcionario_id: params.funcionario_id,
      referencia_tipo: 'MESA_CASH',
      referencia_id: session.cash_table_id,
      caixa_id: session.cash_table.caixa_id ?? undefined,
      forma_pagamento: params.forma_pagamento,
      descricao: `Compra fichas: ${session.cash_table.nome}`,
      dia_operacional: new Date(),
    }, tx)

    await tx.cashChipTransaction.create({
      data: { session_id: params.session_id, tipo: 'COMPRA', valor: new Prisma.Decimal(params.valor), transaction_id: transaction.id },
    })

    await tx.cashSession.update({
      where: { id: params.session_id },
      data: { buyin_total: { increment: new Prisma.Decimal(params.valor) } },
    })

    return { transaction }
  })
}

export async function cashoutPlayer(params: {
  organization_id: string
  session_id: string
  funcionario_id: string
  fichas_valor: number
}) {
  const session = await prisma.cashSession.findFirst({
    where: { id: params.session_id, status: 'ATIVA' },
    include: { cash_table: true },
  })
  if (!session) throw new TRPCError({ code: 'NOT_FOUND' })

  return prisma.$transaction(async (tx) => {
    const transaction = await createTransaction({
      organization_id: params.organization_id,
      tipo: 'CREDITO',
      categoria: 'CASH_VENDA_FICHAS',
      valor: params.fichas_valor,
      jogador_id: session.jogador_id,
      funcionario_id: params.funcionario_id,
      referencia_tipo: 'MESA_CASH',
      referencia_id: session.cash_table_id,
      caixa_id: session.cash_table.caixa_id ?? undefined,
      descricao: `Venda fichas: ${session.cash_table.nome}`,
      dia_operacional: new Date(),
    }, tx)

    await tx.cashChipTransaction.create({
      data: { session_id: params.session_id, tipo: 'VENDA', valor: new Prisma.Decimal(params.fichas_valor), transaction_id: transaction.id },
    })

    const resultado = params.fichas_valor - Number(session.buyin_total)

    await tx.cashSession.update({
      where: { id: params.session_id },
      data: {
        cashout_total: new Prisma.Decimal(params.fichas_valor),
        resultado: new Prisma.Decimal(resultado),
        status: 'FINALIZADA',
        fim: new Date(),
      },
    })

    const activeCount = await tx.cashSession.count({
      where: { cash_table_id: session.cash_table_id, status: 'ATIVA' },
    })

    if (session.cash_table.status === 'CHEIA' && activeCount < session.cash_table.max_jogadores) {
      await tx.cashTable.update({ where: { id: session.cash_table_id }, data: { status: 'ABERTA' } })
    }

    return { session_id: params.session_id, resultado, transaction }
  }).then((result) => {
    eventBus.emit(Events.CASH_PLAYER_LEFT, {
      session_id: params.session_id,
      jogador_id: session.jogador_id,
      table_id: session.cash_table_id,
      resultado: result.resultado,
    })

    prisma.cashSession.count({
      where: { jogador_id: session.jogador_id, status: 'ATIVA' },
    }).then((active) => {
      if (active === 0) {
        prisma.tournamentEntry.count({
          where: { jogador_id: session.jogador_id, eliminado: false },
        }).then((activeTournaments) => {
          if (activeTournaments === 0) {
            eventBus.emit(Events.ACCOUNT_SUGGESTION_CLOSE, {
              jogador_id: session.jogador_id,
              organization_id: params.organization_id,
            })
          }
        })
      }
    })

    return result
  })
}

export async function registerRake(params: {
  organization_id: string
  table_id: string
  funcionario_id: string
  valor: number
}) {
  const table = await prisma.cashTable.findFirst({
    where: { id: params.table_id, organization_id: params.organization_id, status: { in: ['ABERTA', 'CHEIA'] } },
  })
  if (!table) throw new TRPCError({ code: 'NOT_FOUND' })

  const transaction = await createTransaction({
    organization_id: params.organization_id,
    tipo: 'CREDITO',
    categoria: 'RAKE',
    valor: params.valor,
    funcionario_id: params.funcionario_id,
    referencia_tipo: 'MESA_CASH',
    referencia_id: params.table_id,
    caixa_id: table.caixa_id ?? undefined,
    descricao: `Rake: ${table.nome}`,
    dia_operacional: new Date(),
  })

  const rakeEntry = await prisma.cashRakeEntry.create({
    data: {
      cash_table_id: params.table_id,
      valor: new Prisma.Decimal(params.valor),
      registrado_por_id: params.funcionario_id,
      transaction_id: transaction.id,
    },
  })

  eventBus.emit(Events.CASH_RAKE_REGISTERED, { table_id: params.table_id, valor: params.valor })
  return { rakeEntry, transaction }
}

export async function registerTip(params: {
  organization_id: string
  session_id: string
  funcionario_id: string
  valor: number
}) {
  const session = await prisma.cashSession.findFirst({
    where: { id: params.session_id },
    include: { cash_table: true },
  })
  if (!session) throw new TRPCError({ code: 'NOT_FOUND' })

  const transaction = await createTransaction({
    organization_id: params.organization_id,
    tipo: 'CREDITO',
    categoria: 'DEALER_TIP',
    valor: params.valor,
    jogador_id: session.jogador_id,
    funcionario_id: params.funcionario_id,
    referencia_tipo: 'MESA_CASH',
    referencia_id: session.cash_table_id,
    caixa_id: session.cash_table.caixa_id ?? undefined,
    descricao: `Caixinha dealer: ${session.cash_table.nome}`,
    dia_operacional: new Date(),
  })

  await prisma.cashSession.update({
    where: { id: params.session_id },
    data: { dealer_tip: { increment: new Prisma.Decimal(params.valor) } },
  })

  return { transaction }
}

export async function closeTable(organizationId: string, tableId: string, funcionarioId: string) {
  const activeSessions = await prisma.cashSession.count({
    where: { cash_table_id: tableId, status: 'ATIVA' },
  })

  if (activeSessions > 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Ainda há ${activeSessions} jogador(es) na mesa` })
  }

  const table = await prisma.cashTable.findFirst({
    where: { id: tableId, organization_id: organizationId },
  })
  if (!table) throw new TRPCError({ code: 'NOT_FOUND' })

  if (table.caixa_id) {
    await prisma.cashRegister.update({
      where: { id: table.caixa_id },
      data: { status: 'FECHADO', fechado_em: new Date(), fechado_por_id: funcionarioId },
    })
  }

  return prisma.cashTable.update({
    where: { id: tableId },
    data: { status: 'FECHADA', caixa_id: null },
  })
}

export async function joinWaitlist(tableId: string, jogadorId: string) {
  const maxPos = await prisma.cashTableWaitlist.aggregate({
    where: { cash_table_id: tableId },
    _max: { posicao: true },
  })

  return prisma.cashTableWaitlist.create({
    data: {
      cash_table_id: tableId,
      jogador_id: jogadorId,
      posicao: (maxPos._max.posicao || 0) + 1,
    },
  })
}

export async function leaveWaitlist(tableId: string, jogadorId: string) {
  return prisma.cashTableWaitlist.delete({
    where: { cash_table_id_jogador_id: { cash_table_id: tableId, jogador_id: jogadorId } },
  })
}

export async function reserveSeat(
  tableId: string,
  jogadorId: string,
  assento: number,
  duracaoMinutos: number
) {
  return prisma.cashTableReservation.create({
    data: {
      cash_table_id: tableId,
      jogador_id: jogadorId,
      assento_numero: assento,
      expira_em: new Date(Date.now() + duracaoMinutos * 60 * 1000),
    },
  })
}

export async function cancelReservation(reservationId: string) {
  return prisma.cashTableReservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELADA' },
  })
}

export async function getWaitlistForDisplay(organizationId: string) {
  return prisma.cashTable.findMany({
    where: { organization_id: organizationId, status: { in: ['ABERTA', 'CHEIA'] } },
    select: {
      id: true, nome: true, modalidade: true, stakes: true, status: true, max_jogadores: true,
      _count: { select: { sessions: { where: { status: 'ATIVA' } } } },
      waitlist: {
        orderBy: { posicao: 'asc' },
        include: { },
      },
    },
  })
}
