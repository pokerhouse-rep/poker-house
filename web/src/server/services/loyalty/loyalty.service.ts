import { prisma } from '@/lib/prisma'
import { creditToWallet } from '../wallet/wallet.service'
import { Prisma } from '@/generated/prisma/client'

export async function listPrograms(organizationId: string) {
  return prisma.loyaltyProgram.findMany({
    where: { organization_id: organizationId },
    include: { _count: { select: { progress: true } } },
    orderBy: { created_at: 'desc' },
  })
}

export async function createProgram(
  organizationId: string,
  input: { nome: string; regras: unknown }
) {
  return prisma.loyaltyProgram.create({
    data: {
      organization_id: organizationId,
      nome: input.nome,
      regras: JSON.parse(JSON.stringify(input.regras)),
    },
  })
}

export async function updateProgram(
  id: string,
  input: { nome?: string; regras?: unknown; status?: 'ATIVO' | 'INATIVO' }
) {
  return prisma.loyaltyProgram.update({
    where: { id },
    data: {
      nome: input.nome,
      regras: input.regras ? JSON.parse(JSON.stringify(input.regras)) : undefined,
      status: input.status,
    },
  })
}

export async function getProgress(
  params: { program_id?: string; jogador_id?: string }
) {
  const where: Record<string, unknown> = {}
  if (params.program_id) where.program_id = params.program_id
  if (params.jogador_id) where.jogador_id = params.jogador_id

  return prisma.loyaltyProgress.findMany({
    where,
    include: {
      program: { select: { nome: true, status: true } },
      jogador: { select: { id: true, nome: true, nickname: true } },
    },
  })
}

export async function updateProgress(
  programId: string,
  jogadorId: string,
  increment: number
) {
  const progress = await prisma.loyaltyProgress.findUnique({
    where: { program_id_jogador_id: { program_id: programId, jogador_id: jogadorId } },
    include: { program: true },
  })

  if (!progress) return null
  if (progress.completado) return progress

  const novoProgresso = progress.progresso_atual + increment

  if (novoProgresso >= progress.meta) {
    return prisma.loyaltyProgress.update({
      where: { program_id_jogador_id: { program_id: programId, jogador_id: jogadorId } },
      data: {
        progresso_atual: novoProgresso,
        completado: true,
        completado_em: new Date(),
      },
    })
  }

  return prisma.loyaltyProgress.update({
    where: { program_id_jogador_id: { program_id: programId, jogador_id: jogadorId } },
    data: { progresso_atual: novoProgresso },
  })
}

export async function creditPrize(
  organizationId: string,
  programId: string,
  jogadorId: string,
  funcionarioId: string,
  valor: number
) {
  const transaction = await creditToWallet({
    organization_id: organizationId,
    jogador_id: jogadorId,
    funcionario_id: funcionarioId,
    valor,
    saldo_tipo: 'BONUS',
    categoria: 'FIDELIDADE',
    referencia_tipo: 'FIDELIDADE',
    referencia_id: programId,
    descricao: 'Prêmio programa de fidelidade',
  })

  await prisma.loyaltyProgress.update({
    where: { program_id_jogador_id: { program_id: programId, jogador_id: jogadorId } },
    data: { premio_creditado: true, transaction_id: transaction.id },
  })

  return transaction
}
