'use client'

import { Spade } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export default function MeuCashPage() {
  const { data, isLoading } = trpc.cashTable.list.useQuery({ page: 1, limit: 50 })

  const openTables = data?.tables.filter((t) => ['ABERTA', 'CHEIA'].includes(t.status)) || []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Cash Game</h1>

      <h2 className="text-sm font-medium text-zinc-400">Mesas Abertas</h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />)}
        </div>
      ) : openTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
          <Spade size={40} className="text-zinc-700" />
          <p className="mt-3 text-zinc-500">Nenhuma mesa aberta</p>
        </div>
      ) : (
        <div className="space-y-2">
          {openTables.map((t) => (
            <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">{t.nome}</h3>
                <Badge className={t.status === 'CHEIA' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}>
                  {t.status === 'CHEIA' ? 'Cheia' : 'Aberta'}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{t.modalidade} · {t.stakes}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  Jogadores: {t._count.sessions}/{t.max_jogadores}
                </span>
                <span className="text-zinc-500 text-xs">
                  Buy-in R$ {Number(t.buyin_minimo).toFixed(0)}–{Number(t.buyin_maximo).toFixed(0)}
                </span>
              </div>
              {t.waitlist.length > 0 && (
                <p className="mt-1 text-xs text-amber-400">{t.waitlist.length} na lista de espera</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
