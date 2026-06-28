'use client'

import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { DollarSign, TrendingUp, TrendingDown, Landmark } from 'lucide-react'

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Visão geral do financeiro" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Receitas Hoje" value="R$ 0,00" icon={TrendingUp} color="emerald" />
        <KpiCard title="Despesas Hoje" value="R$ 0,00" icon={TrendingDown} color="red" />
        <KpiCard title="Resultado" value="R$ 0,00" icon={DollarSign} color="blue" />
        <KpiCard title="Rake Total" value="R$ 0,00" icon={Landmark} color="purple" />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500">
        Transações do Ledger aparecerão aqui quando houver movimentação.
      </div>
    </div>
  )
}
