import { z } from 'zod'
import { router, adminProcedure, protectedProcedure } from '../trpc'
import * as rakebackService from '../services/rakeback/rakeback.service'

export const rakebackRouter = router({
  calculate: adminProcedure
    .input(z.object({ periodo_inicio: z.coerce.date(), periodo_fim: z.coerce.date() }))
    .mutation(({ ctx, input }) => rakebackService.calculateRakeback(ctx.organizationId, input.periodo_inicio, input.periodo_fim)),

  credit: adminProcedure
    .input(z.object({
      jogadores_rakeback: z.array(z.object({ jogador_id: z.string().uuid(), valor: z.number().positive() })),
    }))
    .mutation(({ ctx, input }) => rakebackService.creditRakeback(ctx.organizationId, ctx.user.id, input.jogadores_rakeback)),

  getHistory: protectedProcedure
    .input(z.object({ jogador_id: z.string().uuid().optional(), page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20) }))
    .query(({ ctx, input }) => rakebackService.getRakebackHistory(ctx.organizationId, input)),

  myRakeback: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20) }))
    .query(({ ctx, input }) => rakebackService.getRakebackHistory(ctx.organizationId, { jogador_id: ctx.user.id, ...input })),
})
