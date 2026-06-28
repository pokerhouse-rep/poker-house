'use client'

import { useState } from 'react'
import {
  Plus, Rocket, X, Play, Square, XCircle, CheckCircle, Ticket,
} from 'lucide-react'
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
  RASCUNHO: 'bg-zinc-500/10 text-zinc-400',
  INSCRICOES_ABERTAS: 'bg-blue-500/10 text-blue-400',
  EM_ANDAMENTO: 'bg-emerald-500/10 text-emerald-400',
  PAUSADO: 'bg-amber-500/10 text-amber-400',
  FINALIZADO: 'bg-purple-500/10 text-purple-400',
  CANCELADO: 'bg-red-500/10 text-red-400',
}
const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho', INSCRICOES_ABERTAS: 'Inscrições Abertas',
  EM_ANDAMENTO: 'Em Andamento', PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado',
}

export default function SatelitesPage() {
  const { toasts, success, error } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '', buyin_valor: '', rake_valor: '', starting_stack: '10000',
    blind_structure_id: '', torneio_alvo_ids: [] as string[],
  })

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.satellite.list.useQuery({
    status: statusFilter || undefined, page: 1, limit: 50,
  })
  const { data: blindStructures } = trpc.blindStructure.list.useQuery()
  const { data: tournaments } = trpc.tournament.getAvailable.useQuery()
  const { data: detail } = trpc.satellite.getById.useQuery(
    { id: selectedSatellite! }, { enabled: !!selectedSatellite }
  )

  const invalidate = () => {
    utils.satellite.list.invalidate()
    if (selectedSatellite) utils.satellite.getById.invalidate({ id: selectedSatellite })
  }

  const createMutation = trpc.satellite.create.useMutation({
    onSuccess: () => { success('Satélite criado!'); setShowCreateForm(false); invalidate() },
    onError: (e) => error(e.message),
  })
  const openRegMutation = trpc.satellite.openRegistration.useMutation({
    onSuccess: () => { success('Inscrições abertas!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const startMutation = trpc.satellite.start.useMutation({
    onSuccess: () => { success('Satélite iniciado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const finishMutation = trpc.satellite.finish.useMutation({
    onSuccess: () => { success('Satélite finalizado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const cancelMutation = trpc.satellite.cancel.useMutation({
    onSuccess: () => { success('Satélite cancelado'); invalidate() },
    onError: (e) => error(e.message),
  })

  const satellites = data?.satellites || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Satélites"
        description={data ? `${data.total} satélites` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Satélite
          </Button>
        }
      />

      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Criar Satélite</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (!form.blind_structure_id) { error('Selecione uma estrutura de blinds'); return }
            if (form.torneio_alvo_ids.length === 0) { error('Selecione pelo menos um torneio alvo'); return }
            createMutation.mutate({
              nome: form.nome,
              buyin_valor: Number(form.buyin_valor),
              rake_valor: Number(form.rake_valor || 0),
              starting_stack: Number(form.starting_stack),
              blind_structure_id: form.blind_structure_id,
              torneio_alvo_ids: form.torneio_alvo_ids,
            })
          }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Satélite NL Hold'em" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Buy-in (R$) *</Label>
                <Input type="number" step="0.01" value={form.buyin_valor}
                  onChange={(e) => setForm({ ...form, buyin_valor: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Rake (R$)</Label>
                <Input type="number" step="0.01" value={form.rake_valor}
                  onChange={(e) => setForm({ ...form, rake_valor: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400">Starting Stack</Label>
                <Input type="number" value={form.starting_stack}
                  onChange={(e) => setForm({ ...form, starting_stack: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">Estrutura de Blinds *</Label>
                <select value={form.blind_structure_id}
                  onChange={(e) => setForm({ ...form, blind_structure_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" required>
                  <option value="">Selecione...</option>
                  {blindStructures?.map((bs) => (
                    <option key={bs.id} value={bs.id}>{bs.nome} ({bs._count.levels} níveis)</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 mb-2 block">Torneios Alvo *</Label>
              <div className="flex flex-wrap gap-2">
                {tournaments?.map((t) => (
                  <button key={t.id} type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        torneio_alvo_ids: form.torneio_alvo_ids.includes(t.id)
                          ? form.torneio_alvo_ids.filter((id) => id !== t.id)
                          : [...form.torneio_alvo_ids, t.id],
                      })
                    }}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      form.torneio_alvo_ids.includes(t.id)
                        ? 'border-emerald-600 bg-emerald-600/10 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}>
                    {t.nome}
                  </button>
                ))}
                {(!tournaments || tournaments.length === 0) && (
                  <p className="text-sm text-zinc-500">Nenhum torneio disponível</p>
                )}
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
        {['', 'INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'FINALIZADO', 'RASCUNHO'].map((s) => (
          <Button key={s} variant="ghost" size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => setStatusFilter(s)}>
            {s === '' ? 'Todos' : statusLabels[s]}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg bg-zinc-800" />)
          ) : satellites.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
              <Rocket size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Nenhum satélite</p>
            </div>
          ) : (
            satellites.map((s) => (
              <div key={s.id} onClick={() => setSelectedSatellite(s.id)}
                className={`cursor-pointer rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${
                  selectedSatellite === s.id ? 'border-emerald-600' : 'border-zinc-800'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{s.nome}</h3>
                  <Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Buy-in R$ {Number(s.buyin_valor).toFixed(2)} · {s.blind_structure.nome}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{s._count.tickets} tickets gerados</p>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {!detail ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20">
              <Rocket size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Selecione um satélite</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{detail.nome}</h2>
                    <p className="text-sm text-zinc-500">
                      Buy-in R$ {Number(detail.buyin_valor).toFixed(2)}
                      {Number(detail.rake_valor) > 0 && ` + R$ ${Number(detail.rake_valor).toFixed(2)} rake`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {detail.status === 'RASCUNHO' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => openRegMutation.mutate({ id: detail.id })}>
                        <CheckCircle size={14} className="mr-1" /> Abrir Inscrições
                      </Button>
                    )}
                    {detail.status === 'INSCRICOES_ABERTAS' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => startMutation.mutate({ id: detail.id })}>
                        <Play size={14} className="mr-1" /> Iniciar
                      </Button>
                    )}
                    {detail.status === 'EM_ANDAMENTO' && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => finishMutation.mutate({ id: detail.id })}>
                        <Square size={14} className="mr-1" /> Finalizar
                      </Button>
                    )}
                    {!['FINALIZADO', 'CANCELADO'].includes(detail.status) && (
                      <Button size="sm" variant="ghost" className="text-red-400"
                        onClick={() => { if (confirm('Cancelar satélite?')) cancelMutation.mutate({ id: detail.id }) }}>
                        <XCircle size={14} className="mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm mt-3 pt-3 border-t border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-500">Starting Stack</p>
                    <p className="text-white">{detail.starting_stack.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Tickets Gerados</p>
                    <p className="text-white">{detail.tickets.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Excedente Pago</p>
                    <p className="text-white">{detail.saldo_excedente_pago ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </div>

              {/* Tickets */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-medium text-zinc-300">Tickets ({detail.tickets.length})</h3>
                </div>
                {detail.tickets.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-sm">Nenhum ticket gerado</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {detail.tickets.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Ticket size={16} className="text-amber-400" />
                          <div>
                            <p className="text-sm text-white">{t.jogador.nome}</p>
                            {t.jogador.nickname && <p className="text-xs text-zinc-500">{t.jogador.nickname}</p>}
                          </div>
                        </div>
                        <Badge className={
                          t.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400' :
                          t.status === 'UTILIZADO' ? 'bg-blue-500/10 text-blue-400' :
                          t.status === 'TRANSFERIDO' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }>
                          {t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blinds */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-medium text-zinc-300">Blinds — {detail.blind_structure.nome}</h3>
                </div>
                <div className="divide-y divide-zinc-800 max-h-64 overflow-y-auto">
                  {detail.blind_structure.levels.map((level) => (
                    <div key={level.id} className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500 w-8">N{level.nivel}</span>
                        {level.is_break ? (
                          <span className="text-sm text-amber-400">BREAK</span>
                        ) : (
                          <span className="text-sm text-white">
                            {level.small_blind}/{level.big_blind}
                            {level.ante > 0 && <span className="text-zinc-500 ml-1">(ante {level.ante})</span>}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{level.duracao_minutos} min</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
