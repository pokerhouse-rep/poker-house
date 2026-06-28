import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as presenceService from '../services/presence/presence.service'

export const presenceRouter = router({
  checkin: protectedProcedure
    .use(requirePermission('presenca', 'criar'))
    .input(z.object({ jogador_id: z.string().uuid() }))
    .mutation(({ ctx, input }) => presenceService.checkin(ctx.organizationId, input.jogador_id, ctx.user.id)),

  checkout: protectedProcedure
    .use(requirePermission('presenca', 'criar'))
    .input(z.object({ jogador_id: z.string().uuid() }))
    .mutation(({ input }) => presenceService.checkout(input.jogador_id)),

  list: protectedProcedure
    .use(requirePermission('presenca', 'listar'))
    .input(z.object({
      dia_operacional: z.coerce.date().optional(),
      jogador_id: z.string().uuid().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(({ ctx, input }) => presenceService.listPresences(ctx.organizationId, input)),

  getActive: protectedProcedure
    .query(({ ctx }) => presenceService.getActivePresences(ctx.organizationId)),

  getPlayerFrequency: protectedProcedure
    .input(z.object({
      jogador_id: z.string().uuid(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }))
    .query(({ ctx, input }) => presenceService.getPlayerFrequency(ctx.organizationId, input.jogador_id, input.from, input.to)),
})
