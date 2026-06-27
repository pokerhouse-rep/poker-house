import { z } from 'zod'

export const createTournamentSchema = z.object({
  nome: z.string().min(2),
  template_id: z.string().uuid().optional(),
  buyin_valor: z.number().positive(),
  rake_valor: z.number().min(0).default(0),
  chip_dealer_valor: z.number().min(0).default(0),
  starting_stack: z.number().int().positive(),
  garantido_ativo: z.boolean().default(false),
  garantido_valor: z.number().positive().optional(),
  late_registration_ativo: z.boolean().default(false),
  late_registration_ate_nivel: z.number().int().positive().optional(),
  rebuy_ativo: z.boolean().default(false),
  rebuy_condicao: z.enum(['BUST', 'ABAIXO_DE_X']).optional(),
  rebuy_condicao_valor: z.number().int().optional(),
  rebuy_maximo: z.number().int().optional(),
  rebuy_valor: z.number().positive().optional(),
  rebuy_fichas: z.number().int().positive().optional(),
  reentrada_ativa: z.boolean().default(false),
  reentrada_maxima: z.number().int().optional(),
  reentrada_valor: z.number().positive().optional(),
  reentrada_fichas: z.number().int().positive().optional(),
  addon_ativo: z.boolean().default(false),
  addon_valor: z.number().positive().optional(),
  addon_fichas: z.number().int().positive().optional(),
  multiday: z.boolean().default(false),
  ranking_ids: z.array(z.string().uuid()).default([]),
  ranking_peso: z.number().int().min(1).default(1),
  blind_structure_id: z.string().uuid(),
  data_inicio: z.coerce.date().optional(),
})

export const registerEntrySchema = z.object({
  tournament_id: z.string().uuid(),
  jogador_id: z.string().uuid(),
  forma_pagamento: z.enum([
    'DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO',
    'TRANSFERENCIA', 'CARTEIRA',
  ]),
})

export const registerOnlineEntrySchema = z.object({
  tournament_id: z.string().uuid(),
  forma_pagamento: z.enum(['CARTEIRA', 'PIX']),
})

export const confirmPrizesSchema = z.object({
  tournament_id: z.string().uuid(),
  prizes: z.array(
    z.object({
      posicao: z.number().int().positive(),
      valor: z.number().positive(),
      percentual: z.number().optional(),
    })
  ),
})

export const registerDealSchema = z.object({
  tournament_id: z.string().uuid(),
  deal: z.record(z.string().uuid(), z.number().positive()),
})

export const chipCountSchema = z.object({
  tournament_id: z.string().uuid(),
  chipcounts: z.array(
    z.object({
      entry_id: z.string().uuid(),
      stack: z.number().int().min(0),
    })
  ),
})

export const balanceMovesSchema = z.object({
  tournament_id: z.string().uuid(),
  moves: z.array(
    z.object({
      entry_id: z.string().uuid(),
      mesa: z.number().int(),
      assento: z.number().int(),
    })
  ),
})

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>
