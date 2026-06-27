import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { createTransaction, createRefund } from '../ledger/ledger.service'
import { debitFromWallet, creditToWallet, refreshWalletCache } from '../wallet/wallet.service'
import { addItem } from '../account/account.service'
import { eventBus, Events } from '@/server/events/event-bus'
import type { CreateTournamentInput } from '@/lib/validators/tournament'
import type { FormaPagamento } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

export async function createTournament(
  organizationId: string,
  input: CreateTournamentInput
) {
  return prisma.tournament.create({
    data: {
      organization_id: organizationId,
      nome: input.nome,
      template_id: input.template_id,
      buyin_valor: new Prisma.Decimal(input.buyin_valor),
      rake_valor: new Prisma.Decimal(input.rake_valor),
      chip_dealer_valor: new Prisma.Decimal(input.chip_dealer_valor),
      starting_stack: input.starting_stack,
      garantido_ativo: input.garantido_ativo,
      garantido_valor: input.garantido_valor ? new Prisma.Decimal(input.garantido_valor) : null,
      late_registration_ativo: input.late_registration_ativo,
      late_registration_ate_nivel: input.late_registration_ate_nivel,
      rebuy_ativo: input.rebuy_ativo,
      rebuy_condicao: input.rebuy_condicao,
      rebuy_condicao_valor: input.rebuy_condicao_valor,
      rebuy_maximo: input.rebuy_maximo,
      rebuy_valor: input.rebuy_valor ? new Prisma.Decimal(input.rebuy_valor) : null,
      rebuy_fichas: input.rebuy_fichas,
      reentrada_ativa: input.reentrada_ativa,
      reentrada_maxima: input.reentrada_maxima,
      reentrada_valor: input.reentrada_valor ? new Prisma.Decimal(input.reentrada_valor) : null,
      reentrada_fichas: input.reentrada_fichas,
      addon_ativo: input.addon_ativo,
      addon_valor: input.addon_valor ? new Prisma.Decimal(input.addon_valor) : null,
      addon_fichas: input.addon_fichas,
      multiday: input.multiday,
      ranking_ids: input.ranking_ids,
      ranking_peso: input.ranking_peso,
      blind_structure_id: input.blind_structure_id,
      data_inicio: input.data_inicio,
    },
  })
}

export async function getTournament(organizationId: string, id: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      blind_structure: { include: { levels: { orderBy: { ordem: 'asc' } } } },
      entries: {
        include: {
          jogador: { select: { id: true, nome: true, nickname: true, foto_url: true } },
          rebuys: true,
          addons: true,
          reentradas: true,
        },
        orderBy: { created_at: 'asc' },
      },
      prizes: { orderBy: { posicao: 'asc' } },
      deals: true,
      days: { orderBy: { dia_label: 'asc' } },
    },
  })

  if (!tournament) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Torneio não encontrado' })
  }

  return tournament
}

export async function listTournaments(
  organizationId: string,
  params: { status?: string; from?: Date; to?: Date; page: number; limit: number }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.status) where.status = params.status
  if (params.from || params.to) {
    where.data_inicio = {}
    if (params.from) (where.data_inicio as Record<string, unknown>).gte = params.from
    if (params.to) (where.data_inicio as Record<string, unknown>).lte = params.to
  }

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      where,
      select: {
        id: true, nome: true, status: true, buyin_valor: true, rake_valor: true,
        prize_pool: true, total_inscritos: true, garantido_ativo: true,
        garantido_valor: true, data_inicio: true, created_at: true,
        nivel_atual: true, multiday: true,
      },
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.tournament.count({ where }),
  ])

  return { tournaments, total }
}

export async function openRegistration(organizationId: string, id: string, funcionarioId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id, organization_id: organizationId, status: 'RASCUNHO' },
  })

  if (!tournament) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Torneio não está em rascunho' })
  }

  const cashRegister = await prisma.cashRegister.create({
    data: {
      organization_id: organizationId,
      tipo: 'TORNEIO',
      referencia_id: id,
      aberto_por_id: funcionarioId,
      dia_operacional: new Date(),
    },
  })

  const updated = await prisma.tournament.update({
    where: { id },
    data: { status: 'INSCRICOES_ABERTAS', caixa_id: cashRegister.id },
  })

  return { tournament: updated, cashRegister }
}

export async function startTournament(organizationId: string, id: string) {
  return prisma.tournament.update({
    where: { id },
    data: { status: 'EM_ANDAMENTO', data_inicio: new Date() },
  })
}

export async function pauseTournament(organizationId: string, id: string) {
  return prisma.tournament.update({ where: { id }, data: { status: 'PAUSADO' } })
}

export async function resumeTournament(organizationId: string, id: string) {
  return prisma.tournament.update({ where: { id }, data: { status: 'EM_ANDAMENTO' } })
}

export async function registerEntry(params: {
  organization_id: string
  tournament_id: string
  jogador_id: string
  funcionario_id: string
  forma_pagamento: FormaPagamento
}) {
  const tournament = await prisma.tournament.findFirst({
    where: {
      id: params.tournament_id,
      organization_id: params.organization_id,
      status: { in: ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO'] },
    },
  })

  if (!tournament) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Torneio não está aberto para inscrições' })
  }

  if (tournament.status === 'EM_ANDAMENTO') {
    if (!tournament.late_registration_ativo) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Late registration não está ativo' })
    }
    if (tournament.late_registration_ate_nivel && tournament.nivel_atual > tournament.late_registration_ate_nivel) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Período de late registration encerrado' })
    }
  }

  const existingEntry = await prisma.tournamentEntry.findFirst({
    where: {
      tournament_id: params.tournament_id,
      jogador_id: params.jogador_id,
      eliminado: false,
    },
  })

  if (existingEntry) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Jogador já inscrito neste torneio' })
  }

  const buyinTotal = Number(tournament.buyin_valor)
  const rakeTotal = Number(tournament.rake_valor)
  const chipDealerTotal = Number(tournament.chip_dealer_valor)

  return prisma.$transaction(async (tx) => {
    const entry = await tx.tournamentEntry.create({
      data: {
        tournament_id: params.tournament_id,
        jogador_id: params.jogador_id,
        tipo: 'INSCRICAO',
        stack_atual: tournament.starting_stack,
      },
    })

    const buyinTx = await createTransaction({
      organization_id: params.organization_id,
      tipo: 'DEBITO',
      categoria: 'BUYIN',
      valor: buyinTotal,
      jogador_id: params.jogador_id,
      funcionario_id: params.funcionario_id,
      referencia_tipo: 'TORNEIO',
      referencia_id: params.tournament_id,
      caixa_id: tournament.caixa_id ?? undefined,
      forma_pagamento: params.forma_pagamento === 'CARTEIRA' ? 'CARTEIRA' : params.forma_pagamento,
      descricao: `Buy-in: ${tournament.nome}`,
      dia_operacional: new Date(),
    }, tx)

    if (rakeTotal > 0) {
      await createTransaction({
        organization_id: params.organization_id,
        tipo: 'CREDITO',
        categoria: 'RAKE',
        valor: rakeTotal,
        funcionario_id: params.funcionario_id,
        referencia_tipo: 'TORNEIO',
        referencia_id: params.tournament_id,
        caixa_id: tournament.caixa_id ?? undefined,
        descricao: `Rake: ${tournament.nome}`,
        dia_operacional: new Date(),
      }, tx)
    }

    if (chipDealerTotal > 0) {
      await createTransaction({
        organization_id: params.organization_id,
        tipo: 'CREDITO',
        categoria: 'CHIP_DEALER',
        valor: chipDealerTotal,
        funcionario_id: params.funcionario_id,
        referencia_tipo: 'TORNEIO',
        referencia_id: params.tournament_id,
        caixa_id: tournament.caixa_id ?? undefined,
        descricao: `Chip dealer: ${tournament.nome}`,
        dia_operacional: new Date(),
      }, tx)
    }

    if (params.forma_pagamento === 'CARTEIRA') {
      await debitFromWallet({
        organization_id: params.organization_id,
        jogador_id: params.jogador_id,
        funcionario_id: params.funcionario_id,
        valor: buyinTotal + rakeTotal + chipDealerTotal,
        categoria: 'BUYIN',
        referencia_tipo: 'TORNEIO',
        referencia_id: params.tournament_id,
        caixa_id: tournament.caixa_id ?? undefined,
        descricao: `Buy-in: ${tournament.nome}`,
        tx,
      })
    } else {
      await addItem({
        organization_id: params.organization_id,
        jogador_id: params.jogador_id,
        tipo: 'BUYIN',
        descricao: `Buy-in: ${tournament.nome}`,
        valor: buyinTotal + rakeTotal + chipDealerTotal,
        transaction_id: buyinTx.id,
        tx,
      })
    }

    const prizePoolIncrement = buyinTotal
    await tx.tournament.update({
      where: { id: params.tournament_id },
      data: {
        total_inscritos: { increment: 1 },
        prize_pool: { increment: new Prisma.Decimal(prizePoolIncrement) },
      },
    })

    await tx.tournamentEntry.update({
      where: { id: entry.id },
      data: { buyin_transaction_id: buyinTx.id },
    })

    return { entry, transaction: buyinTx }
  }).then((result) => {
    eventBus.emit(Events.TOURNAMENT_ENTRY_REGISTERED, {
      entry: result.entry,
      tournament_id: params.tournament_id,
      jogador_id: params.jogador_id,
    })
    return result
  })
}

export async function registerOnlineEntry(params: {
  organization_id: string
  tournament_id: string
  jogador_id: string
  forma_pagamento: 'CARTEIRA' | 'PIX'
}) {
  if (params.forma_pagamento === 'PIX') {
    const tournament = await prisma.tournament.findFirst({
      where: { id: params.tournament_id, organization_id: params.organization_id },
    })
    if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' })

    const entry = await prisma.tournamentEntry.create({
      data: {
        tournament_id: params.tournament_id,
        jogador_id: params.jogador_id,
        tipo: 'INSCRICAO',
        payment_status: 'PENDENTE_PIX',
        stack_atual: tournament.starting_stack,
      },
    })

    return {
      entry,
      pendente_pix: true,
      valor: Number(tournament.buyin_valor) + Number(tournament.rake_valor) + Number(tournament.chip_dealer_valor),
    }
  }

  return registerEntry({
    ...params,
    funcionario_id: params.jogador_id,
    forma_pagamento: 'CARTEIRA',
  })
}

export async function confirmOnlinePayment(
  organizationId: string,
  entryId: string,
  funcionarioId: string
) {
  const entry = await prisma.tournamentEntry.findFirst({
    where: { id: entryId, payment_status: 'PENDENTE_PIX' },
    include: { tournament: true },
  })

  if (!entry) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Inscrição pendente não encontrada' })
  }

  return prisma.$transaction(async (tx) => {
    const tournament = entry.tournament
    const buyinTotal = Number(tournament.buyin_valor)
    const rakeTotal = Number(tournament.rake_valor)
    const chipDealerTotal = Number(tournament.chip_dealer_valor)

    const buyinTx = await createTransaction({
      organization_id: organizationId,
      tipo: 'DEBITO',
      categoria: 'BUYIN',
      valor: buyinTotal + rakeTotal + chipDealerTotal,
      jogador_id: entry.jogador_id,
      funcionario_id: funcionarioId,
      referencia_tipo: 'TORNEIO',
      referencia_id: tournament.id,
      caixa_id: tournament.caixa_id ?? undefined,
      forma_pagamento: 'PIX',
      descricao: `Buy-in online (PIX): ${tournament.nome}`,
      dia_operacional: new Date(),
    }, tx)

    if (rakeTotal > 0) {
      await createTransaction({
        organization_id: organizationId,
        tipo: 'CREDITO',
        categoria: 'RAKE',
        valor: rakeTotal,
        funcionario_id: funcionarioId,
        referencia_tipo: 'TORNEIO',
        referencia_id: tournament.id,
        caixa_id: tournament.caixa_id ?? undefined,
        dia_operacional: new Date(),
      }, tx)
    }

    if (chipDealerTotal > 0) {
      await createTransaction({
        organization_id: organizationId,
        tipo: 'CREDITO',
        categoria: 'CHIP_DEALER',
        valor: chipDealerTotal,
        funcionario_id: funcionarioId,
        referencia_tipo: 'TORNEIO',
        referencia_id: tournament.id,
        caixa_id: tournament.caixa_id ?? undefined,
        dia_operacional: new Date(),
      }, tx)
    }

    await tx.tournamentEntry.update({
      where: { id: entryId },
      data: { payment_status: 'CONFIRMADO', buyin_transaction_id: buyinTx.id },
    })

    await tx.tournament.update({
      where: { id: tournament.id },
      data: {
        total_inscritos: { increment: 1 },
        prize_pool: { increment: new Prisma.Decimal(buyinTotal) },
      },
    })

    return { entry_id: entryId, transaction: buyinTx }
  })
}

export async function registerRebuy(
  organizationId: string,
  entryId: string,
  funcionarioId: string,
  formaPagamento: FormaPagamento
) {
  const entry = await prisma.tournamentEntry.findFirst({
    where: { id: entryId },
    include: { tournament: true },
  })

  if (!entry) throw new TRPCError({ code: 'NOT_FOUND' })

  const t = entry.tournament
  if (!t.rebuy_ativo) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Rebuy não está ativo' })
  if (t.rebuy_maximo && entry.rebuys_realizados >= t.rebuy_maximo) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Limite de rebuys atingido' })
  }

  const rebuyValor = Number(t.rebuy_valor || t.buyin_valor)

  return prisma.$transaction(async (tx) => {
    const transaction = await createTransaction({
      organization_id: organizationId,
      tipo: 'DEBITO',
      categoria: 'REBUY',
      valor: rebuyValor,
      jogador_id: entry.jogador_id,
      funcionario_id: funcionarioId,
      referencia_tipo: 'TORNEIO',
      referencia_id: t.id,
      caixa_id: t.caixa_id,
      forma_pagamento: formaPagamento,
      descricao: `Rebuy: ${t.nome}`,
      dia_operacional: new Date(),
    }, tx)

    const rebuy = await tx.tournamentRebuy.create({
      data: {
        entry_id: entryId,
        transaction_id: transaction.id,
        fichas_recebidas: t.rebuy_fichas || t.starting_stack,
      },
    })

    await tx.tournamentEntry.update({
      where: { id: entryId },
      data: { rebuys_realizados: { increment: 1 } },
    })

    await tx.tournament.update({
      where: { id: t.id },
      data: {
        total_rebuys: { increment: 1 },
        prize_pool: { increment: new Prisma.Decimal(rebuyValor) },
      },
    })

    if (formaPagamento !== 'CARTEIRA') {
      await addItem({
        organization_id: organizationId,
        jogador_id: entry.jogador_id,
        tipo: 'REBUY',
        descricao: `Rebuy: ${t.nome}`,
        valor: rebuyValor,
        transaction_id: transaction.id,
        tx,
      })
    }

    return { rebuy, transaction }
  }).then((result) => {
    eventBus.emit(Events.TOURNAMENT_REBUY, { entry_id: entryId, tournament_id: t.id })
    return result
  })
}

export async function registerReentry(
  organizationId: string,
  entryId: string,
  funcionarioId: string,
  formaPagamento: FormaPagamento
) {
  const entry = await prisma.tournamentEntry.findFirst({
    where: { id: entryId, eliminado: true },
    include: { tournament: true },
  })

  if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'Jogador não encontrado ou não eliminado' })

  const t = entry.tournament
  if (!t.reentrada_ativa) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Reentrada não ativa' })
  if (t.reentrada_maxima && entry.reentradas_realizadas >= t.reentrada_maxima) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Limite de reentradas atingido' })
  }

  const reentradaValor = Number(t.reentrada_valor || t.buyin_valor)

  return prisma.$transaction(async (tx) => {
    const transaction = await createTransaction({
      organization_id: organizationId,
      tipo: 'DEBITO',
      categoria: 'REENTRADA',
      valor: reentradaValor,
      jogador_id: entry.jogador_id,
      funcionario_id: funcionarioId,
      referencia_tipo: 'TORNEIO',
      referencia_id: t.id,
      caixa_id: t.caixa_id,
      forma_pagamento: formaPagamento,
      descricao: `Reentrada: ${t.nome}`,
      dia_operacional: new Date(),
    }, tx)

    const reentry = await tx.tournamentReentry.create({
      data: {
        entry_id: entryId,
        transaction_id: transaction.id,
        fichas_recebidas: t.reentrada_fichas || t.starting_stack,
      },
    })

    await tx.tournamentEntry.update({
      where: { id: entryId },
      data: {
        eliminado: false,
        eliminado_em: null,
        posicao_final: null,
        reentradas_realizadas: { increment: 1 },
        stack_atual: t.reentrada_fichas || t.starting_stack,
      },
    })

    await tx.tournament.update({
      where: { id: t.id },
      data: {
        total_reentradas: { increment: 1 },
        prize_pool: { increment: new Prisma.Decimal(reentradaValor) },
      },
    })

    if (formaPagamento !== 'CARTEIRA') {
      await addItem({
        organization_id: organizationId,
        jogador_id: entry.jogador_id,
        tipo: 'REENTRADA',
        descricao: `Reentrada: ${t.nome}`,
        valor: reentradaValor,
        transaction_id: transaction.id,
        tx,
      })
    }

    return { reentry, transaction }
  }).then((result) => {
    eventBus.emit(Events.TOURNAMENT_REENTRY, { entry_id: entryId, tournament_id: t.id })
    return result
  })
}

export async function registerAddon(
  organizationId: string,
  entryId: string,
  funcionarioId: string,
  formaPagamento: FormaPagamento
) {
  const entry = await prisma.tournamentEntry.findFirst({
    where: { id: entryId, eliminado: false },
    include: { tournament: true },
  })

  if (!entry) throw new TRPCError({ code: 'NOT_FOUND' })

  const t = entry.tournament
  if (!t.addon_ativo) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add-on não ativo' })
  if (entry.addon_realizado) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Add-on já realizado' })

  const addonValor = Number(t.addon_valor!)

  return prisma.$transaction(async (tx) => {
    const transaction = await createTransaction({
      organization_id: organizationId,
      tipo: 'DEBITO',
      categoria: 'ADDON',
      valor: addonValor,
      jogador_id: entry.jogador_id,
      funcionario_id: funcionarioId,
      referencia_tipo: 'TORNEIO',
      referencia_id: t.id,
      caixa_id: t.caixa_id,
      forma_pagamento: formaPagamento,
      descricao: `Add-on: ${t.nome}`,
      dia_operacional: new Date(),
    }, tx)

    const addon = await tx.tournamentAddon.create({
      data: {
        entry_id: entryId,
        transaction_id: transaction.id,
        fichas_recebidas: t.addon_fichas!,
      },
    })

    await tx.tournamentEntry.update({
      where: { id: entryId },
      data: { addon_realizado: true },
    })

    await tx.tournament.update({
      where: { id: t.id },
      data: {
        total_addons: { increment: 1 },
        prize_pool: { increment: new Prisma.Decimal(addonValor) },
      },
    })

    if (formaPagamento !== 'CARTEIRA') {
      await addItem({
        organization_id: organizationId,
        jogador_id: entry.jogador_id,
        tipo: 'ADDON',
        descricao: `Add-on: ${t.nome}`,
        valor: addonValor,
        transaction_id: transaction.id,
        tx,
      })
    }

    return { addon, transaction }
  }).then((result) => {
    eventBus.emit(Events.TOURNAMENT_ADDON, { entry_id: entryId, tournament_id: t.id })
    return result
  })
}

export async function eliminatePlayer(
  organizationId: string,
  entryId: string
) {
  const entry = await prisma.tournamentEntry.findFirst({
    where: { id: entryId, eliminado: false },
    include: { tournament: true },
  })

  if (!entry) throw new TRPCError({ code: 'NOT_FOUND' })

  const activeEntries = await prisma.tournamentEntry.count({
    where: { tournament_id: entry.tournament_id, eliminado: false },
  })

  const posicao = activeEntries

  const updated = await prisma.tournamentEntry.update({
    where: { id: entryId },
    data: {
      eliminado: true,
      eliminado_em: new Date(),
      posicao_final: posicao,
      stack_atual: 0,
    },
  })

  eventBus.emit(Events.TOURNAMENT_PLAYER_ELIMINATED, {
    entry_id: entryId,
    jogador_id: entry.jogador_id,
    tournament_id: entry.tournament_id,
    posicao,
  })

  const activeCashSessions = await prisma.cashSession.count({
    where: { jogador_id: entry.jogador_id, status: 'ATIVA' },
  })

  if (activeCashSessions === 0) {
    eventBus.emit(Events.ACCOUNT_SUGGESTION_CLOSE, {
      jogador_id: entry.jogador_id,
      organization_id: organizationId,
    })
  }

  return updated
}

export async function suggestPrizes(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })

  if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' })

  const prizePool = Number(tournament.prize_pool)
  const totalPlayers = tournament.total_inscritos
  const premiados = Math.max(1, Math.ceil(totalPlayers * 0.15))

  const percentuais = generatePrizePercentages(premiados)

  return percentuais.map((pct, i) => ({
    posicao: i + 1,
    percentual: pct,
    valor: Math.round(prizePool * pct) / 100,
  }))
}

function generatePrizePercentages(count: number): number[] {
  if (count === 1) return [100]
  if (count === 2) return [65, 35]
  if (count === 3) return [50, 30, 20]

  const base = [40, 25, 15]
  const remaining = 20
  const restCount = count - 3
  const each = remaining / restCount

  return [...base, ...Array(restCount).fill(Math.round(each * 100) / 100)]
}

export async function confirmPrizes(
  organizationId: string,
  tournamentId: string,
  prizes: Array<{ posicao: number; valor: number; percentual?: number }>
) {
  await prisma.tournamentPrize.deleteMany({ where: { tournament_id: tournamentId } })

  return prisma.tournamentPrize.createMany({
    data: prizes.map((p) => ({
      tournament_id: tournamentId,
      posicao: p.posicao,
      percentual: p.percentual ? new Prisma.Decimal(p.percentual) : null,
      valor_fixo: null,
      valor_final: new Prisma.Decimal(p.valor),
    })),
  })
}

export async function payPrize(
  organizationId: string,
  prizeId: string,
  jogadorId: string,
  funcionarioId: string,
  formaPagamento: FormaPagamento
) {
  const prize = await prisma.tournamentPrize.findUnique({
    where: { id: prizeId },
    include: { tournament: true },
  })

  if (!prize) throw new TRPCError({ code: 'NOT_FOUND' })
  if (prize.transaction_id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Prêmio já pago' })

  const valor = Number(prize.deal_valor || prize.valor_final)

  const transaction = await creditToWallet({
    organization_id: organizationId,
    jogador_id: jogadorId,
    funcionario_id: funcionarioId,
    valor,
    saldo_tipo: 'PREMIACOES',
    categoria: 'PREMIO',
    referencia_tipo: 'TORNEIO',
    referencia_id: prize.tournament_id,
    descricao: `Prêmio ${prize.posicao}º lugar: ${prize.tournament.nome}`,
  })

  await prisma.tournamentPrize.update({
    where: { id: prizeId },
    data: { jogador_id: jogadorId, transaction_id: transaction.id },
  })

  eventBus.emit(Events.TOURNAMENT_PRIZE_PAID, {
    prize_id: prizeId,
    jogador_id: jogadorId,
    tournament_id: prize.tournament_id,
    valor,
    posicao: prize.posicao,
  })

  return { prize, transaction }
}

export async function registerDeal(
  organizationId: string,
  tournamentId: string,
  deal: Record<string, number>,
  funcionarioId: string
) {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organization_id: organizationId },
  })

  if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' })

  const totalDeal = Object.values(deal).reduce((sum, v) => sum + v, 0)
  const remainingPrizePool = Number(tournament.prize_pool)

  if (Math.abs(totalDeal - remainingPrizePool) > 1) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Soma do deal (R$ ${totalDeal.toFixed(2)}) difere do prize pool restante (R$ ${remainingPrizePool.toFixed(2)})`,
    })
  }

  const tournamentDeal = await prisma.tournamentDeal.create({
    data: {
      tournament_id: tournamentId,
      jogadores_ids: Object.keys(deal),
      valores_acordados: deal,
      registrado_por_id: funcionarioId,
    },
  })

  const entries = await prisma.tournamentEntry.findMany({
    where: {
      tournament_id: tournamentId,
      jogador_id: { in: Object.keys(deal) },
      eliminado: false,
    },
  })

  for (const entry of entries) {
    const dealValor = deal[entry.jogador_id]
    const activeCount = await prisma.tournamentEntry.count({
      where: { tournament_id: tournamentId, eliminado: false },
    })

    await prisma.tournamentEntry.update({
      where: { id: entry.id },
      data: { eliminado: true, eliminado_em: new Date(), posicao_final: activeCount },
    })

    await prisma.tournamentPrize.create({
      data: {
        tournament_id: tournamentId,
        posicao: activeCount,
        valor_final: new Prisma.Decimal(dealValor),
        jogador_id: entry.jogador_id,
        is_deal: true,
        deal_valor: new Prisma.Decimal(dealValor),
      },
    })
  }

  eventBus.emit(Events.TOURNAMENT_DEAL, { tournament_id: tournamentId, deal })

  return tournamentDeal
}

export async function cancelTournament(
  organizationId: string,
  tournamentId: string,
  funcionarioId: string
) {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organization_id: organizationId },
    include: {
      entries: {
        include: { rebuys: true, addons: true, reentradas: true },
      },
    },
  })

  if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' })
  if (tournament.status === 'FINALIZADO' || tournament.status === 'CANCELADO') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Torneio já finalizado ou cancelado' })
  }

  return prisma.$transaction(async (tx) => {
    for (const entry of tournament.entries) {
      if (entry.buyin_transaction_id) {
        await createRefund(entry.buyin_transaction_id, 'Cancelamento de torneio', funcionarioId, tx)
      }

      for (const rebuy of entry.rebuys) {
        if (rebuy.transaction_id) {
          await createRefund(rebuy.transaction_id, 'Cancelamento de torneio', funcionarioId, tx)
        }
      }

      for (const addon of entry.addons) {
        if (addon.transaction_id) {
          await createRefund(addon.transaction_id, 'Cancelamento de torneio', funcionarioId, tx)
        }
      }

      for (const reentry of entry.reentradas) {
        if (reentry.transaction_id) {
          await createRefund(reentry.transaction_id, 'Cancelamento de torneio', funcionarioId, tx)
        }
      }

      await refreshWalletCache(organizationId, entry.jogador_id)
    }

    const updated = await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: 'CANCELADO', data_fim: new Date() },
    })

    if (tournament.caixa_id) {
      await tx.cashRegister.update({
        where: { id: tournament.caixa_id },
        data: { status: 'FECHADO', fechado_em: new Date(), fechado_por_id: funcionarioId },
      })
    }

    return updated
  }).then((result) => {
    eventBus.emit(Events.TOURNAMENT_CANCELLED, {
      tournament_id: tournamentId,
      entries_count: tournament.entries.length,
    })
    return result
  })
}

export async function finishTournament(
  organizationId: string,
  tournamentId: string,
  funcionarioId: string
) {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organization_id: organizationId },
  })

  if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' })

  let overlayValor = 0
  if (tournament.garantido_ativo && tournament.garantido_valor) {
    const diff = Number(tournament.garantido_valor) - Number(tournament.prize_pool)
    if (diff > 0) {
      overlayValor = diff

      await createTransaction({
        organization_id: organizationId,
        tipo: 'DEBITO',
        categoria: 'OVERLAY',
        valor: overlayValor,
        funcionario_id: funcionarioId,
        referencia_tipo: 'TORNEIO',
        referencia_id: tournamentId,
        caixa_id: tournament.caixa_id ?? undefined,
        descricao: `Overlay: ${tournament.nome}`,
        dia_operacional: new Date(),
      })
    }
  }

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: 'FINALIZADO',
      data_fim: new Date(),
      overlay_valor: new Prisma.Decimal(overlayValor),
      prize_pool: overlayValor > 0
        ? { increment: new Prisma.Decimal(overlayValor) }
        : undefined,
    },
  })

  if (tournament.caixa_id) {
    await prisma.cashRegister.update({
      where: { id: tournament.caixa_id },
      data: { status: 'FECHADO', fechado_em: new Date(), fechado_por_id: funcionarioId },
    })
  }

  eventBus.emit(Events.TOURNAMENT_FINISHED, { tournament_id: tournamentId })

  return updated
}

export async function updateChipCount(
  tournamentId: string,
  chipcounts: Array<{ entry_id: string; stack: number }>
) {
  for (const cc of chipcounts) {
    await prisma.tournamentEntry.update({
      where: { id: cc.entry_id },
      data: { stack_atual: cc.stack },
    })
  }

  return { updated: chipcounts.length }
}

export async function advanceBlind(organizationId: string, tournamentId: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organization_id: organizationId },
  })

  if (!tournament) throw new TRPCError({ code: 'NOT_FOUND' })

  return prisma.tournament.update({
    where: { id: tournamentId },
    data: { nivel_atual: tournament.nivel_atual + 1 },
  })
}

export async function applyBalance(
  tournamentId: string,
  moves: Array<{ entry_id: string; mesa: number; assento: number }>
) {
  for (const move of moves) {
    await prisma.tournamentEntry.update({
      where: { id: move.entry_id },
      data: { mesa_numero: move.mesa, assento_numero: move.assento },
    })
  }

  return { moved: moves.length }
}

export async function getAvailableTournaments(organizationId: string) {
  return prisma.tournament.findMany({
    where: {
      organization_id: organizationId,
      status: { in: ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO'] },
    },
    select: {
      id: true, nome: true, status: true, buyin_valor: true, rake_valor: true,
      chip_dealer_valor: true, starting_stack: true, prize_pool: true,
      total_inscritos: true, garantido_ativo: true, garantido_valor: true,
      late_registration_ativo: true, data_inicio: true,
    },
    orderBy: { data_inicio: 'asc' },
  })
}
