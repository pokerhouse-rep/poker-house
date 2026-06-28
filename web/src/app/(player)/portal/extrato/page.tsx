'use client'

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export default function ExtratoPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = trpc.wallet.myStatement.useQuery({ page, limit: 30 })

  const transactions = data?.transactions || []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Extrato</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
          <FileText size={40} className="text-zinc-700" />
          <p className="mt-3 text-zinc-500">Nenhuma movimentação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-1.5 ${
                  tx.tipo === 'CREDITO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {tx.tipo === 'CREDITO' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                </div>
                <div>
                  <Badge className="bg-zinc-500/10 text-zinc-400 text-[10px]">{tx.categoria}</Badge>
                  {tx.descricao && <p className="text-xs text-zinc-500 mt-0.5">{tx.descricao}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${tx.tipo === 'CREDITO' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.tipo === 'CREDITO' ? '+' : '-'} R$ {Number(tx.valor).toFixed(2)}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-zinc-400">Anterior</Button>
          <span className="text-xs text-zinc-500 py-2">Página {page}</span>
          <Button variant="ghost" size="sm" disabled={transactions.length < 30} onClick={() => setPage(page + 1)} className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
