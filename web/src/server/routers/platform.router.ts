import { z } from 'zod'
import { router, superAdminProcedure } from '../trpc'
import { createOrganization } from '../services/platform/platform.service'
import { prisma } from '@/lib/prisma'

export const platformRouter = router({
  listOrgs: superAdminProcedure
    .input(z.object({
      status: z.enum(['ATIVA', 'SUSPENSA', 'CANCELADA']).optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {}
      if (input.status) where.status = input.status
      if (input.search) where.nome_fantasia = { contains: input.search, mode: 'insensitive' }

      const [orgs, total] = await Promise.all([
        prisma.organization.findMany({
          where,
          include: {
            _count: { select: { users: true } },
            subscription: { select: { plano: true, status: true } },
          },
          orderBy: { created_at: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        prisma.organization.count({ where }),
      ])

      return { orgs, total }
    }),

  createOrg: superAdminProcedure
    .input(z.object({
      cnpj: z.string().min(14),
      razao_social: z.string().min(2),
      nome_fantasia: z.string().min(2),
      email: z.string().email(),
      telefone: z.string().optional(),
      admin: z.object({
        nome: z.string().min(2),
        email: z.string().email(),
        cpf: z.string().min(11),
        telefone: z.string().min(10),
        senha: z.string().min(8),
        data_nascimento: z.string(),
      }),
    }))
    .mutation(({ input }) => createOrganization(input)),

  suspendOrg: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.organization.update({ where: { id: input.id }, data: { status: 'SUSPENSA' } })
    ),

  activateOrg: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.organization.update({ where: { id: input.id }, data: { status: 'ATIVA' } })
    ),

  cancelOrg: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) =>
      prisma.organization.update({ where: { id: input.id }, data: { status: 'CANCELADA' } })
    ),

  getDashboard: superAdminProcedure.query(async () => {
    const [totalOrgs, totalPlayers, totalTournaments] = await Promise.all([
      prisma.organization.count({ where: { status: 'ATIVA' } }),
      prisma.user.count({ where: { tipo: 'JOGADOR' } }),
      prisma.tournament.count(),
    ])

    return { total_orgs: totalOrgs, total_players: totalPlayers, total_tournaments: totalTournaments }
  }),
})
