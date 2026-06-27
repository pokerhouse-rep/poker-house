import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { hashPassword } from '@/lib/auth/password'
import type { CreatePlayerInput, UpdatePlayerInput } from '@/lib/validators/player'

function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export async function createPlayer(
  organizationId: string,
  input: CreatePlayerInput
) {
  const cpf = cleanCpf(input.cpf)

  const existing = await prisma.user.findUnique({
    where: { organization_id_cpf: { organization_id: organizationId, cpf } },
  })

  if (existing) {
    throw new TRPCError({ code: 'CONFLICT', message: 'CPF já cadastrado nesta casa' })
  }

  const senhaHash = input.senha
    ? await hashPassword(input.senha)
    : await hashPassword(cpf.slice(0, 6))

  const player = await prisma.user.create({
    data: {
      organization_id: organizationId,
      tipo: 'JOGADOR',
      cpf,
      nome: input.nome,
      telefone: input.telefone,
      email: input.email,
      data_nascimento: new Date(input.data_nascimento),
      endereco: input.endereco ? JSON.parse(JSON.stringify(input.endereco)) : undefined,
      nickname: input.nickname,
      senha_hash: senhaHash,
    },
  })

  await prisma.wallet.create({
    data: {
      organization_id: organizationId,
      jogador_id: player.id,
    },
  })

  return player
}

export async function updatePlayer(
  organizationId: string,
  input: UpdatePlayerInput
) {
  const player = await prisma.user.findFirst({
    where: { id: input.id, organization_id: organizationId },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Jogador não encontrado' })
  }

  const { id, ...data } = input

  return prisma.user.update({
    where: { id },
    data: {
      ...data,
      endereco: data.endereco ? JSON.parse(JSON.stringify(data.endereco)) : undefined,
    },
  })
}

export async function getPlayerById(organizationId: string, id: string) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId },
    include: {
      wallet: true,
      user_roles: { include: { role: { select: { nome: true } } } },
    },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Jogador não encontrado' })
  }

  return player
}

export async function listPlayers(
  organizationId: string,
  params: {
    search?: string
    status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'
    tags?: string[]
    page: number
    limit: number
  }
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    tipo: 'JOGADOR',
  }

  if (params.status) where.status = params.status

  if (params.tags && params.tags.length > 0) {
    where.tags = { hasSome: params.tags }
  }

  if (params.search) {
    where.OR = [
      { nome: { contains: params.search, mode: 'insensitive' } },
      { cpf: { contains: params.search.replace(/\D/g, '') } },
      { nickname: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  const [players, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        nickname: true,
        cpf: true,
        telefone: true,
        email: true,
        status: true,
        tags: true,
        foto_url: true,
        created_at: true,
        ultimo_acesso: true,
        wallet: {
          select: {
            saldo_disponivel: true,
            saldo_bonus: true,
            saldo_rakeback: true,
            saldo_premiacoes: true,
            saldo_promocional: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ])

  return { players, total }
}

export async function searchPlayers(organizationId: string, term: string) {
  return prisma.user.findMany({
    where: {
      organization_id: organizationId,
      tipo: 'JOGADOR',
      status: 'ATIVO',
      OR: [
        { nome: { contains: term, mode: 'insensitive' } },
        { cpf: { contains: term.replace(/\D/g, '') } },
        { nickname: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      nome: true,
      nickname: true,
      cpf: true,
      foto_url: true,
    },
    take: 10,
    orderBy: { nome: 'asc' },
  })
}

export async function blockPlayer(
  organizationId: string,
  id: string,
  motivo: string
) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId, tipo: 'JOGADOR' },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Jogador não encontrado' })
  }

  return prisma.user.update({
    where: { id },
    data: {
      status: 'BLOQUEADO',
      observacoes_internas: player.observacoes_internas
        ? `${player.observacoes_internas}\n[BLOQUEIO] ${motivo}`
        : `[BLOQUEIO] ${motivo}`,
    },
  })
}

export async function unblockPlayer(organizationId: string, id: string) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId, tipo: 'JOGADOR' },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Jogador não encontrado' })
  }

  return prisma.user.update({
    where: { id },
    data: { status: 'ATIVO', bloqueado_ate: null, tentativas_login: 0 },
  })
}

export async function setPlayerPassword(
  organizationId: string,
  id: string,
  senha: string
) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId, tipo: 'JOGADOR' },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Jogador não encontrado' })
  }

  const senhaHash = await hashPassword(senha)

  return prisma.user.update({
    where: { id },
    data: { senha_hash: senhaHash },
  })
}

export async function addTag(organizationId: string, id: string, tag: string) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  if (player.tags.includes(tag)) return player

  return prisma.user.update({
    where: { id },
    data: { tags: { push: tag } },
  })
}

export async function removeTag(organizationId: string, id: string, tag: string) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  return prisma.user.update({
    where: { id },
    data: { tags: player.tags.filter((t) => t !== tag) },
  })
}

export async function deletePlayer(organizationId: string, id: string) {
  const player = await prisma.user.findFirst({
    where: { id, organization_id: organizationId, tipo: 'JOGADOR' },
    include: {
      accounts: { where: { status: 'ABERTA' } },
      wallet: true,
    },
  })

  if (!player) {
    throw new TRPCError({ code: 'NOT_FOUND' })
  }

  if (player.accounts.length > 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Jogador possui contas em aberto. Feche antes de excluir.',
    })
  }

  if (player.wallet) {
    const saldoTotal =
      Number(player.wallet.saldo_disponivel) +
      Number(player.wallet.saldo_bonus) +
      Number(player.wallet.saldo_rakeback) +
      Number(player.wallet.saldo_premiacoes) +
      Number(player.wallet.saldo_promocional)

    if (saldoTotal > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Jogador possui saldo na carteira. Faça o saque antes de excluir.',
      })
    }
  }

  const hash = id.slice(0, 8)

  return prisma.user.update({
    where: { id },
    data: {
      nome: `Jogador Removido #${hash}`,
      cpf: `00000000${hash}`,
      email: null,
      telefone: '0000000000',
      endereco: { set: null } as never,
      data_nascimento: new Date('1900-01-01'),
      foto_url: null,
      nickname: null,
      observacoes_internas: null,
      tags: [],
      status: 'INATIVO',
      senha_hash: 'DELETED',
    },
  })
}

export async function getPlayerStats(organizationId: string, jogadorId: string) {
  const [tournamentEntries, cashSessions] = await Promise.all([
    prisma.tournamentEntry.findMany({
      where: {
        jogador_id: jogadorId,
        tournament: { organization_id: organizationId },
        posicao_final: { not: null },
      },
      select: {
        posicao_final: true,
        tournament: {
          select: { total_inscritos: true, buyin_valor: true, rake_valor: true },
        },
      },
    }),
    prisma.cashSession.findMany({
      where: {
        jogador_id: jogadorId,
        cash_table: { organization_id: organizationId },
        status: 'FINALIZADA',
      },
      select: { buyin_total: true, cashout_total: true, resultado: true },
    }),
  ])

  const torneiosJogados = tournamentEntries.length
  const itmCount = tournamentEntries.filter(
    (e) => e.posicao_final && e.tournament.total_inscritos > 0 &&
      e.posicao_final <= Math.ceil(e.tournament.total_inscritos * 0.15)
  ).length
  const mesasFinais = tournamentEntries.filter(
    (e) => e.posicao_final && e.posicao_final <= 9
  ).length
  const vitorias = tournamentEntries.filter(
    (e) => e.posicao_final === 1
  ).length

  const totalInvestidoTorneios = tournamentEntries.reduce(
    (sum, e) => sum + Number(e.tournament.buyin_valor) + Number(e.tournament.rake_valor),
    0
  )

  const cashResultado = cashSessions.reduce(
    (sum, s) => sum + Number(s.resultado),
    0
  )

  const cashSessoesJogadas = cashSessions.length

  const itm = torneiosJogados > 0 ? (itmCount / torneiosJogados) * 100 : 0

  return {
    torneios_jogados: torneiosJogados,
    itm_count: itmCount,
    itm_percentual: Math.round(itm * 100) / 100,
    mesas_finais: mesasFinais,
    vitorias,
    total_investido_torneios: totalInvestidoTorneios,
    cash_sessoes: cashSessoesJogadas,
    cash_resultado: cashResultado,
  }
}
