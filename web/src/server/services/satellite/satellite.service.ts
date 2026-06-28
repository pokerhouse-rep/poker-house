import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@/generated/prisma/client'

type CreateSatelliteInput = {
  nome: string
  buyin_valor: number
  rake_valor?: number
  chip_dealer_valor?: number
  starting_stack: number
  blind_structure_id: string
  torneio_alvo_ids: string[]
  rebuy_ativo?: boolean
  rebuy_maximo?: number
  rebuy_valor?: number
  rebuy_fichas?: number
  rebuy_condicao?: 'BUST' | 'ABAIXO_DE_X'
  reentrada_ativa?: boolean
  reentrada_maxima?: number
  reentrada_valor?: number
  reentrada_fichas?: number
  addon_ativo?: boolean
  addon_valor?: number
  addon_fichas?: number
  late_registration_ativo?: boolean
  late_registration_ate_nivel?: number
  saldo_excedente_pago?: boolean
}

export async function createSatellite(organizationId: string, input: CreateSatelliteInput) {
  return prisma.satellite.create({
    data: {
      organization_id: organizationId,
      nome: input.nome,
      buyin_valor: new Prisma.Decimal(input.buyin_valor),
      rake_valor: new Prisma.Decimal(input.rake_valor || 0),
      chip_dealer_valor: new Prisma.Decimal(input.chip_dealer_valor || 0),
      starting_stack: input.starting_stack,
      blind_structure_id: input.blind_structure_id,
      torneio_alvo_ids: input.torneio_alvo_ids,
      rebuy_ativo: input.rebuy_ativo || false,
      rebuy_maximo: input.rebuy_maximo,
      rebuy_valor: input.rebuy_valor ? new Prisma.Decimal(input.rebuy_valor) : null,
      rebuy_fichas: input.rebuy_fichas,
      rebuy_condicao: input.rebuy_condicao,
      reentrada_ativa: input.reentrada_ativa || false,
      reentrada_maxima: input.reentrada_maxima,
      reentrada_valor: input.reentrada_valor ? new Prisma.Decimal(input.reentrada_valor) : null,
      reentrada_fichas: input.reentrada_fichas,
      addon_ativo: input.addon_ativo || false,
      addon_valor: input.addon_valor ? new Prisma.Decimal(input.addon_valor) : null,
      addon_fichas: input.addon_fichas,
      late_registration_ativo: input.late_registration_ativo || false,
      late_registration_ate_nivel: input.late_registration_ate_nivel,
      saldo_excedente_pago: input.saldo_excedente_pago ?? true,
    },
  })
}

export async function listSatellites(
  organizationId: string,
  params: { status?: string; page: number; limit: number }
) {
  const where: Record<string, unknown> = { organization_id: organizationId }
  if (params.status) where.status = params.status

  const [satellites, total] = await Promise.all([
    prisma.satellite.findMany({
      where,
      include: {
        blind_structure: { select: { nome: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.satellite.count({ where }),
  ])

  return { satellites, total }
}

export async function getSatellite(organizationId: string, id: string) {
  const satellite = await prisma.satellite.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      blind_structure: { include: { levels: { orderBy: { ordem: 'asc' } } } },
      tickets: {
        include: { jogador: { select: { id: true, nome: true, nickname: true } } },
        orderBy: { created_at: 'desc' },
      },
    },
  })

  if (!satellite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Satélite não encontrado' })
  return satellite
}

export async function updateStatus(organizationId: string, id: string, status: string) {
  const satellite = await prisma.satellite.findFirst({
    where: { id, organization_id: organizationId },
  })
  if (!satellite) throw new TRPCError({ code: 'NOT_FOUND' })

  return prisma.satellite.update({
    where: { id },
    data: {
      status: status as never,
      ...(status === 'EM_ANDAMENTO' && !satellite.data_inicio ? { data_inicio: new Date() } : {}),
      ...(status === 'FINALIZADO' || status === 'CANCELADO' ? { data_fim: new Date() } : {}),
    },
  })
}
