'use client'

import { Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const statusColors: Record<string, string> = {
  INSCRICOES_ABERTAS: 'bg-blue-500/10 text-blue-400',
  EM_ANDAMENTO: 'bg-emerald-500/10 text-emerald-400',
}
const statusLabels: Record<string, string> = {
  INSCRICOES_ABERTAS: 'Inscrições Abertas',
  EM_ANDAMENTO: 'Em Andamento',
}

export default function MeusTorneiosPage() {
  const { data: available, isLoading } = trpc.tournament.getAvailable.useQuery()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Torneios</h1>

      <h2 className="text-sm font-medium text-zinc-400">Torneios Disponíveis</h2>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />)}
        </div>
      ) : !available || available.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
          <Trophy size={40} className="text-zinc-700" />
          <p className="mt-3 text-zinc-500">Nenhum torneio disponível</p>
        </div>
      ) : (
        <div className="space-y-2">
          {available.map((t) => (
            <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">{t.nome}</h3>
                <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs">Buy-in</p>
                  <p className="text-white">R$ {Number(t.buyin_valor).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Prize Pool</p>
                  <p className="text-emerald-400">R$ {Number(t.prize_pool).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Inscritos</p>
                  <p className="text-white">{t.total_inscritos}</p>
                </div>
                {t.garantido_ativo && t.garantido_valor && (
                  <div>
                    <p className="text-zinc-500 text-xs">Garantido</p>
                    <p className="text-amber-400">R$ {Number(t.garantido_valor).toFixed(2)}</p>
                  </div>
                )}
              </div>
              {t.late_registration_ativo && (
                <p className="mt-2 text-xs text-blue-400">Late registration aberto</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
