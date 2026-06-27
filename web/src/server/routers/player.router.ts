import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import { createPlayerSchema, updatePlayerSchema, playerSearchSchema } from '@/lib/validators/player'
import * as playerService from '../services/player/player.service'

export const playerRouter = router({
  list: protectedProcedure
    .use(requirePermission('jogadores', 'listar'))
    .input(playerSearchSchema)
    .query(async ({ ctx, input }) => {
      return playerService.listPlayers(ctx.organizationId, input)
    }),

  getById: protectedProcedure
    .use(requirePermission('jogadores', 'ver'))
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return playerService.getPlayerById(ctx.organizationId, input.id)
    }),

  create: protectedProcedure
    .use(requirePermission('jogadores', 'criar'))
    .input(createPlayerSchema)
    .mutation(async ({ ctx, input }) => {
      return playerService.createPlayer(ctx.organizationId, input)
    }),

  update: protectedProcedure
    .use(requirePermission('jogadores', 'editar'))
    .input(updatePlayerSchema)
    .mutation(async ({ ctx, input }) => {
      return playerService.updatePlayer(ctx.organizationId, input)
    }),

  block: adminProcedure
    .input(z.object({ id: z.string().uuid(), motivo: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return playerService.blockPlayer(ctx.organizationId, input.id, input.motivo)
    }),

  unblock: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return playerService.unblockPlayer(ctx.organizationId, input.id)
    }),

  setPassword: adminProcedure
    .input(z.object({ id: z.string().uuid(), senha: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      return playerService.setPlayerPassword(ctx.organizationId, input.id, input.senha)
    }),

  addTag: protectedProcedure
    .use(requirePermission('jogadores', 'editar'))
    .input(z.object({ id: z.string().uuid(), tag: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return playerService.addTag(ctx.organizationId, input.id, input.tag)
    }),

  removeTag: protectedProcedure
    .use(requirePermission('jogadores', 'editar'))
    .input(z.object({ id: z.string().uuid(), tag: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return playerService.removeTag(ctx.organizationId, input.id, input.tag)
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return playerService.deletePlayer(ctx.organizationId, input.id)
    }),

  getStats: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return playerService.getPlayerStats(ctx.organizationId, input.id)
    }),

  search: protectedProcedure
    .input(z.object({ term: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return playerService.searchPlayers(ctx.organizationId, input.term)
    }),

  myStats: protectedProcedure.query(async ({ ctx }) => {
    return playerService.getPlayerStats(ctx.organizationId, ctx.user.id)
  }),
})
