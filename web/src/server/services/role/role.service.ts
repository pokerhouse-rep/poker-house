import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

type CreateRoleInput = {
  nome: string
  descricao?: string
  permissions: Array<{ modulo: string; acoes: Record<string, boolean> }>
}

export async function listRoles(organizationId: string) {
  return prisma.role.findMany({
    where: { organization_id: organizationId },
    include: {
      _count: { select: { user_roles: true } },
    },
    orderBy: { nome: 'asc' },
  })
}

export async function getRoleById(organizationId: string, id: string) {
  const role = await prisma.role.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      user_roles: {
        include: { user: { select: { id: true, nome: true, email: true, tipo: true } } },
      },
    },
  })

  if (!role) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  return role
}

export async function createRole(
  organizationId: string,
  input: CreateRoleInput
) {
  const existing = await prisma.role.findUnique({
    where: { organization_id_nome: { organization_id: organizationId, nome: input.nome } },
  })

  if (existing) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Já existe um perfil com este nome' })
  }

  return prisma.role.create({
    data: {
      organization_id: organizationId,
      nome: input.nome,
      descricao: input.descricao,
      permissions: JSON.parse(JSON.stringify(input.permissions)),
    },
  })
}

export async function updateRole(
  organizationId: string,
  id: string,
  input: Partial<CreateRoleInput>
) {
  const role = await prisma.role.findFirst({
    where: { id, organization_id: organizationId },
  })

  if (!role) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  if (role.is_system) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Perfis do sistema não podem ser editados',
    })
  }

  return prisma.role.update({
    where: { id },
    data: {
      nome: input.nome,
      descricao: input.descricao,
      permissions: input.permissions
        ? JSON.parse(JSON.stringify(input.permissions))
        : undefined,
    },
  })
}

export async function deleteRole(organizationId: string, id: string) {
  const role = await prisma.role.findFirst({
    where: { id, organization_id: organizationId },
    include: { _count: { select: { user_roles: true } } },
  })

  if (!role) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  if (role.is_system) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Perfis do sistema não podem ser excluídos',
    })
  }

  if (role._count.user_roles > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Perfil possui usuários vinculados. Remova-os antes de excluir.',
    })
  }

  return prisma.role.delete({ where: { id } })
}
