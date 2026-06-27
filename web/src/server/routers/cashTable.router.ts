import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as cashTableService from '../services/cashTable/cashTable.service'

const formaPag = z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'CARTEIRA'])

export const cashTableRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      modalidade: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(({ ctx, input }) => cashTableService.listTables(ctx.organizationId, input)),

  create: protectedProcedure
    .use(requirePermission('cash_game', 'criar'))
    .input(z.object({
      nome: z.string().min(1),
      modalidade: z.string().min(1),
      stakes: z.string().min(1),
      blind_small: z.number().positive(),
      blind_big: z.number().positive(),
      buyin_minimo: z.number().positive(),
      buyin_maximo: z.number().positive(),
      max_jogadores: z.number().int().min(2).max(10).optional(),
      rake_tipo: z.enum(['POT_RAKE', 'TIME_RAKE']),
      rake_percentual: z.number().optional(),
      rake_cap: z.number().optional(),
      rake_valor_hora: z.number().optional(),
    }))
    .mutation(({ ctx, input }) => cashTableService.createTable(ctx.organizationId, input)),

  open: protectedProcedure
    .use(requirePermission('cash_game', 'abrir'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => cashTableService.openTable(ctx.organizationId, input.id, ctx.user.id)),

  close: protectedProcedure
    .use(requirePermission('cash_game', 'fechar'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => cashTableService.closeTable(ctx.organizationId, input.id, ctx.user.id)),

  seatPlayer: protectedProcedure
    .use(requirePermission('cash_game', 'sentar'))
    .input(z.object({
      table_id: z.string().uuid(),
      jogador_id: z.string().uuid(),
      assento: z.number().int().optional(),
      buyin_valor: z.number().positive(),
      forma_pagamento: formaPag,
    }))
    .mutation(({ ctx, input }) => cashTableService.seatPlayer({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  buyChips: protectedProcedure
    .use(requirePermission('cash_game', 'comprar_fichas'))
    .input(z.object({
      session_id: z.string().uuid(),
      valor: z.number().positive(),
      forma_pagamento: formaPag,
    }))
    .mutation(({ ctx, input }) => cashTableService.buyChips({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  cashoutPlayer: protectedProcedure
    .use(requirePermission('cash_game', 'cashout'))
    .input(z.object({
      session_id: z.string().uuid(),
      fichas_valor: z.number().min(0),
    }))
    .mutation(({ ctx, input }) => cashTableService.cashoutPlayer({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  registerRake: protectedProcedure
    .use(requirePermission('cash_game', 'registrar_rake'))
    .input(z.object({
      table_id: z.string().uuid(),
      valor: z.number().positive(),
    }))
    .mutation(({ ctx, input }) => cashTableService.registerRake({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  registerTip: protectedProcedure
    .use(requirePermission('cash_game', 'registrar_tip'))
    .input(z.object({
      session_id: z.string().uuid(),
      valor: z.number().positive(),
    }))
    .mutation(({ ctx, input }) => cashTableService.registerTip({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  joinWaitlist: protectedProcedure
    .input(z.object({ table_id: z.string().uuid(), jogador_id: z.string().uuid() }))
    .mutation(({ input }) => cashTableService.joinWaitlist(input.table_id, input.jogador_id)),

  leaveWaitlist: protectedProcedure
    .input(z.object({ table_id: z.string().uuid(), jogador_id: z.string().uuid() }))
    .mutation(({ input }) => cashTableService.leaveWaitlist(input.table_id, input.jogador_id)),

  reserveSeat: protectedProcedure
    .input(z.object({
      table_id: z.string().uuid(),
      jogador_id: z.string().uuid(),
      assento: z.number().int(),
      duracao_minutos: z.number().int().min(5).max(60).default(15),
    }))
    .mutation(({ input }) => cashTableService.reserveSeat(input.table_id, input.jogador_id, input.assento, input.duracao_minutos)),

  cancelReservation: protectedProcedure
    .input(z.object({ reservation_id: z.string().uuid() }))
    .mutation(({ input }) => cashTableService.cancelReservation(input.reservation_id)),

  getWaitlistForDisplay: protectedProcedure
    .query(({ ctx }) => cashTableService.getWaitlistForDisplay(ctx.organizationId)),
})
