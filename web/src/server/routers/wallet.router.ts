import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as walletService from '../services/wallet/wallet.service'

const formaPagamentoEnum = z.enum([
  'DINHEIRO',
  'PIX',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'TRANSFERENCIA',
  'CARTEIRA',
])

const saldoTipoEnum = z.enum([
  'DISPONIVEL',
  'PENDENTE',
  'BLOQUEADO',
  'PROMOCIONAL',
  'BONUS',
  'RAKEBACK',
  'PREMIACOES',
])

export const walletRouter = router({
  getByPlayer: protectedProcedure
    .input(z.object({ jogador_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return walletService.getWallet(ctx.organizationId, input.jogador_id)
    }),

  deposit: protectedProcedure
    .use(requirePermission('carteira', 'depositar'))
    .input(
      z.object({
        jogador_id: z.string().uuid(),
        valor: z.number().positive(),
        forma_pagamento: formaPagamentoEnum,
        saldo_tipo: saldoTipoEnum.optional(),
        caixa_id: z.string().uuid().optional(),
        descricao: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return walletService.deposit({
        organization_id: ctx.organizationId,
        funcionario_id: ctx.user.id,
        ...input,
      })
    }),

  withdraw: protectedProcedure
    .use(requirePermission('carteira', 'sacar'))
    .input(
      z.object({
        jogador_id: z.string().uuid(),
        valor: z.number().positive(),
        forma_pagamento: formaPagamentoEnum,
        caixa_id: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return walletService.withdraw({
        organization_id: ctx.organizationId,
        funcionario_id: ctx.user.id,
        ...input,
      })
    }),

  creditBonus: adminProcedure
    .input(
      z.object({
        jogador_id: z.string().uuid(),
        valor: z.number().positive(),
        motivo: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return walletService.creditToWallet({
        organization_id: ctx.organizationId,
        jogador_id: input.jogador_id,
        funcionario_id: ctx.user.id,
        valor: input.valor,
        saldo_tipo: 'BONUS',
        categoria: 'BONUS',
        referencia_tipo: 'MANUAL',
        referencia_id: input.jogador_id,
        descricao: input.motivo,
      })
    }),

  creditPromotional: adminProcedure
    .input(
      z.object({
        jogador_id: z.string().uuid(),
        valor: z.number().positive(),
        motivo: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return walletService.creditToWallet({
        organization_id: ctx.organizationId,
        jogador_id: input.jogador_id,
        funcionario_id: ctx.user.id,
        valor: input.valor,
        saldo_tipo: 'PROMOCIONAL',
        categoria: 'PROMOCIONAL',
        referencia_tipo: 'MANUAL',
        referencia_id: input.jogador_id,
        descricao: input.motivo,
      })
    }),

  getStatement: protectedProcedure
    .use(requirePermission('carteira', 'ver'))
    .input(
      z.object({
        jogador_id: z.string().uuid(),
        saldo_tipo: saldoTipoEnum.optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return walletService.getStatement({
        organization_id: ctx.organizationId,
        ...input,
      })
    }),

  recalculate: adminProcedure
    .input(z.object({ jogador_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return walletService.refreshWalletCache(
        ctx.organizationId,
        input.jogador_id
      )
    }),

  myWallet: protectedProcedure.query(async ({ ctx }) => {
    return walletService.getWallet(ctx.organizationId, ctx.user.id)
  }),

  myStatement: protectedProcedure
    .input(
      z.object({
        saldo_tipo: saldoTipoEnum.optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return walletService.getStatement({
        organization_id: ctx.organizationId,
        jogador_id: ctx.user.id,
        ...input,
      })
    }),
})
