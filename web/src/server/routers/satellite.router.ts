import { z } from 'zod'
import { router, protectedProcedure, adminProcedure } from '../trpc'
import * as satelliteService from '../services/satellite/satellite.service'

export const satelliteRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(({ ctx, input }) => satelliteService.listSatellites(ctx.organizationId, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => satelliteService.getSatellite(ctx.organizationId, input.id)),

  create: adminProcedure
    .input(z.object({
      nome: z.string().min(1),
      buyin_valor: z.number().positive(),
      rake_valor: z.number().min(0).optional(),
      chip_dealer_valor: z.number().min(0).optional(),
      starting_stack: z.number().int().positive(),
      blind_structure_id: z.string().uuid(),
      torneio_alvo_ids: z.array(z.string().uuid()).min(1),
      rebuy_ativo: z.boolean().optional(),
      rebuy_maximo: z.number().int().optional(),
      rebuy_valor: z.number().optional(),
      rebuy_fichas: z.number().int().optional(),
      reentrada_ativa: z.boolean().optional(),
      reentrada_maxima: z.number().int().optional(),
      reentrada_valor: z.number().optional(),
      reentrada_fichas: z.number().int().optional(),
      addon_ativo: z.boolean().optional(),
      addon_valor: z.number().optional(),
      addon_fichas: z.number().int().optional(),
      late_registration_ativo: z.boolean().optional(),
      late_registration_ate_nivel: z.number().int().optional(),
      saldo_excedente_pago: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => satelliteService.createSatellite(ctx.organizationId, input)),

  openRegistration: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => satelliteService.updateStatus(ctx.organizationId, input.id, 'INSCRICOES_ABERTAS')),

  start: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => satelliteService.updateStatus(ctx.organizationId, input.id, 'EM_ANDAMENTO')),

  finish: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => satelliteService.updateStatus(ctx.organizationId, input.id, 'FINALIZADO')),

  cancel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => satelliteService.updateStatus(ctx.organizationId, input.id, 'CANCELADO')),
})
