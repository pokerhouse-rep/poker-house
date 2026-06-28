'use client'

import { trpc } from '@/lib/trpc/client'
import { KpiCard } from '@/components/shared/kpi-card'
import {
  DollarSign, Users, Trophy, Spade, CreditCard,
  AlertCircle, TrendingUp, MapPin,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function DashboardPage() {
  const { data, isLoading } = trpc.dashboard.admin.useQuery()

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  const { kpis, torneios, mesas } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-zinc-500">Visão geral da operação</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Receita do Dia" value={formatCurrency(kpis.receita_dia)} icon={DollarSign} color="emerald" />
        <KpiCard title="Rake do Dia" value={formatCurrency(kpis.rake_dia)} icon={TrendingUp} color="blue" />
        <KpiCard title="Presentes Agora" value={kpis.presentes} icon={MapPin} color="purple" />
        <KpiCard title="Jogadores Ativos" value={kpis.jogadores_ativos} icon={Users} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Torneios Ativos" value={kpis.torneios_ativos} icon={Trophy} color="emerald" />
        <KpiCard title="Mesas de Cash" value={kpis.cash_abertas} icon={Spade} color="blue" />
        <KpiCard title="Contas em Aberto" value={kpis.contas_abertas} icon={AlertCircle} color="red" />
        <KpiCard title="Caixa" value={formatCurrency(kpis.receita_dia)} icon={CreditCard} color="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Torneios em Andamento</h2>
          {torneios.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-600">Nenhum torneio ativo</p>
          ) : (
            <div className="space-y-3">
              {torneios.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{t.nome}</p>
                    <p className="text-xs text-zinc-500">{t.nivel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-400">{formatCurrency(t.prize_pool)}</p>
                    <p className="text-xs text-zinc-500">{t.jogadores} jogadores</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Mesas de Cash</h2>
          {mesas.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-600">Nenhuma mesa aberta</p>
          ) : (
            <div className="space-y-3">
              {mesas.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{m.nome}</p>
                    <p className="text-xs text-zinc-500">{m.modalidade} · {m.stakes} · {m.rake}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${m.jogadores >= m.max ? 'text-red-400' : 'text-emerald-400'}`}>
                      {m.jogadores}/{m.max}
                    </p>
                    {m.waitlist > 0 && <p className="text-xs text-amber-400">{m.waitlist} na fila</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
