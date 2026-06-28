import { prisma } from '@/lib/prisma'
import { getDailySummary } from '../ledger/ledger.service'

export async function financialDaily(organizationId: string, diaOperacional: Date) {
  return getDailySummary(organizationId, diaOperacional)
}

export async function financialPeriod(organizationId: string, from: Date, to: Date) {
  const [receitas, despesas] = await Promise.all([
    prisma.ledgerTransaction.groupBy({
      by: ['categoria'],
      where: { organization_id: organizationId, tipo: 'CREDITO', created_at: { gte: from, lte: to } },
      _sum: { valor: true },
    }),
    prisma.ledgerTransaction.groupBy({
      by: ['categoria'],
      where: { organization_id: organizationId, tipo: 'DEBITO', created_at: { gte: from, lte: to } },
      _sum: { valor: true },
    }),
  ])

  const totalReceitas = receitas.reduce((s, r) => s + Number(r._sum.valor || 0), 0)
  const totalDespesas = despesas.reduce((s, d) => s + Number(d._sum.valor || 0), 0)

  return {
    receitas: receitas.map((r) => ({ categoria: r.categoria, valor: Number(r._sum.valor || 0) })),
    despesas: despesas.map((d) => ({ categoria: d.categoria, valor: Number(d._sum.valor || 0) })),
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    resultado: totalReceitas - totalDespesas,
    periodo: { from, to },
  }
}

export async function overdueReport(organizationId: string, diasMinimo: number = 1) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - diasMinimo)

  const accounts = await prisma.account.findMany({
    where: {
      organization_id: organizationId,
      status: 'ABERTA',
      aberta_em: { lte: cutoff },
    },
    include: {
      jogador: { select: { id: true, nome: true, nickname: true, cpf: true, telefone: true } },
    },
    orderBy: { aberta_em: 'asc' },
  })

  const totalDevendo = accounts.reduce(
    (sum, a) => sum + Number(a.total) - Number(a.total_pago), 0
  )

  return {
    jogadores_inadimplentes: accounts.map((a) => ({
      jogador: a.jogador,
      valor_devendo: Number(a.total) - Number(a.total_pago),
      dias_aberto: Math.floor((Date.now() - a.aberta_em.getTime()) / 86400000),
      aberta_em: a.aberta_em,
    })),
    total_devendo: totalDevendo,
    total_inadimplentes: accounts.length,
  }
}

export async function topRevenuePlayers(organizationId: string, from: Date, to: Date, limit: number = 10) {
  const rakeByPlayer = await prisma.ledgerTransaction.groupBy({
    by: ['jogador_id'],
    where: {
      organization_id: organizationId,
      jogador_id: { not: null },
      tipo: 'DEBITO',
      created_at: { gte: from, lte: to },
    },
    _sum: { valor: true },
    orderBy: { _sum: { valor: 'desc' } },
    take: limit,
  })

  const playerIds = rakeByPlayer.filter((r) => r.jogador_id).map((r) => r.jogador_id!)
  const players = await prisma.user.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, nome: true, nickname: true },
  })

  return rakeByPlayer.map((r) => ({
    jogador: players.find((p) => p.id === r.jogador_id),
    total_gasto: Number(r._sum.valor || 0),
  }))
}

export async function playerFrequencyReport(organizationId: string, from: Date, to: Date, limit: number = 20) {
  const presences = await prisma.presence.groupBy({
    by: ['jogador_id'],
    where: {
      organization_id: organizationId,
      checkin_at: { gte: from, lte: to },
    },
    _count: true,
    _sum: { duracao_minutos: true },
    orderBy: { _count: { jogador_id: 'desc' } },
    take: limit,
  })

  const playerIds = presences.map((p) => p.jogador_id)
  const players = await prisma.user.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, nome: true, nickname: true },
  })

  return presences.map((p) => ({
    jogador: players.find((pl) => pl.id === p.jogador_id),
    visitas: p._count,
    total_horas: Math.round((p._sum.duracao_minutos || 0) / 60 * 10) / 10,
  }))
}

export async function barSalesReport(organizationId: string, from: Date, to: Date) {
  const sales = await prisma.tabItem.groupBy({
    by: ['produto_id'],
    where: {
      tab: { organization_id: organizationId },
      created_at: { gte: from, lte: to },
    },
    _sum: { valor_total: true, quantidade: true },
    orderBy: { _sum: { valor_total: 'desc' } },
  })

  const productIds = sales.map((s) => s.produto_id)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, nome: true },
  })

  const total = sales.reduce((s, r) => s + Number(r._sum.valor_total || 0), 0)

  return {
    vendas: sales.map((s) => ({
      produto: products.find((p) => p.id === s.produto_id)?.nome,
      quantidade: Number(s._sum.quantidade || 0),
      valor_total: Number(s._sum.valor_total || 0),
    })),
    total,
  }
}
