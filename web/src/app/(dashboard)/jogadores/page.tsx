'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'
import { maskCpf, maskPhone } from '@/lib/format/masks'

type Player = {
  id: string
  nome: string
  nickname: string | null
  cpf: string
  telefone: string
  status: string
  tags: string[]
  wallet: { saldo_disponivel: unknown } | null
}

function formatCpfDisplay(cpf: string): string {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export default function JogadoresPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const { toasts, success, error } = useToast()

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.player.list.useQuery({ search: search || undefined, page, limit: 20 })

  const createMutation = trpc.player.create.useMutation({
    onSuccess: () => {
      success('Jogador cadastrado com sucesso!')
      setShowForm(false)
      utils.player.list.invalidate()
    },
    onError: (err) => error(err.message),
  })

  const [form, setForm] = useState({
    nome: '', cpf: '', telefone: '', email: '',
    data_nascimento: '', nickname: '', senha: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      nome: form.nome,
      cpf: form.cpf,
      telefone: form.telefone.replace(/\D/g, ''),
      email: form.email,
      data_nascimento: form.data_nascimento,
      nickname: form.nickname || undefined,
      senha: form.senha || undefined,
    })
  }

  const columns = [
    {
      header: 'Jogador',
      accessor: (row: Player) => (
        <div>
          <p className="font-medium text-white">{row.nome}</p>
          {row.nickname && <p className="text-xs text-zinc-500">@{row.nickname}</p>}
        </div>
      ),
    },
    { header: 'CPF', accessor: (row: Player) => formatCpfDisplay(row.cpf) },
    { header: 'Telefone', accessor: 'telefone' as keyof Player },
    {
      header: 'Status',
      accessor: (row: Player) => (
        <Badge className={
          row.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400' :
          row.status === 'BLOQUEADO' ? 'bg-red-500/10 text-red-400' :
          'bg-zinc-500/10 text-zinc-400'
        }>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Tags',
      accessor: (row: Player) => (
        <div className="flex gap-1">
          {row.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">{tag}</Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Saldo',
      accessor: (row: Player) => (
        <span className="text-emerald-400 font-medium">
          R$ {Number(row.wallet?.saldo_disponivel || 0).toFixed(2)}
        </span>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Jogadores"
        description={data ? `${data.total} jogadores cadastrados` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Jogador
          </Button>
        }
      />

      {/* Formulário de cadastro */}
      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cadastrar Jogador</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-zinc-400">Nome completo *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-400">CPF *</Label>
                <Input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-400">Telefone *</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-400">E-mail *</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-400">Data de Nascimento *</Label>
                <Input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-zinc-400">Nickname</Label>
                <Input
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  placeholder="Apelido no poker"
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400">Senha do portal</Label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  placeholder="Min. 8 caracteres (opcional)"
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-zinc-400">
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Buscar por nome, CPF ou nickname..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border-zinc-700 bg-zinc-900 pl-9 text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={(data?.players || []) as Player[]}
          total={data?.total || 0}
          page={page}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/jogadores/${row.id}`)}
          emptyMessage="Nenhum jogador encontrado"
        />
      )}
    </div>
  )
}
