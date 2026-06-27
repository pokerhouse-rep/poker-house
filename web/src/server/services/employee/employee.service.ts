import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { hashPassword } from '@/lib/auth/password'

type CreateEmployeeInput = {
  nome: string
  email: string
  cpf: string
  telefone: string
  senha: string
  data_nascimento: string
  role_ids: string[]
}

type UpdateEmployeeInput = {
  id: string
  nome?: string
  email?: string
  telefone?: string
}

export async function createEmployee(
  organizationId: string,
  input: CreateEmployeeInput
) {
  const cpf = input.cpf.replace(/\D/g, '')

  const existingCpf = await prisma.user.findUnique({
    where: { organization_id_cpf: { organization_id: organizationId, cpf } },
  })

  if (existingCpf) {
    throw new TRPCError({ code: 'CONFLICT', message: 'CPF já cadastrado' })
  }

  const existingEmail = await prisma.user.findUnique({
    where: { organization_id_email: { organization_id: organizationId, email: input.email } },
  })

  if (existingEmail) {
    throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já cadastrado' })
  }

  const roles = await prisma.role.findMany({
    where: { id: { in: input.role_ids }, organization_id: organizationId },
  })

  if (roles.length !== input.role_ids.length) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Um ou mais perfis não encontrados' })
  }

  const senhaHash = await hashPassword(input.senha)

  return prisma.$transaction(async (tx) => {
    const employee = await tx.user.create({
      data: {
        organization_id: organizationId,
        tipo: 'FUNCIONARIO',
        nome: input.nome,
        email: input.email,
        cpf,
        telefone: input.telefone,
        senha_hash: senhaHash,
        data_nascimento: new Date(input.data_nascimento),
      },
    })

    await tx.userRole.createMany({
      data: input.role_ids.map((roleId) => ({
        user_id: employee.id,
        role_id: roleId,
      })),
    })

    return employee
  })
}

export async function updateEmployee(
  organizationId: string,
  input: UpdateEmployeeInput
) {
  const employee = await prisma.user.findFirst({
    where: { id: input.id, organization_id: organizationId, tipo: 'FUNCIONARIO' },
  })

  if (!employee) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Funcionário não encontrado' })
  }

  const { id, ...data } = input

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: {
        organization_id: organizationId,
        email: data.email,
        id: { not: id },
      },
    })
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'E-mail já em uso' })
    }
  }

  return prisma.user.update({ where: { id }, data })
}

export async function listEmployees(
  organizationId: string,
  params: {
    search?: string
    status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'
    role?: string
    page: number
    limit: number
  }
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    tipo: 'FUNCIONARIO',
  }

  if (params.status) where.status = params.status

  if (params.search) {
    where.OR = [
      { nome: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  if (params.role) {
    where.user_roles = { some: { role: { nome: params.role } } }
  }

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        status: true,
        created_at: true,
        ultimo_acesso: true,
        user_roles: {
          include: { role: { select: { id: true, nome: true } } },
        },
      },
      orderBy: { nome: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ])

  return { employees, total }
}

export async function getEmployeeById(organizationId: string, id: string) {
  const employee = await prisma.user.findFirst({
    where: { id, organization_id: organizationId, tipo: 'FUNCIONARIO' },
    include: {
      user_roles: { include: { role: true } },
    },
  })

  if (!employee) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  return employee
}

export async function deactivateEmployee(organizationId: string, id: string) {
  const employee = await prisma.user.findFirst({
    where: { id, organization_id: organizationId, tipo: 'FUNCIONARIO' },
  })

  if (!employee) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  return prisma.user.update({
    where: { id },
    data: { status: 'INATIVO' },
  })
}

export async function activateEmployee(organizationId: string, id: string) {
  return prisma.user.update({
    where: { id },
    data: { status: 'ATIVO', tentativas_login: 0, bloqueado_ate: null },
  })
}

export async function assignRole(userId: string, roleId: string) {
  const existing = await prisma.userRole.findUnique({
    where: { user_id_role_id: { user_id: userId, role_id: roleId } },
  })

  if (existing) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Perfil já atribuído' })
  }

  return prisma.userRole.create({
    data: { user_id: userId, role_id: roleId },
  })
}

export async function revokeRole(userId: string, roleId: string) {
  return prisma.userRole.delete({
    where: { user_id_role_id: { user_id: userId, role_id: roleId } },
  })
}
