import { prisma } from '@/lib/prisma'

export async function checkin(organizationId: string, jogadorId: string, registradoPorId: string) {
  return prisma.presence.create({
    data: {
      organization_id: organizationId,
      jogador_id: jogadorId,
      registrado_por_id: registradoPorId,
      dia_operacional: new Date(),
    },
  })
}

export async function checkout(jogadorId: string) {
  const presence = await prisma.presence.findFirst({
    where: { jogador_id: jogadorId, checkout_at: null },
    orderBy: { checkin_at: 'desc' },
  })

  if (!presence) return null

  const duracao = Math.round((Date.now() - presence.checkin_at.getTime()) / 60000)

  return prisma.presence.update({
    where: { id: presence.id },
    data: { checkout_at: new Date(), duracao_minutos: duracao },
  })
}

export async function listPresences(
  organizationId: string,
  params: { dia_operacional?: Date; jogador_id?: string; page: number; limit: number }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.dia_operacional) where.dia_operacional = params.dia_operacional
  if (params.jogador_id) where.jogador_id = params.jogador_id

  const [presences, total] = await Promise.all([
    prisma.presence.findMany({
      where,
      include: {
        jogador: { select: { id: true, nome: true, nickname: true } },
        registrado_por: { select: { nome: true } },
      },
      orderBy: { checkin_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.presence.count({ where }),
  ])

  return { presences, total }
}

export async function getActivePresences(organizationId: string) {
  return prisma.presence.findMany({
    where: { organization_id: organizationId, checkout_at: null },
    include: { jogador: { select: { id: true, nome: true, nickname: true, foto_url: true } } },
    orderBy: { checkin_at: 'asc' },
  })
}

export async function getPlayerFrequency(
  organizationId: string,
  jogadorId: string,
  from?: Date,
  to?: Date
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    jogador_id: jogadorId,
  }

  if (from || to) {
    where.checkin_at = {}
    if (from) (where.checkin_at as Record<string, unknown>).gte = from
    if (to) (where.checkin_at as Record<string, unknown>).lte = to
  }

  const presences = await prisma.presence.findMany({ where })

  const totalVisitas = presences.length
  const totalMinutos = presences.reduce((sum, p) => sum + (p.duracao_minutos || 0), 0)

  return {
    total_visitas: totalVisitas,
    total_horas: Math.round(totalMinutos / 60 * 10) / 10,
    media_permanencia_minutos: totalVisitas > 0 ? Math.round(totalMinutos / totalVisitas) : 0,
  }
}
