import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import * as roleService from '../services/role/role.service'

const permissionSchema = z.object({
  modulo: z.string(),
  acoes: z.record(z.string(), z.boolean()),
})

export const roleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return roleService.listRoles(ctx.organizationId)
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return roleService.getRoleById(ctx.organizationId, input.id)
    }),

  create: adminProcedure
    .input(
      z.object({
        nome: z.string().min(2),
        descricao: z.string().optional(),
        permissions: z.array(permissionSchema),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return roleService.createRole(ctx.organizationId, input)
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        nome: z.string().min(2).optional(),
        descricao: z.string().optional(),
        permissions: z.array(permissionSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return roleService.updateRole(ctx.organizationId, id, data)
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return roleService.deleteRole(ctx.organizationId, input.id)
    }),
})
