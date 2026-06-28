import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import * as configService from '../services/config/config.service'

export const configRouter = router({
  getAll: adminProcedure
    .query(({ ctx }) => configService.getAll(ctx.organizationId)),

  get: adminProcedure
    .input(z.object({ chave: z.string() }))
    .query(({ ctx, input }) => configService.get(ctx.organizationId, input.chave)),

  set: adminProcedure
    .input(z.object({ chave: z.string(), valor: z.any() }))
    .mutation(({ ctx, input }) => configService.set(ctx.organizationId, input.chave, input.valor)),

  setBulk: adminProcedure
    .input(z.object({ configs: z.array(z.object({ chave: z.string(), valor: z.any() })) }))
    .mutation(({ ctx, input }) => configService.setBulk(ctx.organizationId, input.configs)),
})
