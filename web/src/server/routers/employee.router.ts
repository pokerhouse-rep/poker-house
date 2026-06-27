import { z } from 'zod'
import { router, adminProcedure, protectedProcedure } from '../trpc'
import * as employeeService from '../services/employee/employee.service'

export const employeeRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']).optional(),
        role: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return employeeService.listEmployees(ctx.organizationId, input)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return employeeService.getEmployeeById(ctx.organizationId, input.id)
    }),

  create: adminProcedure
    .input(
      z.object({
        nome: z.string().min(2),
        email: z.string().email(),
        cpf: z.string().min(11),
        telefone: z.string().min(10),
        senha: z.string().min(8),
        data_nascimento: z.string(),
        role_ids: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return employeeService.createEmployee(ctx.organizationId, input)
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        nome: z.string().min(2).optional(),
        email: z.string().email().optional(),
        telefone: z.string().min(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return employeeService.updateEmployee(ctx.organizationId, input)
    }),

  deactivate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return employeeService.deactivateEmployee(ctx.organizationId, input.id)
    }),

  activate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return employeeService.activateEmployee(ctx.organizationId, input.id)
    }),

  assignRole: adminProcedure
    .input(z.object({ user_id: z.string().uuid(), role_id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return employeeService.assignRole(input.user_id, input.role_id)
    }),

  revokeRole: adminProcedure
    .input(z.object({ user_id: z.string().uuid(), role_id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return employeeService.revokeRole(input.user_id, input.role_id)
    }),
})
