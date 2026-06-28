'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trophy, X } from 'lucide-react'
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

export default function TorneiosPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const { toasts, success, error } = useToast()

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.tournament.list.useQuery({ status: statusFilter || undefined, page, limit: 20 })

  const { data: blindStructures } = trpc.blindStructure.list.useQuery()

  const createMutation = trpc.tournament.create.useMutation({
    onSuccess: (tournament) => {
      success('Torneio criado!')
      setShowForm(false)
      utils.tournament.list.invalidate()
      router.push(`/torneios/${tournament.id}`)
    },
    onError: (err) => error(err.message),
  })

  const [form, setForm] = useState({
    nome: '', buyin_valor: '', rake_valor: '', chip_dealer_valor: '',
    starting_stack: '10000', garantido_ativo: false, garantido_valor: '',
    late_registration_ativo: false, late_registration_ate_nivel: '',
    rebuy_ativo: false, rebuy_maximo: '', rebuy_valor: '', rebuy_fichas: '',
    reentrada_ativa: false, reentrada_maxima: '', reentrada_valor: '', reentrada_fichas: '',
    addon_ativo: false, addon_valor: '', addon_fichas: '',
    blind_structure_id: '',
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.blind_structure_id) {
      error('Selecione uma estrutura de blinds')
      return
    }
    createMutation.mutate({
      nome: form.nome,
      buyin_valor: Number(form.buyin_valor),
      rake_valor: Number(form.rake_valor || 0),
      chip_dealer_valor: Number(form.chip_dealer_valor || 0),
      starting_stack: Number(form.starting_stack),
      garantido_ativo: form.garantido_ativo,
      garantido_valor: form.garantido_ativo ? Number(form.garantido_valor) : undefined,
      late_registration_ativo: form.late_registration_ativo,
      late_registration_ate_nivel: form.late_registration_ativo ? Number(form.late_registration_ate_nivel) : undefined,
      rebuy_ativo: form.rebuy_ativo,
      rebuy_maximo: form.rebuy_ativo ? Number(form.rebuy_maximo) : undefined,
      rebuy_valor: form.rebuy_ativo ? Number(form.rebuy_valor) : undefined,
      rebuy_fichas: form.rebuy_ativo ? Number(form.rebuy_fichas) : undefined,
      rebuy_condicao: form.rebuy_ativo ? 'BUST' : undefined,
      reentrada_ativa: form.reentrada_ativa,
      reentrada_maxima: form.reentrada_ativa ? Number(form.reentrada_maxima) : undefined,
      reentrada_valor: form.reentrada_ativa ? Number(form.reentrada_valor) : undefined,
      reentrada_fichas: form.reentrada_ativa ? Number(form.reentrada_fichas) : undefined,
      addon_ativo: form.addon_ativo,
      addon_valor: form.addon_ativo ? Number(form.addon_valor) : undefined,
      addon_fichas: form.addon_ativo ? Number(form.addon_fichas) : undefined,
      blind_structure_id: form.blind_structure_id,
    })
  }

  const tournaments = data?.tournaments || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Torneios"
        description={data ? `${data.total} torneios` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Torneio
          </Button>
        }
      />

      {/* Formulário de criação */}
      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Criar Torneio</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Dados básicos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">Nome do torneio *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: NL Hold'em R$150" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
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
                <Label className="text-zinc-400">Chip Dealer (R$)</Label>
                <Input type="number" step="0.01" value={form.chip_dealer_valor}
                  onChange={(e) => setForm({ ...form, chip_dealer_valor: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400">Starting Stack *</Label>
                <Input type="number" value={form.starting_stack}
                  onChange={(e) => setForm({ ...form, starting_stack: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">Estrutura de Blinds *</Label>
                <select value={form.blind_structure_id}
                  onChange={(e) => setForm({ ...form, blind_structure_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
                  required>
                  <option value="">Selecione...</option>
                  {blindStructures?.map((bs) => (
                    <option key={bs.id} value={bs.id}>{bs.nome} ({bs._count.levels} níveis)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Garantido */}
              <ToggleSection label="Garantido" checked={form.garantido_ativo}
                onChange={(v) => setForm({ ...form, garantido_ativo: v })}>
                <div>
                  <Label className="text-zinc-500 text-xs">Valor Garantido (R$)</Label>
                  <Input type="number" step="0.01" value={form.garantido_valor}
                    onChange={(e) => setForm({ ...form, garantido_valor: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                </div>
              </ToggleSection>

              {/* Late Registration */}
              <ToggleSection label="Late Registration" checked={form.late_registration_ativo}
                onChange={(v) => setForm({ ...form, late_registration_ativo: v })}>
                <div>
                  <Label className="text-zinc-500 text-xs">Até o nível</Label>
                  <Input type="number" value={form.late_registration_ate_nivel}
                    onChange={(e) => setForm({ ...form, late_registration_ate_nivel: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                </div>
              </ToggleSection>

              {/* Rebuy */}
              <ToggleSection label="Rebuy" checked={form.rebuy_ativo}
                onChange={(v) => setForm({ ...form, rebuy_ativo: v })}>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-zinc-500 text-xs">Máx</Label>
                    <Input type="number" value={form.rebuy_maximo}
                      onChange={(e) => setForm({ ...form, rebuy_maximo: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Valor</Label>
                    <Input type="number" step="0.01" value={form.rebuy_valor}
                      onChange={(e) => setForm({ ...form, rebuy_valor: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Fichas</Label>
                    <Input type="number" value={form.rebuy_fichas}
                      onChange={(e) => setForm({ ...form, rebuy_fichas: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                </div>
              </ToggleSection>

              {/* Reentrada */}
              <ToggleSection label="Reentrada" checked={form.reentrada_ativa}
                onChange={(v) => setForm({ ...form, reentrada_ativa: v })}>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-zinc-500 text-xs">Máx</Label>
                    <Input type="number" value={form.reentrada_maxima}
                      onChange={(e) => setForm({ ...form, reentrada_maxima: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Valor</Label>
                    <Input type="number" step="0.01" value={form.reentrada_valor}
                      onChange={(e) => setForm({ ...form, reentrada_valor: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Fichas</Label>
                    <Input type="number" value={form.reentrada_fichas}
                      onChange={(e) => setForm({ ...form, reentrada_fichas: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                </div>
              </ToggleSection>

              {/* Add-on */}
              <ToggleSection label="Add-on" checked={form.addon_ativo}
                onChange={(v) => setForm({ ...form, addon_ativo: v })}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-zinc-500 text-xs">Valor</Label>
                    <Input type="number" step="0.01" value={form.addon_valor}
                      onChange={(e) => setForm({ ...form, addon_valor: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-xs">Fichas</Label>
                    <Input type="number" value={form.addon_fichas}
                      onChange={(e) => setForm({ ...form, addon_fichas: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                </div>
              </ToggleSection>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-zinc-400">Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Torneio'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['', 'INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'FINALIZADO', 'RASCUNHO'].map((s) => (
          <Button key={s} variant="ghost" size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setStatusFilter(s); setPage(1) }}>
            {s === '' ? 'Todos' : statusLabels[s]}
          </Button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg bg-zinc-800" />)}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Trophy size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum torneio encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <div key={t.id} onClick={() => router.push(`/torneios/${t.id}`)}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">{t.nome}</h3>
                <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-zinc-500">Buy-in</p><p className="text-white">R$ {Number(t.buyin_valor).toFixed(2)}</p></div>
                <div><p className="text-zinc-500">Prize Pool</p><p className="text-emerald-400">R$ {Number(t.prize_pool).toFixed(2)}</p></div>
                <div><p className="text-zinc-500">Inscritos</p><p className="text-white">{t.total_inscritos}</p></div>
                {t.garantido_ativo && t.garantido_valor && (
                  <div><p className="text-zinc-500">Garantido</p><p className="text-amber-400">R$ {Number(t.garantido_valor).toFixed(2)}</p></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ToggleSection({ label, checked, onChange, children }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500" />
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </label>
      {checked && <div className="mt-3">{children}</div>}
    </div>
  )
}
