import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { prisma } from '@/lib/prisma'

export const blindStructureRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.blindStructure.findMany({
      where: { organization_id: ctx.organizationId },
      include: { _count: { select: { levels: true } } },
      orderBy: { nome: 'asc' },
    })
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return prisma.blindStructure.findUnique({
        where: { id: input.id },
        include: { levels: { orderBy: { ordem: 'asc' } } },
      })
    }),
})
