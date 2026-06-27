import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import {
  createTournamentSchema,
  registerEntrySchema,
  registerOnlineEntrySchema,
  confirmPrizesSchema,
  registerDealSchema,
  chipCountSchema,
  balanceMovesSchema,
} from '@/lib/validators/tournament'
import * as tournamentService from '../services/tournament/tournament.service'

const formaPagamentoEnum = z.enum([
  'DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO',
  'TRANSFERENCIA', 'CARTEIRA',
])

export const tournamentRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      return tournamentService.listTournaments(ctx.organizationId, input)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return tournamentService.getTournament(ctx.organizationId, input.id)
    }),

  create: protectedProcedure
    .use(requirePermission('torneios', 'criar'))
    .input(createTournamentSchema)
    .mutation(async ({ ctx, input }) => {
      return tournamentService.createTournament(ctx.organizationId, input)
    }),

  openRegistration: protectedProcedure
    .use(requirePermission('torneios', 'abrir'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.openRegistration(ctx.organizationId, input.id, ctx.user.id)
    }),

  start: protectedProcedure
    .use(requirePermission('torneios', 'iniciar'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.startTournament(ctx.organizationId, input.id)
    }),

  pause: protectedProcedure
    .use(requirePermission('torneios', 'pausar'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.pauseTournament(ctx.organizationId, input.id)
    }),

  resume: protectedProcedure
    .use(requirePermission('torneios', 'pausar'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.resumeTournament(ctx.organizationId, input.id)
    }),

  finish: protectedProcedure
    .use(requirePermission('torneios', 'finalizar'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.finishTournament(ctx.organizationId, input.id, ctx.user.id)
    }),

  cancel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.cancelTournament(ctx.organizationId, input.id, ctx.user.id)
    }),

  registerEntry: protectedProcedure
    .use(requirePermission('torneios', 'inscrever'))
    .input(registerEntrySchema)
    .mutation(async ({ ctx, input }) => {
      return tournamentService.registerEntry({
        organization_id: ctx.organizationId,
        tournament_id: input.tournament_id,
        jogador_id: input.jogador_id,
        funcionario_id: ctx.user.id,
        forma_pagamento: input.forma_pagamento,
      })
    }),

  registerOnlineEntry: protectedProcedure
    .input(registerOnlineEntrySchema)
    .mutation(async ({ ctx, input }) => {
      return tournamentService.registerOnlineEntry({
        organization_id: ctx.organizationId,
        tournament_id: input.tournament_id,
        jogador_id: ctx.user.id,
        forma_pagamento: input.forma_pagamento,
      })
    }),

  confirmOnlinePayment: protectedProcedure
    .use(requirePermission('torneios', 'confirmar_pagamento'))
    .input(z.object({ entry_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.confirmOnlinePayment(
        ctx.organizationId, input.entry_id, ctx.user.id
      )
    }),

  registerRebuy: protectedProcedure
    .use(requirePermission('torneios', 'rebuy'))
    .input(z.object({
      entry_id: z.string().uuid(),
      forma_pagamento: formaPagamentoEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.registerRebuy(
        ctx.organizationId, input.entry_id, ctx.user.id, input.forma_pagamento
      )
    }),

  registerReentry: protectedProcedure
    .use(requirePermission('torneios', 'reentrada'))
    .input(z.object({
      entry_id: z.string().uuid(),
      forma_pagamento: formaPagamentoEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.registerReentry(
        ctx.organizationId, input.entry_id, ctx.user.id, input.forma_pagamento
      )
    }),

  registerAddon: protectedProcedure
    .use(requirePermission('torneios', 'addon'))
    .input(z.object({
      entry_id: z.string().uuid(),
      forma_pagamento: formaPagamentoEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.registerAddon(
        ctx.organizationId, input.entry_id, ctx.user.id, input.forma_pagamento
      )
    }),

  eliminatePlayer: protectedProcedure
    .use(requirePermission('torneios', 'eliminar'))
    .input(z.object({ entry_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.eliminatePlayer(ctx.organizationId, input.entry_id)
    }),

  suggestPrizes: protectedProcedure
    .input(z.object({ tournament_id: z.string().uuid() }))
    .query(async ({ input }) => {
      return tournamentService.suggestPrizes(input.tournament_id)
    }),

  confirmPrizes: protectedProcedure
    .use(requirePermission('torneios', 'premiacao'))
    .input(confirmPrizesSchema)
    .mutation(async ({ ctx, input }) => {
      return tournamentService.confirmPrizes(
        ctx.organizationId, input.tournament_id, input.prizes
      )
    }),

  payPrize: protectedProcedure
    .use(requirePermission('torneios', 'pagar_premio'))
    .input(z.object({
      prize_id: z.string().uuid(),
      jogador_id: z.string().uuid(),
      forma_pagamento: formaPagamentoEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.payPrize(
        ctx.organizationId, input.prize_id, input.jogador_id,
        ctx.user.id, input.forma_pagamento
      )
    }),

  registerDeal: protectedProcedure
    .use(requirePermission('torneios', 'deal'))
    .input(registerDealSchema)
    .mutation(async ({ ctx, input }) => {
      return tournamentService.registerDeal(
        ctx.organizationId, input.tournament_id, input.deal, ctx.user.id
      )
    }),

  updateChipCount: protectedProcedure
    .use(requirePermission('torneios', 'chipcount'))
    .input(chipCountSchema)
    .mutation(async ({ input }) => {
      return tournamentService.updateChipCount(input.tournament_id, input.chipcounts)
    }),

  advanceBlind: protectedProcedure
    .input(z.object({ tournament_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return tournamentService.advanceBlind(ctx.organizationId, input.tournament_id)
    }),

  balanceTables: protectedProcedure
    .use(requirePermission('torneios', 'balancear'))
    .input(balanceMovesSchema)
    .mutation(async ({ input }) => {
      return tournamentService.applyBalance(input.tournament_id, input.moves)
    }),

  getAvailable: protectedProcedure.query(async ({ ctx }) => {
    return tournamentService.getAvailableTournaments(ctx.organizationId)
  }),
})
