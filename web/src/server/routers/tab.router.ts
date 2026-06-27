import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import { requirePermission } from '../middleware/rbac'
import * as tabService from '../services/tab/tab.service'

export const tabRouter = router({
  getOpen: protectedProcedure
    .input(z.object({ jogador_id: z.string().uuid() }))
    .query(({ ctx, input }) => tabService.getOpenTab(ctx.organizationId, input.jogador_id)),

  listOpen: protectedProcedure
    .use(requirePermission('bar', 'listar'))
    .input(z.object({
      dia_operacional: z.coerce.date().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(({ ctx, input }) => tabService.listOpenTabs(ctx.organizationId, input)),

  open: protectedProcedure
    .use(requirePermission('bar', 'criar'))
    .input(z.object({
      jogador_id: z.string().uuid(),
      is_acompanhante: z.boolean().default(false),
    }))
    .mutation(({ ctx, input }) => tabService.openTab(ctx.organizationId, input.jogador_id, input.is_acompanhante)),

  addItem: protectedProcedure
    .use(requirePermission('bar', 'criar'))
    .input(z.object({
      tab_id: z.string().uuid(),
      produto_id: z.string().uuid(),
      quantidade: z.number().int().min(1),
      caixa_id: z.string().uuid().optional(),
    }))
    .mutation(({ ctx, input }) => tabService.addTabItem({
      organization_id: ctx.organizationId,
      funcionario_id: ctx.user.id,
      ...input,
    })),

  removeItem: adminProcedure
    .input(z.object({ tab_item_id: z.string().uuid(), motivo: z.string().min(1) }))
    .mutation(async () => {
      // TODO: implementar estorno do item
      return { success: true }
    }),

  close: protectedProcedure
    .use(requirePermission('bar', 'fechar'))
    .input(z.object({ tab_id: z.string().uuid() }))
    .mutation(({ input }) => tabService.closeTab(input.tab_id)),

  myTab: protectedProcedure
    .query(({ ctx }) => tabService.getOpenTab(ctx.organizationId, ctx.user.id)),
})
