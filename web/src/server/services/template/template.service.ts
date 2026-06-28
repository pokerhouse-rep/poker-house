import { prisma } from '@/lib/prisma'
import type { TemplateTipo } from '@/generated/prisma/client'

export async function list(organizationId: string, tipo?: TemplateTipo) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (tipo) where.tipo = tipo

  return prisma.template.findMany({
    where,
    orderBy: [{ is_padrao: 'desc' }, { is_favorito: 'desc' }, { nome: 'asc' }],
  })
}

export async function getById(id: string) {
  return prisma.template.findUnique({ where: { id } })
}

export async function create(
  organizationId: string,
  input: { tipo: TemplateTipo; nome: string; dados: unknown }
) {
  return prisma.template.create({
    data: {
      organization_id: organizationId,
      tipo: input.tipo,
      nome: input.nome,
      dados: JSON.parse(JSON.stringify(input.dados)),
    },
  })
}

export async function update(id: string, input: { nome?: string; dados?: unknown }) {
  return prisma.template.update({
    where: { id },
    data: {
      nome: input.nome,
      dados: input.dados ? JSON.parse(JSON.stringify(input.dados)) : undefined,
    },
  })
}

export async function remove(id: string) {
  return prisma.template.delete({ where: { id } })
}

export async function duplicate(id: string, novoNome: string) {
  const original = await prisma.template.findUnique({ where: { id } })
  if (!original) throw new Error('Template não encontrado')

  return prisma.template.create({
    data: {
      organization_id: original.organization_id,
      tipo: original.tipo,
      nome: novoNome,
      dados: original.dados!,
    },
  })
}

export async function setDefault(organizationId: string, id: string) {
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) throw new Error('Template não encontrado')

  await prisma.template.updateMany({
    where: { organization_id: organizationId, tipo: template.tipo, is_padrao: true },
    data: { is_padrao: false },
  })

  return prisma.template.update({ where: { id }, data: { is_padrao: true } })
}

export async function setFavorite(id: string, isFavorito: boolean) {
  return prisma.template.update({ where: { id }, data: { is_favorito: isFavorito } })
}
