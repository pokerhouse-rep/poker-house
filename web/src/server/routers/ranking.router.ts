import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import * as rankingService from '../services/ranking/ranking.service'

export const rankingRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), page: z.number().min(1).default(1), limit: z.number().min(1).max(50).default(20) }))
    .query(({ ctx, input }) => rankingService.listRankings(ctx.organizationId, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => rankingService.getRanking(ctx.organizationId, input.id)),

  create: adminProcedure
    .input(z.object({
      nome: z.string().min(2),
      tipo: z.enum(['SEMESTRAL', 'ANUAL']),
      periodo_inicio: z.coerce.date(),
      periodo_fim: z.coerce.date(),
      pontuacao: z.array(z.object({ posicao: z.number().int(), pontos: z.number().int() })),
      desempate: z.array(z.string()),
      premios: z.array(z.object({ posicao: z.number().int(), valor: z.number() })).optional(),
    }))
    .mutation(({ ctx, input }) => rankingService.createRanking(ctx.organizationId, input)),

  finish: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => rankingService.finishRanking(ctx.organizationId, input.id, ctx.user.id)),

  recalculate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => rankingService.recalculateStandings(input.id)),
})
