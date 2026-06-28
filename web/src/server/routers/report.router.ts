import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as reportService from '../services/report/report.service'

export const reportRouter = router({
  financialDaily: protectedProcedure
    .use(requirePermission('relatorios', 'ver'))
    .input(z.object({ dia_operacional: z.coerce.date() }))
    .query(({ ctx, input }) => reportService.financialDaily(ctx.organizationId, input.dia_operacional)),

  financialPeriod: protectedProcedure
    .use(requirePermission('relatorios', 'ver'))
    .input(z.object({ from: z.coerce.date(), to: z.coerce.date() }))
    .query(({ ctx, input }) => reportService.financialPeriod(ctx.organizationId, input.from, input.to)),

  overdue: protectedProcedure
    .use(requirePermission('relatorios', 'ver'))
    .input(z.object({ dias_minimo: z.number().int().min(1).default(1) }).optional())
    .query(({ ctx, input }) => reportService.overdueReport(ctx.organizationId, input?.dias_minimo)),

  topRevenuePlayers: protectedProcedure
    .use(requirePermission('relatorios', 'ver'))
    .input(z.object({ from: z.coerce.date(), to: z.coerce.date(), limit: z.number().int().max(50).default(10) }))
    .query(({ ctx, input }) => reportService.topRevenuePlayers(ctx.organizationId, input.from, input.to, input.limit)),

  playerFrequency: protectedProcedure
    .use(requirePermission('relatorios', 'ver'))
    .input(z.object({ from: z.coerce.date(), to: z.coerce.date(), limit: z.number().int().max(50).default(20) }))
    .query(({ ctx, input }) => reportService.playerFrequencyReport(ctx.organizationId, input.from, input.to, input.limit)),

  barSales: protectedProcedure
    .use(requirePermission('relatorios', 'ver'))
    .input(z.object({ from: z.coerce.date(), to: z.coerce.date() }))
    .query(({ ctx, input }) => reportService.barSalesReport(ctx.organizationId, input.from, input.to)),
})
