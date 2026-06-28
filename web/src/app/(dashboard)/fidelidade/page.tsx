'use client'

import { useState } from 'react'
import { Star, Plus, X, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export default function FidelidadePage() {
  const { toasts, success, error } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [newNome, setNewNome] = useState('')
  const [newMeta, setNewMeta] = useState('10')
  const [newPremio, setNewPremio] = useState('50')

  const utils = trpc.useUtils()
  const { data: programs, isLoading } = trpc.loyalty.list.useQuery()
  const { data: progress } = trpc.loyalty.getProgress.useQuery(
    { program_id: selectedProgram! }, { enabled: !!selectedProgram }
  )

  const invalidate = () => utils.loyalty.list.invalidate()

  const createMutation = trpc.loyalty.create.useMutation({
    onSuccess: () => { success('Programa criado!'); setShowCreateForm(false); setNewNome(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const updateMutation = trpc.loyalty.update.useMutation({
    onSuccess: () => { success('Programa atualizado!'); invalidate() },
    onError: (e) => error(e.message),
  })

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Fidelidade"
        description="Programas de fidelidade"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Programa
          </Button>
        }
      />

      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Criar Programa</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              nome: newNome,
              regras: { tipo: 'presenca', meta: Number(newMeta), premio_valor: Number(newPremio) },
            })
          }} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-zinc-400">Nome *</Label>
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)}
                placeholder="Ex: Frequência VIP" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
            </div>
            <div>
              <Label className="text-zinc-400">Meta (presenças)</Label>
              <Input type="number" value={newMeta} onChange={(e) => setNewMeta(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
            </div>
            <div>
              <Label className="text-zinc-400">Prêmio (R$)</Label>
              <Input type="number" step="0.01" value={newPremio} onChange={(e) => setNewPremio(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>Criar</Button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg bg-zinc-800" />)}
        </div>
      ) : !programs || programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Star size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum programa de fidelidade</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((p) => {
            const regras = p.regras as Record<string, number>
            return (
              <div key={p.id}
                onClick={() => setSelectedProgram(selectedProgram === p.id ? null : p.id)}
                className={`cursor-pointer rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${
                  selectedProgram === p.id ? 'border-emerald-600' : 'border-zinc-800'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{p.nome}</h3>
                  <div className="flex gap-2">
                    <Badge className={p.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}>
                      {p.status}
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-xs text-zinc-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateMutation.mutate({
                          id: p.id,
                          status: p.status === 'ATIVO' ? 'INATIVO' : 'ATIVO',
                        })
                      }}>
                      {p.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {regras.meta && <div><p className="text-zinc-500">Meta</p><p className="text-white">{regras.meta} presenças</p></div>}
                  {regras.premio_valor && <div><p className="text-zinc-500">Prêmio</p><p className="text-emerald-400">R$ {regras.premio_valor}</p></div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedProgram && progress && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-medium text-zinc-300">Progresso dos Jogadores</h3>
          </div>
          {progress.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-sm">Nenhum progresso registrado</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {progress.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{pr.jogador.nome}</p>
                    <div className="mt-1 h-2 w-32 rounded-full bg-zinc-800">
                      <div className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (pr.progresso_atual / pr.meta) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{pr.progresso_atual}/{pr.meta}</p>
                    {pr.completado && (
                      <Badge className="bg-amber-500/10 text-amber-400">
                        <Trophy size={10} className="mr-1" /> Completado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
