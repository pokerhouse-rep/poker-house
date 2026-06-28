'use client'

import { useState } from 'react'
import {
  DollarSign, TrendingUp, TrendingDown, Landmark,
  ArrowDownCircle, ArrowUpCircle, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const categoriaColors: Record<string, string> = {
  BUYIN: 'bg-blue-500/10 text-blue-400',
  REBUY: 'bg-amber-500/10 text-amber-400',
  ADDON: 'bg-purple-500/10 text-purple-400',
  REENTRADA: 'bg-blue-500/10 text-blue-400',
  RAKE: 'bg-emerald-500/10 text-emerald-400',
  CHIP_DEALER: 'bg-zinc-500/10 text-zinc-400',
  PREMIO: 'bg-amber-500/10 text-amber-400',
  BAR: 'bg-orange-500/10 text-orange-400',
  DEPOSITO: 'bg-emerald-500/10 text-emerald-400',
  SAQUE: 'bg-red-500/10 text-red-400',
  SANGRIA: 'bg-red-500/10 text-red-400',
  SUPRIMENTO: 'bg-emerald-500/10 text-emerald-400',
}

export default function FinanceiroPage() {
  const { toasts } = useToast()
  const [page, setPage] = useState(1)
  const [tipoFilter, setTipoFilter] = useState<'CREDITO' | 'DEBITO' | ''>('')
  const [categoriaFilter, setCategoriaFilter] = useState('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: summary } = trpc.ledger.getDailySummary.useQuery({ dia_operacional: today })
  const { data, isLoading } = trpc.ledger.list.useQuery({
    tipo: tipoFilter || undefined,
    categoria: categoriaFilter || undefined,
    page,
    limit: 30,
  })

  const transactions = data?.transactions || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader title="Financeiro" description="Ledger — todas as transações" />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Entradas Hoje"
          value={`R$ ${(summary?.total_receitas || 0).toFixed(2)}`}
          icon={TrendingUp} color="emerald" />
        <KpiCard title="Saídas Hoje"
          value={`R$ ${(summary?.total_despesas || 0).toFixed(2)}`}
          icon={TrendingDown} color="red" />
        <KpiCard title="Resultado"
          value={`R$ ${(summary?.resultado || 0).toFixed(2)}`}
          icon={DollarSign} color="blue" />
        <KpiCard title="Rake Hoje"
          value={`R$ ${(summary?.receitas?.find((r) => r.categoria === 'RAKE')?.valor || 0).toFixed(2)}`}
          icon={Landmark} color="purple" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-zinc-500" />
        {['', 'CREDITO', 'DEBITO'].map((t) => (
          <Button key={t} variant="ghost" size="sm"
            className={`text-xs ${tipoFilter === t ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setTipoFilter(t as typeof tipoFilter); setPage(1) }}>
            {t === '' ? 'Todos' : t === 'CREDITO' ? 'Entradas' : 'Saídas'}
          </Button>
        ))}
        <div className="h-6 w-px bg-zinc-800 mx-1" />
        {['', 'BUYIN', 'REBUY', 'RAKE', 'PREMIO', 'BAR', 'SANGRIA', 'SUPRIMENTO'].map((c) => (
          <Button key={c} variant="ghost" size="sm"
            className={`text-xs ${categoriaFilter === c ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setCategoriaFilter(c); setPage(1) }}>
            {c || 'Todas Categorias'}
          </Button>
        ))}
      </div>

      {/* Transações */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center text-zinc-500">
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-1.5 ${
                    tx.tipo === 'CREDITO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {tx.tipo === 'CREDITO' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={categoriaColors[tx.categoria] || 'bg-zinc-500/10 text-zinc-400'}>
                        {tx.categoria}
                      </Badge>
                      {tx.jogador && (
                        <span className="text-sm text-zinc-300">{tx.jogador.nome}</span>
                      )}
                    </div>
                    {tx.descricao && <p className="text-xs text-zinc-500 mt-0.5">{tx.descricao}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.tipo === 'CREDITO' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.tipo === 'CREDITO' ? '+' : '-'} R$ {Number(tx.valor).toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {new Date(tx.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {data && data.total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="text-zinc-400">Anterior</Button>
          <span className="text-sm text-zinc-500 py-1">Página {page} de {Math.ceil(data.total / 30)}</span>
          <Button variant="ghost" size="sm" disabled={transactions.length < 30} onClick={() => setPage(page + 1)}
            className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
