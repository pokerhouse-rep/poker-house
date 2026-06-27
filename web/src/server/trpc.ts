import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { type Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware

const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Não autenticado' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      organizationId: ctx.user.organizationId,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthenticated)

const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.tipo !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' })
  }
  return next()
})

export const adminProcedure = protectedProcedure.use(isAdmin)

const isSuperAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user || !ctx.user.isSuperAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' })
  }
  return next()
})

export const superAdminProcedure = t.procedure.use(isSuperAdmin)
