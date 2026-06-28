import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { creditToWallet } from '../wallet/wallet.service'
import { eventBus, Events } from '@/server/events/event-bus'
import { Prisma } from '@/generated/prisma/client'

type CreateRankingInput = {
  nome: string
  tipo: 'SEMESTRAL' | 'ANUAL'
  periodo_inicio: Date
  periodo_fim: Date
  pontuacao: Array<{ posicao: number; pontos: number }>
  desempate: string[]
  premios?: Array<{ posicao: number; valor: number }>
}

export async function createRanking(organizationId: string, input: CreateRankingInput) {
  return prisma.$transaction(async (tx) => {
    const ranking = await tx.ranking.create({
      data: {
        organization_id: organizationId,
        nome: input.nome,
        tipo: input.tipo,
        periodo_inicio: input.periodo_inicio,
        periodo_fim: input.periodo_fim,
        desempate_criterios: input.desempate,
        premios: input.premios ? JSON.parse(JSON.stringify(input.premios)) : undefined,
      },
    })

    await tx.rankingPointStructure.createMany({
      data: input.pontuacao.map((p) => ({
        ranking_id: ranking.id,
        posicao: p.posicao,
        pontos: p.pontos,
      })),
    })

    return ranking
  })
}

export async function listRankings(organizationId: string, params: { status?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.status) where.status = params.status

  const [rankings, total] = await Promise.all([
    prisma.ranking.findMany({
      where,
      include: { _count: { select: { entries: true, standings: true } } },
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.ranking.count({ where }),
  ])

  return { rankings, total }
}

export async function getRanking(organizationId: string, id: string) {
  const ranking = await prisma.ranking.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      point_structure: { orderBy: { posicao: 'asc' } },
      standings: {
        orderBy: { posicao: 'asc' },
        include: { jogador: { select: { id: true, nome: true, nickname: true, foto_url: true } } },
      },
    },
  })

  if (!ranking) throw new TRPCError({ code: 'NOT_FOUND' })
  return ranking
}

export async function registerPoints(
  rankingId: string,
  tournamentId: string,
  pesoTorneio: number,
  results: Array<{ jogador_id: string; posicao: number }>
) {
  const pointStructure = await prisma.rankingPointStructure.findMany({
    where: { ranking_id: rankingId },
    orderBy: { posicao: 'asc' },
  })

  const entries = results
    .map((r) => {
      const ps = pointStructure.find((p) => p.posicao === r.posicao)
      if (!ps) return null
      return {
        ranking_id: rankingId,
        jogador_id: r.jogador_id,
        tournament_id: tournamentId,
        posicao_no_torneio: r.posicao,
        peso_torneio: pesoTorneio,
        pontos_base: ps.pontos,
        pontos_final: ps.pontos * pesoTorneio,
      }
    })
    .filter(Boolean) as Array<{
      ranking_id: string; jogador_id: string; tournament_id: string;
      posicao_no_torneio: number; peso_torneio: number; pontos_base: number; pontos_final: number
    }>

  if (entries.length > 0) {
    await prisma.rankingEntry.createMany({ data: entries })
  }

  await recalculateStandings(rankingId)
  eventBus.emit(Events.RANKING_RECALCULATED, { ranking_id: rankingId })
}

export async function removePointsByTournament(rankingId: string, tournamentId: string) {
  await prisma.rankingEntry.deleteMany({
    where: { ranking_id: rankingId, tournament_id: tournamentId },
  })
  await recalculateStandings(rankingId)
}

export async function recalculateStandings(rankingId: string) {
  const entries = await prisma.rankingEntry.findMany({
    where: { ranking_id: rankingId },
  })

  const playerStats: Record<string, { pontos: number; torneios: number; itm: number; vitorias: number }> = {}

  for (const entry of entries) {
    if (!playerStats[entry.jogador_id]) {
      playerStats[entry.jogador_id] = { pontos: 0, torneios: 0, itm: 0, vitorias: 0 }
    }
    playerStats[entry.jogador_id].pontos += entry.pontos_final
    playerStats[entry.jogador_id].torneios += 1
    if (entry.posicao_no_torneio <= 9) playerStats[entry.jogador_id].itm += 1
    if (entry.posicao_no_torneio === 1) playerStats[entry.jogador_id].vitorias += 1
  }

  const sorted = Object.entries(playerStats)
    .sort(([, a], [, b]) => b.pontos - a.pontos || b.torneios - a.torneios)

  await prisma.rankingStanding.deleteMany({ where: { ranking_id: rankingId } })

  if (sorted.length > 0) {
    await prisma.rankingStanding.createMany({
      data: sorted.map(([jogadorId, stats], index) => ({
        ranking_id: rankingId,
        jogador_id: jogadorId,
        pontos_total: stats.pontos,
        posicao: index + 1,
        torneios_jogados: stats.torneios,
        itm_count: stats.itm,
        vitorias: stats.vitorias,
      })),
    })
  }
}

export async function finishRanking(
  organizationId: string,
  rankingId: string,
  funcionarioId: string
) {
  const ranking = await prisma.ranking.findFirst({
    where: { id: rankingId, organization_id: organizationId },
    include: { standings: { orderBy: { posicao: 'asc' } } },
  })

  if (!ranking) throw new TRPCError({ code: 'NOT_FOUND' })

  const premios = ranking.premios as Array<{ posicao: number; valor: number }> | null

  if (premios) {
    for (const premio of premios) {
      const standing = ranking.standings.find((s) => s.posicao === premio.posicao)
      if (standing) {
        await creditToWallet({
          organization_id: organizationId,
          jogador_id: standing.jogador_id,
          funcionario_id: funcionarioId,
          valor: premio.valor,
          saldo_tipo: 'PREMIACOES',
          categoria: 'PREMIO',
          referencia_tipo: 'RANKING',
          referencia_id: rankingId,
          descricao: `Prêmio ranking ${ranking.nome} - ${premio.posicao}º lugar`,
        })
      }
    }
  }

  return prisma.ranking.update({
    where: { id: rankingId },
    data: { status: 'FINALIZADO' },
  })
}
