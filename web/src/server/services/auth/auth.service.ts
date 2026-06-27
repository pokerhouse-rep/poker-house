import { TRPCError } from '@trpc/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken, verifyToken } from '@/lib/auth/jwt'
import type { LoginAdminInput, LoginPlayerInput, ChangePasswordInput } from '@/lib/validators/auth'

function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

async function buildTokens(user: {
  id: string
  organization_id: string
  tipo: 'ADMIN' | 'FUNCIONARIO' | 'JOGADOR'
}) {
  const userRoles = await prisma.userRole.findMany({
    where: { user_id: user.id },
    include: { role: true },
  })

  const roleNames = userRoles.map((ur) => ur.role.nome)

  const accessToken = signAccessToken({
    sub: user.id,
    org: user.organization_id,
    tipo: user.tipo,
    roles: roleNames,
  })

  const refreshToken = signRefreshToken(user.id)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ultimo_acesso: new Date(),
      tentativas_login: 0,
    },
  })

  return { accessToken, refreshToken, roles: roleNames }
}

export async function loginAdmin(input: LoginAdminInput) {
  const user = await prisma.user.findFirst({
    where: {
      email: input.email,
      tipo: { in: ['ADMIN', 'FUNCIONARIO'] },
    },
  })

  if (!user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Credenciais inválidas',
    })
  }

  if (user.status === 'BLOQUEADO') {
    if (user.bloqueado_ate && user.bloqueado_ate > new Date()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Conta bloqueada. Tente novamente mais tarde.',
      })
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ATIVO', tentativas_login: 0, bloqueado_ate: null },
    })
  }

  if (user.status === 'INATIVO') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Conta desativada. Contate o administrador.',
    })
  }

  const senhaCorreta = await verifyPassword(input.senha, user.senha_hash)

  if (!senhaCorreta) {
    const tentativas = user.tentativas_login + 1
    const updates: Record<string, unknown> = { tentativas_login: tentativas }

    if (tentativas >= 5) {
      updates.status = 'BLOQUEADO'
      updates.bloqueado_ate = new Date(Date.now() + 15 * 60 * 1000)
    }

    await prisma.user.update({ where: { id: user.id }, data: updates })

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Credenciais inválidas',
    })
  }

  const { accessToken, refreshToken, roles } = await buildTokens(user)

  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      organization_id: user.organization_id,
      roles,
    },
  }
}

export async function loginPlayer(input: LoginPlayerInput) {
  const cpf = cleanCpf(input.cpf)

  const whereClause: Record<string, unknown> = {
    cpf,
    tipo: 'JOGADOR' as const,
  }

  if (input.organization_id) {
    whereClause.organization_id = input.organization_id
  }

  const users = await prisma.user.findMany({ where: whereClause })

  if (users.length === 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Credenciais inválidas',
    })
  }

  if (users.length > 1 && !input.organization_id) {
    const orgs = await prisma.organization.findMany({
      where: { id: { in: users.map((u) => u.organization_id) }, status: 'ATIVA' },
      select: { id: true, nome_fantasia: true },
    })

    return {
      requireOrgSelection: true,
      organizations: orgs,
    }
  }

  const user = users[0]

  if (user.status === 'BLOQUEADO') {
    if (user.bloqueado_ate && user.bloqueado_ate > new Date()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Conta bloqueada. Tente novamente mais tarde.',
      })
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ATIVO', tentativas_login: 0, bloqueado_ate: null },
    })
  }

  if (user.status === 'INATIVO') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Conta desativada. Contate o administrador.',
    })
  }

  const senhaCorreta = await verifyPassword(input.senha, user.senha_hash)

  if (!senhaCorreta) {
    const tentativas = user.tentativas_login + 1
    const updates: Record<string, unknown> = { tentativas_login: tentativas }

    if (tentativas >= 5) {
      updates.status = 'BLOQUEADO'
      updates.bloqueado_ate = new Date(Date.now() + 15 * 60 * 1000)
    }

    await prisma.user.update({ where: { id: user.id }, data: updates })

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Credenciais inválidas',
    })
  }

  const { accessToken, refreshToken, roles } = await buildTokens(user)

  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      nome: user.nome,
      nickname: user.nickname,
      tipo: user.tipo,
      organization_id: user.organization_id,
      roles,
    },
  }
}

export async function refreshAccessToken(refreshTokenStr: string) {
  const payload = verifyToken(refreshTokenStr)

  if (!payload) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Token expirado',
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  })

  if (!user || user.status !== 'ATIVO') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Usuário inválido',
    })
  }

  const { accessToken, refreshToken } = await buildTokens(user)

  return { token: accessToken, refreshToken }
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Usuário não encontrado' })
  }

  const senhaCorreta = await verifyPassword(input.senha_atual, user.senha_hash)
  if (!senhaCorreta) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Senha atual incorreta',
    })
  }

  const erro = validatePasswordStrength(input.nova_senha)
  if (erro) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: erro })
  }

  const novaSenhaHash = await hashPassword(input.nova_senha)

  await prisma.user.update({
    where: { id: userId },
    data: { senha_hash: novaSenhaHash },
  })

  return { success: true }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      cpf: true,
      nickname: true,
      tipo: true,
      telefone: true,
      foto_url: true,
      organization_id: true,
      status: true,
      tags: true,
      user_roles: {
        include: {
          role: {
            select: { nome: true, permissions: true },
          },
        },
      },
    },
  })

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  return {
    ...user,
    roles: user.user_roles.map((ur) => ur.role.nome),
    permissions: user.user_roles.flatMap(
      (ur) => ur.role.permissions as Array<{ modulo: string; acoes: Record<string, boolean> }>
    ),
  }
}
