import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import { createTransaction } from '../ledger/ledger.service'
import { addItem } from '../account/account.service'
import { eventBus, Events } from '@/server/events/event-bus'
import { Prisma } from '@/generated/prisma/client'

export async function openTab(
  organizationId: string,
  jogadorId: string,
  isAcompanhante: boolean = false
) {
  const existing = await prisma.tab.findFirst({
    where: {
      organization_id: organizationId,
      jogador_id: jogadorId,
      status: 'ABERTA',
    },
  })

  if (existing) return existing

  return prisma.tab.create({
    data: {
      organization_id: organizationId,
      jogador_id: jogadorId,
      is_acompanhante: isAcompanhante,
      dia_operacional: new Date(),
    },
  })
}

export async function addTabItem(params: {
  organization_id: string
  tab_id: string
  produto_id: string
  quantidade: number
  funcionario_id: string
  caixa_id?: string
}) {
  const [tab, produto] = await Promise.all([
    prisma.tab.findFirst({
      where: { id: params.tab_id, organization_id: params.organization_id, status: 'ABERTA' },
    }),
    prisma.product.findFirst({
      where: { id: params.produto_id, organization_id: params.organization_id, status: 'ATIVO' },
    }),
  ])

  if (!tab) throw new TRPCError({ code: 'NOT_FOUND', message: 'Comanda não encontrada ou fechada' })
  if (!produto) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' })

  const valorTotal = Number(produto.preco) * params.quantidade

  return prisma.$transaction(async (tx) => {
    const barCaixa = params.caixa_id || await getBarCaixaId(params.organization_id)

    const transaction = await createTransaction({
      organization_id: params.organization_id,
      tipo: 'DEBITO',
      categoria: 'BAR',
      valor: valorTotal,
      jogador_id: tab.jogador_id,
      funcionario_id: params.funcionario_id,
      referencia_tipo: 'BAR',
      referencia_id: params.tab_id,
      caixa_id: barCaixa,
      descricao: `${produto.nome} x${params.quantidade}`,
      dia_operacional: new Date(),
    }, tx)

    const tabItem = await tx.tabItem.create({
      data: {
        tab_id: params.tab_id,
        produto_id: params.produto_id,
        quantidade: params.quantidade,
        valor_unitario: produto.preco,
        valor_total: new Prisma.Decimal(valorTotal),
        transaction_id: transaction.id,
      },
    })

    await tx.tab.update({
      where: { id: params.tab_id },
      data: { total: { increment: new Prisma.Decimal(valorTotal) } },
    })

    await addItem({
      organization_id: params.organization_id,
      jogador_id: tab.jogador_id,
      tipo: 'BAR',
      descricao: `${produto.nome} x${params.quantidade}`,
      valor: valorTotal,
      transaction_id: transaction.id,
      tx,
    })

    return { tabItem, transaction }
  }).then((result) => {
    eventBus.emit(Events.TAB_ITEM_ADDED, {
      tab_id: params.tab_id,
      item: result.tabItem,
      jogador_id: tab.jogador_id,
    })
    return result
  })
}

async function getBarCaixaId(organizationId: string): Promise<string | undefined> {
  const caixa = await prisma.cashRegister.findFirst({
    where: { organization_id: organizationId, tipo: 'BAR', status: 'ABERTO' },
    select: { id: true },
  })
  return caixa?.id
}

export async function closeTab(tabId: string) {
  return prisma.tab.update({
    where: { id: tabId },
    data: { status: 'FECHADA', fechada_em: new Date() },
  })
}

export async function getOpenTab(organizationId: string, jogadorId: string) {
  return prisma.tab.findFirst({
    where: { organization_id: organizationId, jogador_id: jogadorId, status: 'ABERTA' },
    include: {
      items: {
        include: { produto: { select: { nome: true, categoria: { select: { nome: true } } } } },
        orderBy: { created_at: 'desc' },
      },
    },
  })
}

export async function listOpenTabs(
  organizationId: string,
  params: { dia_operacional?: Date; page: number; limit: number }
) {
  const where: Record<string, unknown> = {
    organization_id: organizationId,
    status: 'ABERTA',
  }
  if (params.dia_operacional) where.dia_operacional = params.dia_operacional

  const [tabs, total] = await Promise.all([
    prisma.tab.findMany({
      where,
      include: {
        jogador: { select: { id: true, nome: true, nickname: true } },
        items: { include: { produto: { select: { nome: true } } } },
      },
      orderBy: { aberta_em: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.tab.count({ where }),
  ])

  return { tabs, total }
}
