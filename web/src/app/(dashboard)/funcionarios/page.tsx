'use client'

import { useState } from 'react'
import { Plus, Users, X, Shield, UserCheck, UserX } from 'lucide-react'
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
  INATIVO: 'bg-zinc-500/10 text-zinc-400',
  BLOQUEADO: 'bg-red-500/10 text-red-400',
}

export default function FuncionariosPage() {
  const { toasts, success, error } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'INATIVO' | 'BLOQUEADO' | ''>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [page, setPage] = useState(1)

  const [form, setForm] = useState({
    nome: '', email: '', cpf: '', telefone: '',
    senha: '', data_nascimento: '', role_ids: [] as string[],
  })

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.employee.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    page, limit: 20,
  })
  const { data: roles } = trpc.role.list.useQuery()

  const invalidate = () => utils.employee.list.invalidate()

  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => {
      success('Funcionário cadastrado!')
      setShowCreateForm(false)
      setForm({ nome: '', email: '', cpf: '', telefone: '', senha: '', data_nascimento: '', role_ids: [] })
      invalidate()
    },
    onError: (e) => error(e.message),
  })
  const deactivateMutation = trpc.employee.deactivate.useMutation({
    onSuccess: () => { success('Funcionário desativado'); invalidate() },
    onError: (e) => error(e.message),
  })
  const activateMutation = trpc.employee.activate.useMutation({
    onSuccess: () => { success('Funcionário ativado!'); invalidate() },
    onError: (e) => error(e.message),
  })

  const employees = data?.employees || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Funcionários"
        description={data ? `${data.total} funcionários` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" /> Novo Funcionário
          </Button>
        }
      />

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cadastrar Funcionário</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (form.role_ids.length === 0) { error('Selecione pelo menos um cargo'); return }
            createMutation.mutate(form)
          }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-zinc-400">Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">CPF *</Label>
                <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="00000000000" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Telefone *</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="31999999999" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Senha *</Label>
                <Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Data de Nascimento *</Label>
                <Input type="date" value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
            </div>
            <div>
              <Label className="text-zinc-400 mb-2 block">Cargos *</Label>
              <div className="flex flex-wrap gap-2">
                {roles?.map((r) => (
                  <button key={r.id} type="button"
                    onClick={() => {
                      setForm({
                        ...form,
                        role_ids: form.role_ids.includes(r.id)
                          ? form.role_ids.filter((id) => id !== r.id)
                          : [...form.role_ids, r.id],
                      })
                    }}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      form.role_ids.includes(r.id)
                        ? 'border-emerald-600 bg-emerald-600/10 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}>
                    <Shield size={12} className="inline mr-1" />{r.nome}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nome ou email..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs border-zinc-700 bg-zinc-800 text-white" />
        <div className="flex gap-2">
          {['', 'ATIVO', 'INATIVO', 'BLOQUEADO'].map((s) => (
            <Button key={s} variant="ghost" size="sm"
              className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              onClick={() => { setStatusFilter(s as typeof statusFilter); setPage(1) }}>
              {s === '' ? 'Todos' : s === 'ATIVO' ? 'Ativos' : s === 'INATIVO' ? 'Inativos' : 'Bloqueados'}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Users size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum funcionário encontrado</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
                    {emp.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{emp.nome}</p>
                      <Badge className={statusColors[emp.status]}>{emp.status}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500">{emp.email} · {emp.telefone}</p>
                    <div className="flex gap-1 mt-1">
                      {emp.user_roles.map((ur) => (
                        <Badge key={ur.role.id} className="bg-blue-500/10 text-blue-400 text-xs">{ur.role.nome}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {emp.ultimo_acesso && (
                    <span className="text-xs text-zinc-600">
                      Último acesso: {new Date(emp.ultimo_acesso).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {emp.status === 'ATIVO' ? (
                    <Button size="sm" variant="ghost" className="text-xs text-red-400"
                      onClick={() => deactivateMutation.mutate({ id: emp.id })}
                      disabled={deactivateMutation.isPending}>
                      <UserX size={14} className="mr-1" /> Desativar
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs text-emerald-400"
                      onClick={() => activateMutation.mutate({ id: emp.id })}
                      disabled={activateMutation.isPending}>
                      <UserCheck size={14} className="mr-1" /> Ativar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="text-zinc-400">Anterior</Button>
          <span className="text-sm text-zinc-500 py-1">Página {page}</span>
          <Button variant="ghost" size="sm" disabled={employees.length < 20} onClick={() => setPage(page + 1)}
            className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
