import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as accountService from '../services/account/account.service'

const formaPagamentoEnum = z.enum([
  'DINHEIRO',
  'PIX',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'TRANSFERENCIA',
  'CARTEIRA',
])

export const accountRouter = router({
  getOpen: protectedProcedure
    .input(z.object({ jogador_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return accountService.getAccountSummary(
        ctx.organizationId,
        input.jogador_id
      )
    }),

  listOpen: protectedProcedure
    .use(requirePermission('conta_corrente', 'listar'))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return accountService.listOpenAccounts({
        organization_id: ctx.organizationId,
        ...input,
      })
    }),

  listOverdue: protectedProcedure
    .use(requirePermission('conta_corrente', 'ver'))
    .input(
      z.object({
        dias_minimo: z.number().min(1).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return accountService.listOverdueAccounts({
        organization_id: ctx.organizationId,
        ...input,
      })
    }),

  pay: protectedProcedure
    .use(requirePermission('conta_corrente', 'pagar'))
    .input(
      z.object({
        account_id: z.string().uuid(),
        valor: z.number().positive(),
        forma_pagamento: formaPagamentoEnum,
        caixa_id: z.string().uuid().optional(),
        item_ids: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return accountService.payAccount({
        organization_id: ctx.organizationId,
        funcionario_id: ctx.user.id,
        ...input,
      })
    }),

  compensate: adminProcedure
    .input(
      z.object({
        account_id: z.string().uuid(),
        jogador_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return accountService.compensateWithWallet({
        organization_id: ctx.organizationId,
        funcionario_id: ctx.user.id,
        ...input,
      })
    }),

  getSummary: protectedProcedure
    .input(z.object({ jogador_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return accountService.getAccountSummary(
        ctx.organizationId,
        input.jogador_id
      )
    }),

  myAccounts: protectedProcedure.query(async ({ ctx }) => {
    return accountService.getAccountSummary(
      ctx.organizationId,
      ctx.user.id
    )
  }),
})
