import { prisma } from '@/lib/prisma'

export async function getAll(organizationId: string) {
  return prisma.orgConfig.findMany({
    where: { organization_id: organizationId },
    orderBy: { chave: 'asc' },
  })
}

export async function get(organizationId: string, chave: string) {
  return prisma.orgConfig.findUnique({
    where: { organization_id_chave: { organization_id: organizationId, chave } },
  })
}

export async function set(organizationId: string, chave: string, valor: unknown) {
  return prisma.orgConfig.upsert({
    where: { organization_id_chave: { organization_id: organizationId, chave } },
    update: { valor: JSON.parse(JSON.stringify(valor)) },
    create: {
      organization_id: organizationId,
      chave,
      valor: JSON.parse(JSON.stringify(valor)),
    },
  })
}

export async function setBulk(
  organizationId: string,
  configs: Array<{ chave: string; valor: unknown }>
) {
  return Promise.all(
    configs.map((c) => set(organizationId, c.chave, c.valor))
  )
}
