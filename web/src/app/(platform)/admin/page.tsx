'use client'

import { Building2, Users, Trophy } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/components/shared/kpi-card'
import { trpc } from '@/lib/trpc/client'

export default function PlatformDashboard() {
  const { data, isLoading } = trpc.platform.getDashboard.useQuery()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Painel da Plataforma</h1>
        <p className="text-sm text-zinc-500">Visão geral de todas as organizações</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />)}
        </div>
      ) : data && (
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Organizações Ativas" value={data.total_orgs} icon={Building2} color="emerald" />
          <KpiCard title="Total de Jogadores" value={data.total_players} icon={Users} color="blue" />
          <KpiCard title="Torneios Criados" value={data.total_tournaments} icon={Trophy} color="amber" />
        </div>
      )}
    </div>
  )
}
