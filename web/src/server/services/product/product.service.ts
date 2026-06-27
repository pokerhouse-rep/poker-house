import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@/generated/prisma/client'

export async function listProducts(
  organizationId: string,
  params: { categoria_id?: string; status?: string; search?: string }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.categoria_id) where.categoria_id = params.categoria_id
  if (params.status) where.status = params.status
  if (params.search) where.nome = { contains: params.search, mode: 'insensitive' }

  return prisma.product.findMany({
    where,
    include: { categoria: { select: { nome: true } } },
    orderBy: { nome: 'asc' },
  })
}

export async function createProduct(
  organizationId: string,
  input: { nome: string; categoria_id: string; preco: number }
) {
  return prisma.product.create({
    data: {
      organization_id: organizationId,
      nome: input.nome,
      categoria_id: input.categoria_id,
      preco: new Prisma.Decimal(input.preco),
    },
  })
}

export async function updateProduct(
  id: string,
  input: { nome?: string; preco?: number; status?: 'ATIVO' | 'INATIVO' }
) {
  return prisma.product.update({
    where: { id },
    data: {
      nome: input.nome,
      preco: input.preco ? new Prisma.Decimal(input.preco) : undefined,
      status: input.status,
    },
  })
}

export async function listCategories(organizationId: string) {
  return prisma.productCategory.findMany({
    where: { organization_id: organizationId },
    include: { _count: { select: { products: true } } },
    orderBy: { ordem: 'asc' },
  })
}

export async function createCategory(organizationId: string, nome: string) {
  const maxOrdem = await prisma.productCategory.aggregate({
    where: { organization_id: organizationId },
    _max: { ordem: true },
  })

  return prisma.productCategory.create({
    data: {
      organization_id: organizationId,
      nome,
      ordem: (maxOrdem._max.ordem || 0) + 1,
    },
  })
}

export async function updateCategory(id: string, input: { nome?: string; ordem?: number }) {
  return prisma.productCategory.update({ where: { id }, data: input })
}

export async function deleteCategory(organizationId: string, id: string) {
  const products = await prisma.product.count({ where: { categoria_id: id } })
  if (products > 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Categoria possui produtos vinculados' })
  }
  return prisma.productCategory.delete({ where: { id } })
}
