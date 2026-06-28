'use client'

import { useState } from 'react'
import { Trophy, Medal, Plus, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const statusColors: Record<string, string> = {
  ATIVO: 'bg-emerald-500/10 text-emerald-400',
  FINALIZADO: 'bg-purple-500/10 text-purple-400',
  CANCELADO: 'bg-red-500/10 text-red-400',
}

export default function RankingPage() {
  const { toasts, success, error } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRanking, setSelectedRanking] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [form, setForm] = useState({
    nome: '', tipo: 'SEMESTRAL' as 'SEMESTRAL' | 'ANUAL',
    periodo_inicio: '', periodo_fim: '',
  })
  const [pontuacao, setPontuacao] = useState([
    { posicao: 1, pontos: 100 }, { posicao: 2, pontos: 70 }, { posicao: 3, pontos: 50 },
    { posicao: 4, pontos: 40 }, { posicao: 5, pontos: 30 }, { posicao: 6, pontos: 25 },
    { posicao: 7, pontos: 20 }, { posicao: 8, pontos: 15 }, { posicao: 9, pontos: 10 },
    { posicao: 10, pontos: 5 },
  ])

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.ranking.list.useQuery({
    status: statusFilter || undefined, page: 1, limit: 50,
  })
  const { data: detail } = trpc.ranking.getById.useQuery(
    { id: selectedRanking! }, { enabled: !!selectedRanking }
  )

  const invalidate = () => utils.ranking.list.invalidate()

  const createMutation = trpc.ranking.create.useMutation({
    onSuccess: () => { success('Ranking criado!'); setShowCreateForm(false); invalidate() },
    onError: (e) => error(e.message),
  })
  const recalcMutation = trpc.ranking.recalculate.useMutation({
    onSuccess: () => {
      success('Classificação recalculada!')
      if (selectedRanking) utils.ranking.getById.invalidate({ id: selectedRanking })
    },
    onError: (e) => error(e.message),
  })

  const rankings = data?.rankings || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Ranking"
        description={data ? `${data.total} rankings` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Ranking
          </Button>
        }
      />

      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Criar Ranking</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              nome: form.nome, tipo: form.tipo,
              periodo_inicio: new Date(form.periodo_inicio),
              periodo_fim: new Date(form.periodo_fim),
              pontuacao, desempate: ['pontos_total', 'vitorias', 'itm_count'],
            })
          }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Ranking 1º Semestre 2026" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Tipo</Label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'SEMESTRAL' | 'ANUAL' })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                  <option value="SEMESTRAL">Semestral</option>
                  <option value="ANUAL">Anual</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400">Início *</Label>
                <Input type="date" value={form.periodo_inicio}
                  onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Fim *</Label>
                <Input type="date" value={form.periodo_fim}
                  onChange={(e) => setForm({ ...form, periodo_fim: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 mb-2 block">Pontuação por posição</Label>
              <div className="grid grid-cols-5 gap-2">
                {pontuacao.map((p, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs text-zinc-500 w-6">#{p.posicao}</span>
                    <Input type="number" value={p.pontos}
                      onChange={(e) => {
                        const np = [...pontuacao]
                        np[i] = { ...np[i], pontos: Number(e.target.value) }
                        setPontuacao(np)
                      }}
                      className="h-8 text-xs border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>Criar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {['', 'ATIVO', 'FINALIZADO'].map((s) => (
          <Button key={s} variant="ghost" size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => setStatusFilter(s)}>
            {s === '' ? 'Todos' : s === 'ATIVO' ? 'Ativos' : 'Finalizados'}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />)
          ) : rankings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
              <Trophy size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Nenhum ranking</p>
            </div>
          ) : (
            rankings.map((r) => (
              <div key={r.id} onClick={() => setSelectedRanking(r.id)}
                className={`cursor-pointer rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${
                  selectedRanking === r.id ? 'border-emerald-600' : 'border-zinc-800'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{r.nome}</h3>
                  <Badge className={statusColors[r.status]}>{r.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {r.tipo} · {new Date(r.periodo_inicio).toLocaleDateString('pt-BR')} — {new Date(r.periodo_fim).toLocaleDateString('pt-BR')}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{r._count.standings} jogadores classificados</p>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {!detail ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20">
              <Medal size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Selecione um ranking</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{detail.nome}</h2>
                    <p className="text-xs text-zinc-500">{detail.tipo} · {detail.standings.length} jogadores</p>
                  </div>
                  {detail.status === 'ATIVO' && (
                    <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300"
                      onClick={() => recalcMutation.mutate({ id: detail.id })} disabled={recalcMutation.isPending}>
                      Recalcular
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-medium text-zinc-300">Classificação</h3>
                </div>
                {detail.standings.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-sm">Nenhum jogador classificado</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {detail.standings.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold w-8 text-right ${
                            s.posicao <= 3 ? 'text-amber-400' : 'text-zinc-500'
                          }`}>#{s.posicao}</span>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {s.jogador.nome}
                              {s.jogador.nickname && <span className="ml-1 text-zinc-500">({s.jogador.nickname})</span>}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {s.torneios_jogados} torneios · {s.vitorias} vitórias · {s.itm_count} ITM
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-emerald-400">{s.pontos_total} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
