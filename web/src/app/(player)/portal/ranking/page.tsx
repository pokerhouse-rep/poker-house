'use client'

import { useState } from 'react'
import { Medal, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export default function RankingPlayerPage() {
  const [selectedRanking, setSelectedRanking] = useState<string | null>(null)

  const { data, isLoading } = trpc.ranking.list.useQuery({ status: 'ATIVO', page: 1, limit: 20 })
  const { data: detail } = trpc.ranking.getById.useQuery(
    { id: selectedRanking! }, { enabled: !!selectedRanking }
  )

  const rankings = data?.rankings || []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Ranking</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />)}
        </div>
      ) : rankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
          <Medal size={40} className="text-zinc-700" />
          <p className="mt-3 text-zinc-500">Nenhum ranking ativo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankings.map((r) => (
            <button key={r.id}
              onClick={() => setSelectedRanking(selectedRanking === r.id ? null : r.id)}
              className={`w-full text-left rounded-lg border bg-zinc-900 p-3 transition-colors ${
                selectedRanking === r.id ? 'border-emerald-600' : 'border-zinc-800'
              }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">{r.nome}</h3>
                <Badge className="bg-emerald-500/10 text-emerald-400">{r.tipo}</Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(r.periodo_inicio).toLocaleDateString('pt-BR')} — {new Date(r.periodo_fim).toLocaleDateString('pt-BR')}
                · {r._count.standings} classificados
              </p>
            </button>
          ))}
        </div>
      )}

      {detail && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-300">Classificação — {detail.nome}</h2>
          {detail.standings.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500 text-sm">
              Nenhum jogador classificado
            </div>
          ) : (
            <div className="space-y-1">
              {detail.standings.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 text-right ${
                      s.posicao <= 3 ? 'text-amber-400' : 'text-zinc-500'
                    }`}>#{s.posicao}</span>
                    <div>
                      <p className="text-sm text-white">
                        {s.jogador.nome}
                        {s.jogador.nickname && <span className="ml-1 text-zinc-500">({s.jogador.nickname})</span>}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {s.torneios_jogados} torneios · {s.vitorias}V · {s.itm_count} ITM
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{s.pontos_total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
