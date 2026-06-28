import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import * as loyaltyService from '../services/loyalty/loyalty.service'

export const loyaltyRouter = router({
  list: adminProcedure
    .query(({ ctx }) => loyaltyService.listPrograms(ctx.organizationId)),

  create: adminProcedure
    .input(z.object({ nome: z.string().min(2), regras: z.any() }))
    .mutation(({ ctx, input }) => loyaltyService.createProgram(ctx.organizationId, input)),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      nome: z.string().optional(),
      regras: z.any().optional(),
      status: z.enum(['ATIVO', 'INATIVO']).optional(),
    }))
    .mutation(({ input }) => loyaltyService.updateProgram(input.id, input)),

  getProgress: protectedProcedure
    .input(z.object({ program_id: z.string().uuid().optional(), jogador_id: z.string().uuid().optional() }))
    .query(({ input }) => loyaltyService.getProgress(input)),

  myProgress: protectedProcedure
    .query(({ ctx }) => loyaltyService.getProgress({ jogador_id: ctx.user.id })),
})
