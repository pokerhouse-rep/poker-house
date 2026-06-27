import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as cashRegisterService from '../services/cashRegister/cashRegister.service'

export const cashRegisterRouter = router({
  list: protectedProcedure
    .use(requirePermission('caixa', 'listar'))
    .input(z.object({
      tipo: z.enum(['TORNEIO', 'MESA_CASH', 'BAR', 'GERAL']).optional(),
      status: z.enum(['ABERTO', 'FECHADO']).optional(),
      dia_operacional: z.coerce.date().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(({ ctx, input }) => cashRegisterService.listCashRegisters(ctx.organizationId, input)),

  getById: protectedProcedure
    .use(requirePermission('caixa', 'ver'))
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => cashRegisterService.getCashRegisterSummary(ctx.organizationId, input.id)),

  open: protectedProcedure
    .use(requirePermission('caixa', 'abrir'))
    .input(z.object({
      tipo: z.enum(['TORNEIO', 'MESA_CASH', 'BAR', 'GERAL']),
      referencia_id: z.string().uuid().optional(),
      fundo_troco: z.number().min(0).default(0),
    }))
    .mutation(({ ctx, input }) => cashRegisterService.openCashRegister({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  close: protectedProcedure
    .use(requirePermission('caixa', 'fechar'))
    .input(z.object({
      id: z.string().uuid(),
      valor_informado: z.number().min(0),
      justificativa_diferenca: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => cashRegisterService.closeCashRegister({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  withdraw: adminProcedure
    .input(z.object({
      caixa_id: z.string().uuid(),
      valor: z.number().positive(),
      motivo: z.string().min(1),
    }))
    .mutation(({ ctx, input }) => cashRegisterService.registerWithdrawal({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  supply: adminProcedure
    .input(z.object({
      caixa_id: z.string().uuid(),
      valor: z.number().positive(),
      motivo: z.string().min(1),
    }))
    .mutation(({ ctx, input }) => cashRegisterService.registerSupply({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),
})
