'use client'

import { useState } from 'react'
import { FileText, Plus, X, Star, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const tipoLabels: Record<string, string> = {
  TORNEIO: 'Torneio', BLIND_STRUCTURE: 'Blind Structure', PREMIACAO: 'Premiação',
  RANKING: 'Ranking', CASH_GAME: 'Cash Game', MENSAGEM: 'Mensagem',
  RELATORIO: 'Relatório', PRODUTO: 'Produto', CONFIGURACAO: 'Configuração',
}
const tipoColors: Record<string, string> = {
  TORNEIO: 'bg-emerald-500/10 text-emerald-400',
  BLIND_STRUCTURE: 'bg-blue-500/10 text-blue-400',
  PREMIACAO: 'bg-amber-500/10 text-amber-400',
  RANKING: 'bg-purple-500/10 text-purple-400',
  CASH_GAME: 'bg-blue-500/10 text-blue-400',
  MENSAGEM: 'bg-zinc-500/10 text-zinc-400',
}

type TemplateTipo = 'TORNEIO' | 'BLIND_STRUCTURE' | 'PREMIACAO' | 'RANKING' | 'CASH_GAME' | 'MENSAGEM' | 'RELATORIO' | 'PRODUTO' | 'CONFIGURACAO'

export default function TemplatesPage() {
  const { toasts, success, error } = useToast()
  const [tipoFilter, setTipoFilter] = useState<TemplateTipo | ''>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newTipo, setNewTipo] = useState<TemplateTipo>('TORNEIO')

  const utils = trpc.useUtils()
  const { data: templates, isLoading } = trpc.template.list.useQuery(
    tipoFilter ? { tipo: tipoFilter } : undefined
  )

  const invalidate = () => utils.template.list.invalidate()

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => { success('Template criado!'); setShowCreateForm(false); setNewNome(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => { success('Template removido'); invalidate() },
    onError: (e) => error(e.message),
  })
  const duplicateMutation = trpc.template.duplicate.useMutation({
    onSuccess: () => { success('Template duplicado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const favoriteMutation = trpc.template.setFavorite.useMutation({
    onSuccess: () => invalidate(),
    onError: (e) => error(e.message),
  })
  const defaultMutation = trpc.template.setDefault.useMutation({
    onSuccess: () => { success('Template definido como padrão!'); invalidate() },
    onError: (e) => error(e.message),
  })

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Templates"
        description="Modelos reutilizáveis"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Template
          </Button>
        }
      />

      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Criar Template</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({ nome: newNome, tipo: newTipo, dados: {} })
          }} className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="text-zinc-400">Nome *</Label>
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
            </div>
            <div>
              <Label className="text-zinc-400">Tipo</Label>
              <select value={newTipo} onChange={(e) => setNewTipo(e.target.value as TemplateTipo)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>Criar</Button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm"
          className={`text-xs ${tipoFilter === '' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          onClick={() => setTipoFilter('')}>Todos</Button>
        {Object.entries(tipoLabels).slice(0, 6).map(([k, v]) => (
          <Button key={k} variant="ghost" size="sm"
            className={`text-xs ${tipoFilter === k ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => setTipoFilter(k as TemplateTipo)}>{v}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg bg-zinc-800" />)}
        </div>
      ) : !templates || templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <FileText size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum template</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">{t.nome}</h3>
                <div className="flex gap-1">
                  <button onClick={() => favoriteMutation.mutate({ id: t.id, is_favorito: !t.is_favorito })}
                    className={t.is_favorito ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}>
                    <Star size={14} fill={t.is_favorito ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={tipoColors[t.tipo] || 'bg-zinc-500/10 text-zinc-400'}>{tipoLabels[t.tipo]}</Badge>
                {t.is_padrao && <Badge className="bg-blue-500/10 text-blue-400">Padrão</Badge>}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="text-xs text-zinc-400"
                  onClick={() => defaultMutation.mutate({ id: t.id })}>Tornar Padrão</Button>
                <Button size="sm" variant="ghost" className="text-xs text-zinc-400"
                  onClick={() => duplicateMutation.mutate({ id: t.id, novo_nome: `${t.nome} (cópia)` })}>
                  <Copy size={12} />
                </Button>
                <Button size="sm" variant="ghost" className="text-xs text-red-400"
                  onClick={() => { if (confirm('Remover template?')) deleteMutation.mutate({ id: t.id }) }}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
