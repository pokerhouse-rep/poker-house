import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as ledgerService from '../services/ledger/ledger.service'

export const ledgerRouter = router({
  list: protectedProcedure
    .use(requirePermission('financeiro', 'listar'))
    .input(
      z.object({
        categoria: z.string().optional(),
        tipo: z.enum(['CREDITO', 'DEBITO']).optional(),
        jogador_id: z.string().uuid().optional(),
        dia_operacional: z.coerce.date().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return ledgerService.getTransactions({
        organization_id: ctx.organizationId,
        ...input,
        categoria: input.categoria as never,
        tipo: input.tipo as never,
      })
    }),

  getById: protectedProcedure
    .use(requirePermission('financeiro', 'ver'))
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { transactions } = await ledgerService.getTransactions({
        organization_id: ctx.organizationId,
        page: 1,
        limit: 1,
      })
      const transaction = transactions.find((t) => t.id === input.id)
      if (!transaction) throw new Error('Transação não encontrada')
      return transaction
    }),

  refund: adminProcedure
    .input(
      z.object({
        transaction_id: z.string().uuid(),
        motivo: z.string().min(1, 'Motivo obrigatório'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ledgerService.createRefund(
        input.transaction_id,
        input.motivo,
        ctx.user.id
      )
    }),

  getDailySummary: protectedProcedure
    .use(requirePermission('financeiro', 'ver'))
    .input(z.object({ dia_operacional: z.coerce.date() }))
    .query(async ({ ctx, input }) => {
      return ledgerService.getDailySummary(
        ctx.organizationId,
        input.dia_operacional
      )
    }),
})
