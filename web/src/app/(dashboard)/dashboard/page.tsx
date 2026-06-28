'use client'

import { KpiCard } from '@/components/shared/kpi-card'
import {
  DollarSign, Users, Trophy, Spade, CreditCard,
  AlertCircle, TrendingUp, MapPin,
} from 'lucide-react'

export default function DashboardPage() {
  // TODO: substituir por dados reais via tRPC
  const kpis = {
    receita_dia: 'R$ 12.450,00',
    jogadores_ativos: 47,
    torneios_ativos: 2,
    cash_abertas: 3,
    contas_abertas: 8,
    caixa_geral: 'R$ 34.200,00',
    presentes: 52,
    rake_dia: 'R$ 3.840,00',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500">Visão geral da operação</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Receita do Dia"
          value={kpis.receita_dia}
          icon={DollarSign}
          color="emerald"
        />
        <KpiCard
          title="Rake do Dia"
          value={kpis.rake_dia}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          title="Presentes Agora"
          value={kpis.presentes}
          subtitle={`${kpis.jogadores_ativos} jogando`}
          icon={MapPin}
          color="purple"
        />
        <KpiCard
          title="Caixa Geral"
          value={kpis.caixa_geral}
          icon={CreditCard}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Torneios Ativos"
          value={kpis.torneios_ativos}
          icon={Trophy}
          color="emerald"
        />
        <KpiCard
          title="Mesas de Cash"
          value={kpis.cash_abertas}
          subtitle="abertas"
          icon={Spade}
          color="blue"
        />
        <KpiCard
          title="Jogadores Ativos"
          value={kpis.jogadores_ativos}
          icon={Users}
          color="purple"
        />
        <KpiCard
          title="Contas em Aberto"
          value={kpis.contas_abertas}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Torneios em Andamento</h2>
          <div className="space-y-3">
            <TournamentCard
              nome="NL Hold'em R$150"
              jogadores={42}
              nivel="Nível 8 - 400/800"
              prizePool="R$ 6.300"
              status="Em andamento"
            />
            <TournamentCard
              nome="PLO R$200"
              jogadores={18}
              nivel="Nível 3 - 100/200"
              prizePool="R$ 3.600"
              status="Late Registration"
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Mesas de Cash Abertas</h2>
          <div className="space-y-3">
            <CashCard nome="Mesa 1 - NL 2/5" jogadores={9} max={9} rake="Pot Rake 5%" />
            <CashCard nome="Mesa 2 - NL 5/10" jogadores={6} max={9} rake="Pot Rake 5%" />
            <CashCard nome="Mesa 3 - PLO 2/5" jogadores={7} max={9} rake="Pot Rake 5%" />
          </div>
        </div>
      </div>
    </div>
  )
}

function TournamentCard({ nome, jogadores, nivel, prizePool, status }: {
  nome: string; jogadores: number; nivel: string; prizePool: string; status: string
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3">
      <div>
        <p className="text-sm font-medium text-white">{nome}</p>
        <p className="text-xs text-zinc-500">{nivel}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-emerald-400">{prizePool}</p>
        <p className="text-xs text-zinc-500">{jogadores} jogadores · {status}</p>
      </div>
    </div>
  )
}

function CashCard({ nome, jogadores, max, rake }: {
  nome: string; jogadores: number; max: number; rake: string
}) {
  const isFull = jogadores >= max
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3">
      <div>
        <p className="text-sm font-medium text-white">{nome}</p>
        <p className="text-xs text-zinc-500">{rake}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
          {jogadores}/{max}
        </p>
        <p className="text-xs text-zinc-500">{isFull ? 'Lotada' : 'Vagas'}</p>
      </div>
    </div>
  )
}
