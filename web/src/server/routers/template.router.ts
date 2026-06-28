import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as templateService from '../services/template/template.service'

const tipoEnum = z.enum(['TORNEIO', 'BLIND_STRUCTURE', 'PREMIACAO', 'RANKING', 'CASH_GAME', 'MENSAGEM', 'RELATORIO', 'PRODUTO', 'CONFIGURACAO'])

export const templateRouter = router({
  list: protectedProcedure
    .input(z.object({ tipo: tipoEnum.optional() }).optional())
    .query(({ ctx, input }) => templateService.list(ctx.organizationId, input?.tipo)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ input }) => templateService.getById(input.id)),

  create: protectedProcedure
    .use(requirePermission('templates', 'criar'))
    .input(z.object({ tipo: tipoEnum, nome: z.string().min(1), dados: z.any() }))
    .mutation(({ ctx, input }) => templateService.create(ctx.organizationId, input)),

  update: protectedProcedure
    .use(requirePermission('templates', 'editar'))
    .input(z.object({ id: z.string().uuid(), nome: z.string().optional(), dados: z.any().optional() }))
    .mutation(({ input }) => templateService.update(input.id, input)),

  delete: protectedProcedure
    .use(requirePermission('templates', 'deletar'))
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => templateService.remove(input.id)),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid(), novo_nome: z.string().min(1) }))
    .mutation(({ input }) => templateService.duplicate(input.id, input.novo_nome)),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => templateService.setDefault(ctx.organizationId, input.id)),

  setFavorite: protectedProcedure
    .input(z.object({ id: z.string().uuid(), is_favorito: z.boolean() }))
    .mutation(({ input }) => templateService.setFavorite(input.id, input.is_favorito)),
})
