import { prisma } from '@/lib/prisma'
import { creditToWallet } from '../wallet/wallet.service'
import { eventBus, Events } from '@/server/events/event-bus'

export async function calculateRakeback(
  organizationId: string,
  periodoInicio: Date,
  periodoFim: Date
) {
  const rakeTransactions = await prisma.ledgerTransaction.groupBy({
    by: ['jogador_id'],
    where: {
      organization_id: organizationId,
      categoria: { in: ['BUYIN', 'REBUY', 'REENTRADA'] },
      tipo: 'DEBITO',
      jogador_id: { not: null },
      created_at: { gte: periodoInicio, lte: periodoFim },
    },
    _sum: { valor: true },
  })

  const configs = await prisma.orgConfig.findMany({
    where: {
      organization_id: organizationId,
      chave: { in: ['rakeback_percentual', 'rakeback_progressivo', 'rakeback_tiers'] },
    },
  })

  const percentual = configs.find((c) => c.chave === 'rakeback_percentual')
  const progressivo = configs.find((c) => c.chave === 'rakeback_progressivo')
  const tiers = configs.find((c) => c.chave === 'rakeback_tiers')

  const defaultPercentual = percentual ? Number(percentual.valor) : 10
  const isProgressivo = progressivo ? Boolean(progressivo.valor) : false
  const tiersList = tiers ? (tiers.valor as Array<{ min_rake: number; percentual: number }>) : []

  return rakeTransactions
    .filter((t) => t.jogador_id)
    .map((t) => {
      const rakeTotal = Number(t._sum.valor || 0)
      let pct = defaultPercentual

      if (isProgressivo && tiersList.length > 0) {
        const tier = [...tiersList].reverse().find((tier) => rakeTotal >= tier.min_rake)
        if (tier) pct = tier.percentual
      }

      const rakebackValor = Math.round(rakeTotal * (pct / 100) * 100) / 100

      return {
        jogador_id: t.jogador_id!,
        rake_total: rakeTotal,
        percentual: pct,
        rakeback_valor: rakebackValor,
      }
    })
    .filter((r) => r.rakeback_valor > 0)
}

export async function creditRakeback(
  organizationId: string,
  funcionarioId: string,
  jogadoresRakeback: Array<{ jogador_id: string; valor: number }>
) {
  const results = []

  for (const item of jogadoresRakeback) {
    const transaction = await creditToWallet({
      organization_id: organizationId,
      jogador_id: item.jogador_id,
      funcionario_id: funcionarioId,
      valor: item.valor,
      saldo_tipo: 'RAKEBACK',
      categoria: 'RAKEBACK',
      referencia_tipo: 'MANUAL',
      referencia_id: item.jogador_id,
      descricao: 'Crédito de rakeback',
    })

    results.push({ jogador_id: item.jogador_id, transaction })

    eventBus.emit(Events.RAKEBACK_CREDITED, {
      jogador_id: item.jogador_id,
      valor: item.valor,
      organization_id: organizationId,
    })
  }

  return results
}

export async function getRakebackHistory(
  organizationId: string,
  params: { jogador_id?: string; page: number; limit: number }
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    categoria: 'RAKEBACK',
    tipo: 'CREDITO',
  }
  if (params.jogador_id) where.jogador_id = params.jogador_id

  const [transactions, total] = await Promise.all([
    prisma.ledgerTransaction.findMany({
      where,
      include: { jogador: { select: { id: true, nome: true, nickname: true } } },
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.ledgerTransaction.count({ where }),
  ])

  return { transactions, total }
}
