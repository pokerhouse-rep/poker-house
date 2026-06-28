'use client'

import { useState } from 'react'
import { DollarSign, Calculator, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export default function RakebackPage() {
  const { toasts, success, error } = useToast()
  const [page, setPage] = useState(1)
  const [showCalcForm, setShowCalcForm] = useState(false)
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.rakeback.getHistory.useQuery({ page, limit: 30 })

  const calcMutation = trpc.rakeback.calculate.useMutation({
    onSuccess: (result) => {
      success(`Rakeback calculado! ${result.length} jogadores`)
      setShowCalcForm(false)
    },
    onError: (e) => error(e.message),
  })
  const creditMutation = trpc.rakeback.credit.useMutation({
    onSuccess: () => { success('Rakeback creditado!'); utils.rakeback.getHistory.invalidate() },
    onError: (e) => error(e.message),
  })

  const transactions = data?.transactions || []
  const totalCreditado = transactions.reduce((s, t) => s + Number(t.valor), 0)

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Rakeback"
        description="Cálculo e distribuição de rakeback"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCalcForm(!showCalcForm)}>
            <Calculator size={16} className="mr-2" /> Calcular Rakeback
          </Button>
        }
      />

      {showCalcForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Calcular Rakeback do Período</h3>
          <form onSubmit={(e) => {
            e.preventDefault()
            calcMutation.mutate({
              periodo_inicio: new Date(periodoInicio),
              periodo_fim: new Date(periodoFim),
            })
          }} className="flex gap-3 items-end">
            <div>
              <Label className="text-zinc-400">De</Label>
              <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
            </div>
            <div>
              <Label className="text-zinc-400">Até</Label>
              <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={calcMutation.isPending}>
              {calcMutation.isPending ? 'Calculando...' : 'Calcular'}
            </Button>
          </form>

          {calcMutation.data && calcMutation.data.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs text-zinc-500 uppercase">Resultado — {calcMutation.data.length} jogadores</h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-zinc-800 rounded border border-zinc-800">
                {calcMutation.data.map((r) => (
                  <div key={r.jogador_id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-white">{r.jogador_id.slice(0, 8)}...</span>
                    <span className="text-sm text-emerald-400">R$ {r.rakeback_valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700"
                onClick={() => creditMutation.mutate({
                  jogadores_rakeback: calcMutation.data!.map((r) => ({
                    jogador_id: r.jogador_id, valor: r.rakeback_valor,
                  })),
                })}
                disabled={creditMutation.isPending}>
                <CreditCard size={14} className="mr-2" />
                {creditMutation.isPending ? 'Creditando...' : 'Creditar Rakeback para Todos'}
              </Button>
            </div>
          )}
        </div>
      )}

      <h3 className="text-sm font-medium text-zinc-300">Histórico de Rakeback</h3>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <DollarSign size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum rakeback registrado</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white">{tx.jogador?.nome}</p>
                  {tx.descricao && <p className="text-xs text-zinc-500">{tx.descricao}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-400">R$ {Number(tx.valor).toFixed(2)}</p>
                  <p className="text-xs text-zinc-600">
                    {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-zinc-400">Anterior</Button>
          <span className="text-sm text-zinc-500 py-1">Página {page}</span>
          <Button variant="ghost" size="sm" disabled={transactions.length < 30} onClick={() => setPage(page + 1)} className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
