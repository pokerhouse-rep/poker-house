import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import * as productService from '../services/product/product.service'

export const productRouter = router({
  list: protectedProcedure
    .input(z.object({
      categoria_id: z.string().uuid().optional(),
      status: z.enum(['ATIVO', 'INATIVO']).optional(),
      search: z.string().optional(),
    }).optional())
    .query(({ ctx, input }) => productService.listProducts(ctx.organizationId, input || {})),

  create: adminProcedure
    .input(z.object({
      nome: z.string().min(1),
      categoria_id: z.string().uuid(),
      preco: z.number().positive(),
    }))
    .mutation(({ ctx, input }) => productService.createProduct(ctx.organizationId, input)),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      nome: z.string().min(1).optional(),
      preco: z.number().positive().optional(),
      status: z.enum(['ATIVO', 'INATIVO']).optional(),
    }))
    .mutation(({ input }) => productService.updateProduct(input.id, input)),

  categoryList: protectedProcedure
    .query(({ ctx }) => productService.listCategories(ctx.organizationId)),

  categoryCreate: adminProcedure
    .input(z.object({ nome: z.string().min(1) }))
    .mutation(({ ctx, input }) => productService.createCategory(ctx.organizationId, input.nome)),

  categoryUpdate: adminProcedure
    .input(z.object({ id: z.string().uuid(), nome: z.string().optional(), ordem: z.number().int().optional() }))
    .mutation(({ input }) => productService.updateCategory(input.id, input)),

  categoryDelete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => productService.deleteCategory(ctx.organizationId, input.id)),
})
