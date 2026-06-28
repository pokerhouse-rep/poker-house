import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import * as auditService from '../services/audit/audit.service'

export const auditRouter = router({
  list: adminProcedure
    .input(z.object({
      user_id: z.string().uuid().optional(),
      entidade: z.string().optional(),
      acao: z.string().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(({ ctx, input }) => auditService.listAuditLogs(ctx.organizationId, input)),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => auditService.getAuditLog(input.id)),
})
