import { router, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const dashboardRouter = router({
  admin: protectedProcedure.query(async ({ ctx }) => {
    const orgId = ctx.organizationId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      jogadoresAtivos,
      torneiosAtivos,
      cashAbertas,
      contasAbertas,
      presentes,
      receitaDia,
      rakeDia,
    ] = await Promise.all([
      prisma.user.count({
        where: { organization_id: orgId, tipo: 'JOGADOR', status: 'ATIVO' },
      }),
      prisma.tournament.count({
        where: { organization_id: orgId, status: { in: ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO'] } },
      }),
      prisma.cashTable.count({
        where: { organization_id: orgId, status: { in: ['ABERTA', 'CHEIA'] } },
      }),
      prisma.account.count({
        where: { organization_id: orgId, status: 'ABERTA' },
      }),
      prisma.presence.count({
        where: { organization_id: orgId, checkout_at: null },
      }),
      prisma.ledgerTransaction.aggregate({
        where: { organization_id: orgId, tipo: 'CREDITO', created_at: { gte: today } },
        _sum: { valor: true },
      }),
      prisma.ledgerTransaction.aggregate({
        where: { organization_id: orgId, categoria: 'RAKE', created_at: { gte: today } },
        _sum: { valor: true },
      }),
    ])

    const torneios = await prisma.tournament.findMany({
      where: { organization_id: orgId, status: { in: ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO'] } },
      select: {
        id: true, nome: true, status: true, total_inscritos: true,
        prize_pool: true, nivel_atual: true,
        blind_structure: { include: { levels: { where: { is_break: false }, orderBy: { ordem: 'asc' } } } },
      },
    })

    const mesas = await prisma.cashTable.findMany({
      where: { organization_id: orgId, status: { in: ['ABERTA', 'CHEIA'] } },
      select: {
        id: true, nome: true, modalidade: true, stakes: true,
        status: true, max_jogadores: true, rake_tipo: true,
        _count: { select: { sessions: { where: { status: 'ATIVA' } } } },
        waitlist: { select: { id: true } },
      },
    })

    return {
      kpis: {
        receita_dia: Number(receitaDia._sum.valor || 0),
        rake_dia: Number(rakeDia._sum.valor || 0),
        jogadores_ativos: jogadoresAtivos,
        torneios_ativos: torneiosAtivos,
        cash_abertas: cashAbertas,
        contas_abertas: contasAbertas,
        presentes,
      },
      torneios: torneios.map((t) => {
        const level = t.blind_structure.levels.find((l) => l.nivel === t.nivel_atual)
        return {
          id: t.id,
          nome: t.nome,
          status: t.status,
          jogadores: t.total_inscritos,
          prize_pool: Number(t.prize_pool),
          nivel: level ? `Nível ${level.nivel} - ${level.small_blind}/${level.big_blind}` : `Nível ${t.nivel_atual}`,
        }
      }),
      mesas: mesas.map((m) => ({
        id: m.id,
        nome: m.nome,
        modalidade: m.modalidade,
        stakes: m.stakes,
        status: m.status,
        jogadores: m._count.sessions,
        max: m.max_jogadores,
        waitlist: m.waitlist.length,
        rake: m.rake_tipo === 'POT_RAKE' ? 'Pot Rake' : 'Time Rake',
      })),
    }
  }),
})
