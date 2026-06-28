'use client'

import { useState } from 'react'
import {
  BarChart3, TrendingUp, Users, ShoppingCart, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

function getDateRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from, to }
}

export default function RelatoriosPage() {
  const { toasts } = useToast()
  const [periodo, setPeriodo] = useState(30)
  const range = getDateRange(periodo)

  const { data: financial, isLoading: loadingFinancial } = trpc.report.financialPeriod.useQuery({
    from: range.from, to: range.to,
  })
  const { data: topPlayers } = trpc.report.topRevenuePlayers.useQuery({
    from: range.from, to: range.to, limit: 10,
  })
  const { data: frequency } = trpc.report.playerFrequency.useQuery({
    from: range.from, to: range.to, limit: 10,
  })
  const { data: barSales } = trpc.report.barSales.useQuery({
    from: range.from, to: range.to,
  })
  const { data: overdue } = trpc.report.overdue.useQuery()

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader title="Relatórios" description="Análise do período" />

      <div className="flex gap-2">
        {[7, 15, 30, 60, 90].map((d) => (
          <Button key={d} variant="ghost" size="sm"
            className={`text-xs ${periodo === d ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => setPeriodo(d)}>
            {d} dias
          </Button>
        ))}
      </div>

      {loadingFinancial ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />)}
        </div>
      ) : financial && (
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Receita Total" value={`R$ ${financial.total_receitas.toFixed(2)}`} icon={TrendingUp} color="emerald" />
          <KpiCard title="Despesas" value={`R$ ${financial.total_despesas.toFixed(2)}`} icon={BarChart3} color="red" />
          <KpiCard title="Resultado" value={`R$ ${financial.resultado.toFixed(2)}`} icon={BarChart3} color="blue" />
          <KpiCard title="Inadimplentes" value={overdue?.total_inadimplentes || 0} icon={AlertTriangle} color="amber" />
        </div>
      )}

      <Tabs defaultValue="receita">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="receita">Por Categoria</TabsTrigger>
          <TabsTrigger value="topPlayers">Top Jogadores</TabsTrigger>
          <TabsTrigger value="frequencia">Frequência</TabsTrigger>
          <TabsTrigger value="bar">Vendas Bar</TabsTrigger>
          <TabsTrigger value="inadimplentes">Inadimplentes</TabsTrigger>
        </TabsList>

        <TabsContent value="receita">
          {financial && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Receitas por Categoria</h3>
                <div className="space-y-2">
                  {financial.receitas.map((r) => (
                    <div key={r.categoria} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{r.categoria}</span>
                      <span className="text-emerald-400">R$ {r.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Despesas por Categoria</h3>
                <div className="space-y-2">
                  {financial.despesas.map((d) => (
                    <div key={d.categoria} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{d.categoria}</span>
                      <span className="text-red-400">R$ {d.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="topPlayers">
          {!topPlayers || topPlayers.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">Sem dados no período</div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="divide-y divide-zinc-800">
                {topPlayers.map((p, i) => (
                  <div key={p.jogador?.id || i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-500 w-6 text-right">#{i + 1}</span>
                      <span className="text-sm text-white">{p.jogador?.nome || 'Desconhecido'}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-400">R$ {p.total_gasto.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="frequencia">
          {!frequency || frequency.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">Sem dados no período</div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="divide-y divide-zinc-800">
                {frequency.map((f, i) => (
                  <div key={f.jogador?.id || i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-500 w-6 text-right">#{i + 1}</span>
                      <span className="text-sm text-white">{f.jogador?.nome || 'Desconhecido'}</span>
                    </div>
                    <span className="text-sm text-blue-400">{f.visitas} presenças</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bar">
          {!barSales ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">Sem dados</div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <KpiCard title="Total Vendas" value={`R$ ${barSales.total.toFixed(2)}`} icon={ShoppingCart} color="emerald" />
                <KpiCard title="Produtos" value={barSales.vendas.length} icon={ShoppingCart} color="blue" />
              </div>
              {barSales.vendas.length > 0 && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900">
                  <div className="border-b border-zinc-800 px-4 py-3">
                    <h3 className="text-sm font-medium text-zinc-300">Vendas por Produto</h3>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {barSales.vendas.map((v) => (
                      <div key={v.produto} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm text-white">{v.produto}</span>
                        <div className="text-right">
                          <span className="text-sm text-emerald-400">R$ {v.valor_total.toFixed(2)}</span>
                          <span className="text-xs text-zinc-500 ml-2">({v.quantidade}x)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inadimplentes">
          {!overdue || overdue.jogadores_inadimplentes.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-emerald-400">
              Nenhum inadimplente!
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="divide-y divide-zinc-800">
                {overdue.jogadores_inadimplentes.map((o) => (
                  <div key={o.jogador.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-white">{o.jogador.nome}</p>
                      <p className="text-xs text-zinc-500">{o.dias_aberto} dias em aberto</p>
                    </div>
                    <span className="text-sm font-medium text-red-400">R$ {o.valor_devendo.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
