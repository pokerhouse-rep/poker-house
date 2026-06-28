import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import * as notificationService from '../services/notification/notification.service'

export const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({
      lida: z.boolean().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(({ ctx, input }) => notificationService.listNotifications(ctx.organizationId, ctx.user.id, input)),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => notificationService.markRead(input.id)),

  markAllRead: protectedProcedure
    .mutation(({ ctx }) => notificationService.markAllRead(ctx.organizationId, ctx.user.id)),
})
