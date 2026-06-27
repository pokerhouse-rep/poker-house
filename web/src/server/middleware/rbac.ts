import { TRPCError } from '@trpc/server'
import { middleware } from '../trpc'
import { prisma } from '@/lib/prisma'

type Permission = {
  modulo: string
  acoes: Record<string, boolean>
}

export function requirePermission(modulo: string, acao: string) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    if (ctx.user.isSuperAdmin || ctx.user.tipo === 'ADMIN') {
      return next()
    }

    const userRoles = await prisma.userRole.findMany({
      where: { user_id: ctx.user.id },
      include: { role: true },
    })

    const hasPermission = userRoles.some((ur) => {
      const permissions = ur.role.permissions as Permission[]
      return permissions.some(
        (p) => p.modulo === modulo && p.acoes[acao] === true
      )
    })

    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Sem permissão para esta ação',
      })
    }

    return next()
  })
}

export function requireRoles(allowedTypes: Array<'ADMIN' | 'FUNCIONARIO' | 'JOGADOR'>) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    if (ctx.user.isSuperAdmin) return next()

    if (!allowedTypes.includes(ctx.user.tipo)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Sem permissão para esta ação',
      })
    }

    return next()
  })
}
