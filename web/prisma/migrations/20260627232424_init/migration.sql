-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ATIVA', 'SUSPENSA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ATIVA', 'ATRASADA', 'SUSPENSA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "UserTipo" AS ENUM ('ADMIN', 'FUNCIONARIO', 'JOGADOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ABERTA', 'FECHADA');

-- CreateEnum
CREATE TYPE "AccountItemTipo" AS ENUM ('BUYIN', 'REBUY', 'ADDON', 'REENTRADA', 'BAR', 'CASH_COMPRA', 'CASH_VENDA', 'PREMIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "LedgerTipo" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "LedgerCategoria" AS ENUM ('BUYIN', 'REBUY', 'ADDON', 'REENTRADA', 'RAKE', 'CHIP_DEALER', 'PREMIO', 'BAR', 'DEPOSITO', 'SAQUE', 'RAKEBACK', 'BONUS', 'PROMOCIONAL', 'ESTORNO', 'AJUSTE', 'SANGRIA', 'SUPRIMENTO', 'PAGAMENTO', 'DEAL', 'OVERLAY', 'FIDELIDADE', 'CASH_COMPRA_FICHAS', 'CASH_VENDA_FICHAS', 'DEALER_TIP');

-- CreateEnum
CREATE TYPE "SaldoTipo" AS ENUM ('DISPONIVEL', 'PENDENTE', 'BLOQUEADO', 'PROMOCIONAL', 'BONUS', 'RAKEBACK', 'PREMIACOES');

-- CreateEnum
CREATE TYPE "ReferenciaTipo" AS ENUM ('TORNEIO', 'SATELITE', 'MESA_CASH', 'BAR', 'CARTEIRA', 'CAIXA', 'RANKING', 'FIDELIDADE', 'MANUAL');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'CARTEIRA');

-- CreateEnum
CREATE TYPE "CashRegisterTipo" AS ENUM ('TORNEIO', 'MESA_CASH', 'BAR', 'GERAL');

-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('RASCUNHO', 'INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RebuyCondicao" AS ENUM ('BUST', 'ABAIXO_DE_X');

-- CreateEnum
CREATE TYPE "TournamentDayStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "EntryTipo" AS ENUM ('INSCRICAO', 'REENTRADA', 'SATELITE');

-- CreateEnum
CREATE TYPE "EntryPaymentStatus" AS ENUM ('CONFIRMADO', 'PENDENTE_PIX', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ATIVO', 'UTILIZADO', 'TRANSFERIDO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "RakeTipo" AS ENUM ('POT_RAKE', 'TIME_RAKE');

-- CreateEnum
CREATE TYPE "CashTableStatus" AS ENUM ('FECHADA', 'ABERTA', 'CHEIA');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ATIVA', 'UTILIZADA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('ATIVA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "ChipTransactionTipo" AS ENUM ('COMPRA', 'VENDA');

-- CreateEnum
CREATE TYPE "TabStatus" AS ENUM ('ABERTA', 'FECHADA');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "RankingTipo" AS ENUM ('SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "RankingStatus" AS ENUM ('ATIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BUYIN', 'REBUY', 'ADDON', 'CONTA', 'PREMIO', 'PAGAMENTO', 'SALDO', 'INSCRICAO', 'RANKING', 'RAKEBACK', 'SISTEMA');

-- CreateEnum
CREATE TYPE "WhatsAppTipo" AS ENUM ('COBRANCA', 'CONTA_ENCERRADA', 'PREMIACAO', 'INSCRICAO', 'PAGAMENTO');

-- CreateEnum
CREATE TYPE "TemplateActiveStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('ENVIADO', 'FALHOU');

-- CreateEnum
CREATE TYPE "TemplateTipo" AS ENUM ('TORNEIO', 'BLIND_STRUCTURE', 'PREMIACAO', 'RANKING', 'CASH_GAME', 'MENSAGEM', 'RELATORIO', 'PRODUTO', 'CONFIGURACAO');

-- CreateEnum
CREATE TYPE "LoyaltyStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT NOT NULL,
    "endereco" JSONB,
    "telefone" TEXT,
    "email" TEXT NOT NULL,
    "logo_url" TEXT,
    "theme" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "status" "OrgStatus" NOT NULL DEFAULT 'ATIVA',
    "horario_funcionamento" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "plano" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ATIVA',
    "valor" DECIMAL(10,2) NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "proximo_vencimento" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tipo" "UserTipo" NOT NULL,
    "email" TEXT,
    "cpf" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nickname" TEXT,
    "telefone" TEXT NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "endereco" JSONB,
    "foto_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ATIVO',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "observacoes_internas" TEXT,
    "ultimo_acesso" TIMESTAMP(3),
    "tentativas_login" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "permissions" JSONB NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "saldo_disponivel" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_pendente" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_bloqueado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_promocional" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_bonus" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_rakeback" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_premiacoes" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ABERTA',
    "dia_operacional" DATE NOT NULL,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_pago" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "aberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_items" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "tipo" "AccountItemTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "valor_pago" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "transaction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "account_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tipo" "LedgerTipo" NOT NULL,
    "categoria" "LedgerCategoria" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "saldo_tipo" "SaldoTipo",
    "jogador_id" UUID,
    "funcionario_id" UUID NOT NULL,
    "referencia_tipo" "ReferenciaTipo" NOT NULL,
    "referencia_id" UUID NOT NULL,
    "caixa_id" UUID,
    "forma_pagamento" "FormaPagamento",
    "descricao" TEXT,
    "metadata" JSONB,
    "dia_operacional" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tipo" "CashRegisterTipo" NOT NULL,
    "referencia_id" UUID,
    "aberto_por_id" UUID NOT NULL,
    "fechado_por_id" UUID,
    "fundo_troco" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_esperado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valor_informado" DECIMAL(10,2),
    "diferenca" DECIMAL(10,2),
    "justificativa_diferenca" TEXT,
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'ABERTO',
    "aberto_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechado_em" TIMESTAMP(3),
    "dia_operacional" DATE NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "template_id" UUID,
    "nome" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'RASCUNHO',
    "buyin_valor" DECIMAL(10,2) NOT NULL,
    "rake_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "chip_dealer_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "starting_stack" INTEGER NOT NULL,
    "garantido_ativo" BOOLEAN NOT NULL DEFAULT false,
    "garantido_valor" DECIMAL(10,2),
    "late_registration_ativo" BOOLEAN NOT NULL DEFAULT false,
    "late_registration_ate_nivel" INTEGER,
    "rebuy_ativo" BOOLEAN NOT NULL DEFAULT false,
    "rebuy_condicao" "RebuyCondicao",
    "rebuy_condicao_valor" INTEGER,
    "rebuy_maximo" INTEGER,
    "rebuy_valor" DECIMAL(10,2),
    "rebuy_fichas" INTEGER,
    "reentrada_ativa" BOOLEAN NOT NULL DEFAULT false,
    "reentrada_maxima" INTEGER,
    "reentrada_valor" DECIMAL(10,2),
    "reentrada_fichas" INTEGER,
    "addon_ativo" BOOLEAN NOT NULL DEFAULT false,
    "addon_valor" DECIMAL(10,2),
    "addon_fichas" INTEGER,
    "multiday" BOOLEAN NOT NULL DEFAULT false,
    "ranking_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ranking_peso" INTEGER NOT NULL DEFAULT 1,
    "prize_pool" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overlay_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_inscritos" INTEGER NOT NULL DEFAULT 0,
    "total_rebuys" INTEGER NOT NULL DEFAULT 0,
    "total_reentradas" INTEGER NOT NULL DEFAULT 0,
    "total_addons" INTEGER NOT NULL DEFAULT 0,
    "blind_structure_id" UUID NOT NULL,
    "nivel_atual" INTEGER NOT NULL DEFAULT 0,
    "caixa_id" UUID,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_days" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "dia_label" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "status" "TournamentDayStatus" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_day_id" UUID,
    "jogador_id" UUID NOT NULL,
    "tipo" "EntryTipo" NOT NULL,
    "buyin_transaction_id" UUID,
    "mesa_numero" INTEGER,
    "assento_numero" INTEGER,
    "stack_atual" INTEGER,
    "melhor_stack" INTEGER,
    "classificado_dia2" BOOLEAN NOT NULL DEFAULT false,
    "posicao_final" INTEGER,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "eliminado_em" TIMESTAMP(3),
    "rebuys_realizados" INTEGER NOT NULL DEFAULT 0,
    "reentradas_realizadas" INTEGER NOT NULL DEFAULT 0,
    "addon_realizado" BOOLEAN NOT NULL DEFAULT false,
    "payment_status" "EntryPaymentStatus" NOT NULL DEFAULT 'CONFIRMADO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_rebuys" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "transaction_id" UUID,
    "fichas_recebidas" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_rebuys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_reentries" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "transaction_id" UUID,
    "novo_mesa_numero" INTEGER,
    "novo_assento_numero" INTEGER,
    "fichas_recebidas" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_reentries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_addons" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "transaction_id" UUID,
    "fichas_recebidas" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_prizes" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "posicao" INTEGER NOT NULL,
    "percentual" DECIMAL(5,2),
    "valor_fixo" DECIMAL(10,2),
    "valor_final" DECIMAL(10,2) NOT NULL,
    "jogador_id" UUID,
    "transaction_id" UUID,
    "is_deal" BOOLEAN NOT NULL DEFAULT false,
    "deal_valor" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_deals" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "jogadores_ids" UUID[],
    "valores_acordados" JSONB NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satellites" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'RASCUNHO',
    "buyin_valor" DECIMAL(10,2) NOT NULL,
    "rake_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "chip_dealer_valor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "starting_stack" INTEGER NOT NULL,
    "rebuy_ativo" BOOLEAN NOT NULL DEFAULT false,
    "rebuy_condicao" "RebuyCondicao",
    "rebuy_condicao_valor" INTEGER,
    "rebuy_maximo" INTEGER,
    "rebuy_valor" DECIMAL(10,2),
    "rebuy_fichas" INTEGER,
    "reentrada_ativa" BOOLEAN NOT NULL DEFAULT false,
    "reentrada_maxima" INTEGER,
    "reentrada_valor" DECIMAL(10,2),
    "reentrada_fichas" INTEGER,
    "addon_ativo" BOOLEAN NOT NULL DEFAULT false,
    "addon_valor" DECIMAL(10,2),
    "addon_fichas" INTEGER,
    "late_registration_ativo" BOOLEAN NOT NULL DEFAULT false,
    "late_registration_ate_nivel" INTEGER,
    "blind_structure_id" UUID NOT NULL,
    "torneio_alvo_ids" UUID[],
    "saldo_excedente_pago" BOOLEAN NOT NULL DEFAULT true,
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "satellites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satellite_tickets" (
    "id" UUID NOT NULL,
    "satellite_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "torneio_alvo_id" UUID NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ATIVO',
    "validade" TIMESTAMP(3),
    "transferido_para_id" UUID,
    "transferido_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "satellite_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_tables" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "stakes" TEXT NOT NULL,
    "blind_small" DECIMAL(10,2) NOT NULL,
    "blind_big" DECIMAL(10,2) NOT NULL,
    "buyin_minimo" DECIMAL(10,2) NOT NULL,
    "buyin_maximo" DECIMAL(10,2) NOT NULL,
    "max_jogadores" INTEGER NOT NULL DEFAULT 9,
    "rake_tipo" "RakeTipo" NOT NULL,
    "rake_percentual" DECIMAL(5,2),
    "rake_cap" DECIMAL(10,2),
    "rake_valor_hora" DECIMAL(10,2),
    "status" "CashTableStatus" NOT NULL DEFAULT 'FECHADA',
    "caixa_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_table_waitlists" (
    "id" UUID NOT NULL,
    "cash_table_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "posicao" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_table_waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_table_reservations" (
    "id" UUID NOT NULL,
    "cash_table_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "assento_numero" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ATIVA',
    "expira_em" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_table_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" UUID NOT NULL,
    "cash_table_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "assento_numero" INTEGER,
    "buyin_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cashout_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "resultado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rake_pago" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dealer_tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'ATIVA',
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fim" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_chip_transactions" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "tipo" "ChipTransactionTipo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "transaction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_chip_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_rake_entries" (
    "id" UUID NOT NULL,
    "cash_table_id" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "transaction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_rake_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "is_acompanhante" BOOLEAN NOT NULL DEFAULT false,
    "status" "TabStatus" NOT NULL DEFAULT 'ABERTA',
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_pago" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "dia_operacional" DATE NOT NULL,
    "aberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tab_items" (
    "id" UUID NOT NULL,
    "tab_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(10,2) NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "transaction_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tab_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria_id" UUID NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rankings" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "RankingTipo" NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fim" DATE NOT NULL,
    "status" "RankingStatus" NOT NULL DEFAULT 'ATIVO',
    "desempate_criterios" JSONB NOT NULL,
    "premios" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_point_structures" (
    "id" UUID NOT NULL,
    "ranking_id" UUID NOT NULL,
    "posicao" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_point_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_entries" (
    "id" UUID NOT NULL,
    "ranking_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "posicao_no_torneio" INTEGER NOT NULL,
    "peso_torneio" INTEGER NOT NULL,
    "pontos_base" INTEGER NOT NULL,
    "pontos_final" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_standings" (
    "id" UUID NOT NULL,
    "ranking_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "pontos_total" INTEGER NOT NULL,
    "posicao" INTEGER NOT NULL,
    "torneios_jogados" INTEGER NOT NULL,
    "itm_count" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranking_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blind_structures" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blind_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blind_levels" (
    "id" UUID NOT NULL,
    "structure_id" UUID NOT NULL,
    "nivel" INTEGER NOT NULL,
    "small_blind" INTEGER NOT NULL,
    "big_blind" INTEGER NOT NULL,
    "ante" INTEGER NOT NULL DEFAULT 0,
    "duracao_minutos" INTEGER NOT NULL,
    "is_break" BOOLEAN NOT NULL DEFAULT false,
    "break_duracao_minutos" INTEGER,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "blind_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "checkin_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkout_at" TIMESTAMP(3),
    "duracao_minutos" INTEGER,
    "dia_operacional" DATE NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tipo" "NotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "referencia_tipo" TEXT,
    "referencia_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "WhatsAppTipo" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "status" "TemplateActiveStatus" NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "telefone" TEXT NOT NULL,
    "mensagem_enviada" TEXT NOT NULL,
    "status" "WhatsAppStatus" NOT NULL,
    "enviado_por_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" UUID NOT NULL,
    "valores_antigos" JSONB,
    "valores_novos" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tipo" "TemplateTipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "is_favorito" BOOLEAN NOT NULL DEFAULT false,
    "is_padrao" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_configs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "status" "LoyaltyStatus" NOT NULL DEFAULT 'INATIVO',
    "regras" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_progress" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "jogador_id" UUID NOT NULL,
    "progresso_atual" INTEGER NOT NULL DEFAULT 0,
    "meta" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "completado_em" TIMESTAMP(3),
    "premio_creditado" BOOLEAN NOT NULL DEFAULT false,
    "transaction_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_key" ON "organizations"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organization_id_key" ON "subscriptions"("organization_id");

-- CreateIndex
CREATE INDEX "users_organization_id_status_idx" ON "users"("organization_id", "status");

-- CreateIndex
CREATE INDEX "users_organization_id_tipo_idx" ON "users"("organization_id", "tipo");

-- CreateIndex
CREATE INDEX "users_organization_id_nome_idx" ON "users"("organization_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_cpf_key" ON "users"("organization_id", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_email_key" ON "users"("organization_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organization_id_nome_key" ON "roles"("organization_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_jogador_id_key" ON "wallets"("jogador_id");

-- CreateIndex
CREATE INDEX "wallets_organization_id_idx" ON "wallets"("organization_id");

-- CreateIndex
CREATE INDEX "accounts_organization_id_jogador_id_idx" ON "accounts"("organization_id", "jogador_id");

-- CreateIndex
CREATE INDEX "accounts_organization_id_status_idx" ON "accounts"("organization_id", "status");

-- CreateIndex
CREATE INDEX "accounts_organization_id_dia_operacional_idx" ON "accounts"("organization_id", "dia_operacional");

-- CreateIndex
CREATE INDEX "account_items_account_id_idx" ON "account_items"("account_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_created_at_idx" ON "ledger_transactions"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_jogador_id_idx" ON "ledger_transactions"("organization_id", "jogador_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_categoria_idx" ON "ledger_transactions"("organization_id", "categoria");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_referencia_tipo_referen_idx" ON "ledger_transactions"("organization_id", "referencia_tipo", "referencia_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_dia_operacional_idx" ON "ledger_transactions"("organization_id", "dia_operacional");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_caixa_id_idx" ON "ledger_transactions"("organization_id", "caixa_id");

-- CreateIndex
CREATE INDEX "ledger_transactions_organization_id_saldo_tipo_jogador_id_idx" ON "ledger_transactions"("organization_id", "saldo_tipo", "jogador_id");

-- CreateIndex
CREATE INDEX "cash_registers_organization_id_status_idx" ON "cash_registers"("organization_id", "status");

-- CreateIndex
CREATE INDEX "cash_registers_organization_id_dia_operacional_idx" ON "cash_registers"("organization_id", "dia_operacional");

-- CreateIndex
CREATE INDEX "cash_registers_organization_id_tipo_idx" ON "cash_registers"("organization_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_caixa_id_key" ON "tournaments"("caixa_id");

-- CreateIndex
CREATE INDEX "tournaments_organization_id_status_idx" ON "tournaments"("organization_id", "status");

-- CreateIndex
CREATE INDEX "tournaments_organization_id_data_inicio_idx" ON "tournaments"("organization_id", "data_inicio");

-- CreateIndex
CREATE INDEX "tournaments_organization_id_created_at_idx" ON "tournaments"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "tournament_days_tournament_id_idx" ON "tournament_days"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_entries_tournament_id_jogador_id_idx" ON "tournament_entries"("tournament_id", "jogador_id");

-- CreateIndex
CREATE INDEX "tournament_entries_tournament_id_posicao_final_idx" ON "tournament_entries"("tournament_id", "posicao_final");

-- CreateIndex
CREATE INDEX "tournament_rebuys_entry_id_idx" ON "tournament_rebuys"("entry_id");

-- CreateIndex
CREATE INDEX "tournament_reentries_entry_id_idx" ON "tournament_reentries"("entry_id");

-- CreateIndex
CREATE INDEX "tournament_addons_entry_id_idx" ON "tournament_addons"("entry_id");

-- CreateIndex
CREATE INDEX "tournament_prizes_tournament_id_idx" ON "tournament_prizes"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_deals_tournament_id_idx" ON "tournament_deals"("tournament_id");

-- CreateIndex
CREATE INDEX "satellites_organization_id_status_idx" ON "satellites"("organization_id", "status");

-- CreateIndex
CREATE INDEX "satellite_tickets_satellite_id_idx" ON "satellite_tickets"("satellite_id");

-- CreateIndex
CREATE INDEX "satellite_tickets_jogador_id_idx" ON "satellite_tickets"("jogador_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_tables_caixa_id_key" ON "cash_tables"("caixa_id");

-- CreateIndex
CREATE INDEX "cash_tables_organization_id_status_idx" ON "cash_tables"("organization_id", "status");

-- CreateIndex
CREATE INDEX "cash_table_waitlists_cash_table_id_posicao_idx" ON "cash_table_waitlists"("cash_table_id", "posicao");

-- CreateIndex
CREATE UNIQUE INDEX "cash_table_waitlists_cash_table_id_jogador_id_key" ON "cash_table_waitlists"("cash_table_id", "jogador_id");

-- CreateIndex
CREATE INDEX "cash_table_reservations_cash_table_id_idx" ON "cash_table_reservations"("cash_table_id");

-- CreateIndex
CREATE INDEX "cash_sessions_cash_table_id_status_idx" ON "cash_sessions"("cash_table_id", "status");

-- CreateIndex
CREATE INDEX "cash_sessions_jogador_id_idx" ON "cash_sessions"("jogador_id");

-- CreateIndex
CREATE INDEX "cash_chip_transactions_session_id_idx" ON "cash_chip_transactions"("session_id");

-- CreateIndex
CREATE INDEX "cash_rake_entries_cash_table_id_idx" ON "cash_rake_entries"("cash_table_id");

-- CreateIndex
CREATE INDEX "tabs_organization_id_jogador_id_idx" ON "tabs"("organization_id", "jogador_id");

-- CreateIndex
CREATE INDEX "tabs_organization_id_status_idx" ON "tabs"("organization_id", "status");

-- CreateIndex
CREATE INDEX "tabs_organization_id_dia_operacional_idx" ON "tabs"("organization_id", "dia_operacional");

-- CreateIndex
CREATE INDEX "tab_items_tab_id_idx" ON "tab_items"("tab_id");

-- CreateIndex
CREATE INDEX "products_organization_id_categoria_id_idx" ON "products"("organization_id", "categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_organization_id_nome_key" ON "product_categories"("organization_id", "nome");

-- CreateIndex
CREATE INDEX "rankings_organization_id_status_idx" ON "rankings"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_point_structures_ranking_id_posicao_key" ON "ranking_point_structures"("ranking_id", "posicao");

-- CreateIndex
CREATE INDEX "ranking_entries_ranking_id_jogador_id_idx" ON "ranking_entries"("ranking_id", "jogador_id");

-- CreateIndex
CREATE INDEX "ranking_entries_ranking_id_tournament_id_idx" ON "ranking_entries"("ranking_id", "tournament_id");

-- CreateIndex
CREATE INDEX "ranking_standings_ranking_id_posicao_idx" ON "ranking_standings"("ranking_id", "posicao");

-- CreateIndex
CREATE UNIQUE INDEX "ranking_standings_ranking_id_jogador_id_key" ON "ranking_standings"("ranking_id", "jogador_id");

-- CreateIndex
CREATE INDEX "blind_structures_organization_id_idx" ON "blind_structures"("organization_id");

-- CreateIndex
CREATE INDEX "blind_levels_structure_id_ordem_idx" ON "blind_levels"("structure_id", "ordem");

-- CreateIndex
CREATE INDEX "presences_organization_id_jogador_id_idx" ON "presences"("organization_id", "jogador_id");

-- CreateIndex
CREATE INDEX "presences_organization_id_dia_operacional_idx" ON "presences"("organization_id", "dia_operacional");

-- CreateIndex
CREATE INDEX "notifications_organization_id_user_id_lida_idx" ON "notifications"("organization_id", "user_id", "lida");

-- CreateIndex
CREATE INDEX "notifications_organization_id_created_at_idx" ON "notifications"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_templates_organization_id_nome_key" ON "whatsapp_templates"("organization_id", "nome");

-- CreateIndex
CREATE INDEX "whatsapp_logs_organization_id_created_at_idx" ON "whatsapp_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_user_id_idx" ON "audit_logs"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entidade_entidade_id_idx" ON "audit_logs"("organization_id", "entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "templates_organization_id_tipo_idx" ON "templates"("organization_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "org_configs_organization_id_chave_key" ON "org_configs"("organization_id", "chave");

-- CreateIndex
CREATE INDEX "loyalty_programs_organization_id_status_idx" ON "loyalty_programs"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_progress_program_id_jogador_id_key" ON "loyalty_progress"("program_id", "jogador_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_items" ADD CONSTRAINT "account_items_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_funcionario_id_fkey" FOREIGN KEY ("funcionario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_aberto_por_id_fkey" FOREIGN KEY ("aberto_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_fechado_por_id_fkey" FOREIGN KEY ("fechado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_blind_structure_id_fkey" FOREIGN KEY ("blind_structure_id") REFERENCES "blind_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_days" ADD CONSTRAINT "tournament_days_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_day_id_fkey" FOREIGN KEY ("tournament_day_id") REFERENCES "tournament_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_rebuys" ADD CONSTRAINT "tournament_rebuys_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_reentries" ADD CONSTRAINT "tournament_reentries_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_addons" ADD CONSTRAINT "tournament_addons_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_prizes" ADD CONSTRAINT "tournament_prizes_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_deals" ADD CONSTRAINT "tournament_deals_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_deals" ADD CONSTRAINT "tournament_deals_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellites" ADD CONSTRAINT "satellites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellites" ADD CONSTRAINT "satellites_blind_structure_id_fkey" FOREIGN KEY ("blind_structure_id") REFERENCES "blind_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellite_tickets" ADD CONSTRAINT "satellite_tickets_satellite_id_fkey" FOREIGN KEY ("satellite_id") REFERENCES "satellites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellite_tickets" ADD CONSTRAINT "satellite_tickets_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellite_tickets" ADD CONSTRAINT "satellite_tickets_torneio_alvo_id_fkey" FOREIGN KEY ("torneio_alvo_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "satellite_tickets" ADD CONSTRAINT "satellite_tickets_transferido_para_id_fkey" FOREIGN KEY ("transferido_para_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_tables" ADD CONSTRAINT "cash_tables_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_table_waitlists" ADD CONSTRAINT "cash_table_waitlists_cash_table_id_fkey" FOREIGN KEY ("cash_table_id") REFERENCES "cash_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_table_reservations" ADD CONSTRAINT "cash_table_reservations_cash_table_id_fkey" FOREIGN KEY ("cash_table_id") REFERENCES "cash_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_cash_table_id_fkey" FOREIGN KEY ("cash_table_id") REFERENCES "cash_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_chip_transactions" ADD CONSTRAINT "cash_chip_transactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cash_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_rake_entries" ADD CONSTRAINT "cash_rake_entries_cash_table_id_fkey" FOREIGN KEY ("cash_table_id") REFERENCES "cash_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_rake_entries" ADD CONSTRAINT "cash_rake_entries_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabs" ADD CONSTRAINT "tabs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tabs" ADD CONSTRAINT "tabs_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_items" ADD CONSTRAINT "tab_items_tab_id_fkey" FOREIGN KEY ("tab_id") REFERENCES "tabs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tab_items" ADD CONSTRAINT "tab_items_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_point_structures" ADD CONSTRAINT "ranking_point_structures_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_entries" ADD CONSTRAINT "ranking_entries_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_standings" ADD CONSTRAINT "ranking_standings_ranking_id_fkey" FOREIGN KEY ("ranking_id") REFERENCES "rankings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_standings" ADD CONSTRAINT "ranking_standings_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blind_structures" ADD CONSTRAINT "blind_structures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blind_levels" ADD CONSTRAINT "blind_levels_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "blind_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "whatsapp_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_configs" ADD CONSTRAINT "org_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_progress" ADD CONSTRAINT "loyalty_progress_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "loyalty_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_progress" ADD CONSTRAINT "loyalty_progress_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
