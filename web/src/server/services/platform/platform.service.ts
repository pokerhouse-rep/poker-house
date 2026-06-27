import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { DEFAULT_ROLES } from '@/lib/auth/default-roles'

type CreateOrgInput = {
  cnpj: string
  razao_social: string
  nome_fantasia: string
  email: string
  telefone?: string
  admin: {
    nome: string
    email: string
    cpf: string
    telefone: string
    senha: string
    data_nascimento: string
  }
}

export async function createOrganization(input: CreateOrgInput) {
  const senhaHash = await hashPassword(input.admin.senha)

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        cnpj: input.cnpj,
        razao_social: input.razao_social,
        nome_fantasia: input.nome_fantasia,
        email: input.email,
        telefone: input.telefone,
      },
    })

    const createdRoles = await Promise.all(
      DEFAULT_ROLES.map((role) =>
        tx.role.create({
          data: {
            organization_id: org.id,
            nome: role.nome,
            descricao: role.descricao,
            permissions: role.permissions,
            is_system: true,
          },
        })
      )
    )

    const adminRole = createdRoles.find((r) => r.nome === 'Admin')!

    const adminUser = await tx.user.create({
      data: {
        organization_id: org.id,
        tipo: 'ADMIN',
        nome: input.admin.nome,
        email: input.admin.email,
        cpf: input.admin.cpf.replace(/\D/g, ''),
        telefone: input.admin.telefone,
        senha_hash: senhaHash,
        data_nascimento: new Date(input.admin.data_nascimento),
      },
    })

    await tx.userRole.create({
      data: {
        user_id: adminUser.id,
        role_id: adminRole.id,
      },
    })

    return {
      organization: org,
      adminUser: {
        id: adminUser.id,
        nome: adminUser.nome,
        email: adminUser.email,
      },
      roles: createdRoles.map((r) => ({ id: r.id, nome: r.nome })),
    }
  })
}
