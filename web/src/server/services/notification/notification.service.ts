import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@/generated/prisma/client'

export async function createNotification(params: {
  organization_id: string
  user_id: string
  tipo: NotificationType
  titulo: string
  mensagem: string
  referencia_tipo?: string
  referencia_id?: string
}) {
  return prisma.notification.create({ data: params })
}

export async function listNotifications(
  organizationId: string,
  userId: string,
  params: { lida?: boolean; page: number; limit: number }
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    user_id: userId,
  }
  if (params.lida !== undefined) where.lida = params.lida

  const [notifications, total, unread_count] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { organization_id: organizationId, user_id: userId, lida: false },
    }),
  ])

  return { notifications, total, unread_count }
}

export async function markRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { lida: true, read_at: new Date() },
  })
}

export async function markAllRead(organizationId: string, userId: string) {
  const result = await prisma.notification.updateMany({
    where: { organization_id: organizationId, user_id: userId, lida: false },
    data: { lida: true, read_at: new Date() },
  })
  return { count: result.count }
}
