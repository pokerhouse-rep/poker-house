import { prisma } from '@/lib/prisma'

export async function createAuditLog(params: {
  organization_id: string
  user_id: string
  acao: string
  entidade: string
  entidade_id: string
  valores_antigos?: unknown
  valores_novos?: unknown
  ip_address?: string
  user_agent?: string
}) {
  return prisma.auditLog.create({
    data: {
      organization_id: params.organization_id,
      user_id: params.user_id,
      acao: params.acao,
      entidade: params.entidade,
      entidade_id: params.entidade_id,
      valores_antigos: params.valores_antigos ? JSON.parse(JSON.stringify(params.valores_antigos)) : undefined,
      valores_novos: params.valores_novos ? JSON.parse(JSON.stringify(params.valores_novos)) : undefined,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
    },
  })
}

export async function listAuditLogs(
  organizationId: string,
  params: {
    user_id?: string
    entidade?: string
    acao?: string
    from?: Date
    to?: Date
    search?: string
    page: number
    limit: number
  }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }

  if (params.user_id) where.user_id = params.user_id
  if (params.entidade) where.entidade = params.entidade
  if (params.acao) where.acao = { contains: params.acao, mode: 'insensitive' }

  if (params.from || params.to) {
    where.created_at = {}
    if (params.from) (where.created_at as Record<string, unknown>).gte = params.from
    if (params.to) (where.created_at as Record<string, unknown>).lte = params.to
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, nome: true, tipo: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}

export async function getAuditLog(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    include: { user: { select: { id: true, nome: true, tipo: true } } },
  })
}
