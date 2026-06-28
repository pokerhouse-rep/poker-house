'use client'

import { useState } from 'react'
import { Building2, Plus, X, Play, Pause, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const statusColors: Record<string, string> = {
  ATIVA: 'bg-emerald-500/10 text-emerald-400',
  SUSPENSA: 'bg-amber-500/10 text-amber-400',
  CANCELADA: 'bg-red-500/10 text-red-400',
}

export default function OrganizacoesPage() {
  const { toasts, success, error } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [form, setForm] = useState({
    cnpj: '', razao_social: '', nome_fantasia: '', email: '', telefone: '',
    admin_nome: '', admin_email: '', admin_cpf: '', admin_telefone: '',
    admin_senha: '', admin_data_nascimento: '',
  })

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.platform.listOrgs.useQuery({
    status: (statusFilter as 'ATIVA' | 'SUSPENSA' | 'CANCELADA') || undefined,
    search: search || undefined,
    page, limit: 20,
  })

  const invalidate = () => utils.platform.listOrgs.invalidate()

  const createMutation = trpc.platform.createOrg.useMutation({
    onSuccess: () => { success('Organização criada!'); setShowCreateForm(false); invalidate() },
    onError: (e) => error(e.message),
  })
  const suspendMutation = trpc.platform.suspendOrg.useMutation({
    onSuccess: () => { success('Organização suspensa'); invalidate() },
    onError: (e) => error(e.message),
  })
  const activateMutation = trpc.platform.activateOrg.useMutation({
    onSuccess: () => { success('Organização ativada!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const cancelMutation = trpc.platform.cancelOrg.useMutation({
    onSuccess: () => { success('Organização cancelada'); invalidate() },
    onError: (e) => error(e.message),
  })

  const orgs = data?.orgs || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizações</h1>
          <p className="text-sm text-zinc-500">{data ? `${data.total} organizações` : 'Carregando...'}</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
          <Plus size={16} className="mr-2" /> Nova Organização
        </Button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Criar Organização</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              cnpj: form.cnpj, razao_social: form.razao_social,
              nome_fantasia: form.nome_fantasia, email: form.email,
              telefone: form.telefone || undefined,
              admin: {
                nome: form.admin_nome, email: form.admin_email,
                cpf: form.admin_cpf, telefone: form.admin_telefone,
                senha: form.admin_senha, data_nascimento: form.admin_data_nascimento,
              },
            })
          }} className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-400">Dados da Organização</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-zinc-400">CNPJ *</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Razão Social *</Label>
                <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Nome Fantasia *</Label>
                <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
              </div>
            </div>

            <h3 className="text-sm font-medium text-zinc-400 pt-2">Administrador Inicial</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-zinc-400">Nome *</Label>
                <Input value={form.admin_nome} onChange={(e) => setForm({ ...form, admin_nome: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Email *</Label>
                <Input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">CPF *</Label>
                <Input value={form.admin_cpf} onChange={(e) => setForm({ ...form, admin_cpf: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Telefone *</Label>
                <Input value={form.admin_telefone} onChange={(e) => setForm({ ...form, admin_telefone: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Senha *</Label>
                <Input type="password" value={form.admin_senha} onChange={(e) => setForm({ ...form, admin_senha: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Nascimento *</Label>
                <Input type="date" value={form.admin_data_nascimento}
                  onChange={(e) => setForm({ ...form, admin_data_nascimento: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Organização'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nome..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs border-zinc-700 bg-zinc-800 text-white" />
        {['', 'ATIVA', 'SUSPENSA', 'CANCELADA'].map((s) => (
          <Button key={s} variant="ghost" size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setStatusFilter(s); setPage(1) }}>
            {s === '' ? 'Todas' : s === 'ATIVA' ? 'Ativas' : s === 'SUSPENSA' ? 'Suspensas' : 'Canceladas'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />)}
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Building2 size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhuma organização</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {orgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between px-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{org.nome_fantasia}</h3>
                    <Badge className={statusColors[org.status]}>{org.status}</Badge>
                    {org.subscription && (
                      <Badge className="bg-blue-500/10 text-blue-400 text-xs">{org.subscription.plano}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {org.razao_social} · CNPJ: {org.cnpj} · {org._count.users} usuários
                  </p>
                </div>
                <div className="flex gap-1">
                  {org.status === 'ATIVA' && (
                    <Button size="sm" variant="ghost" className="text-xs text-amber-400"
                      onClick={() => suspendMutation.mutate({ id: org.id })}>
                      <Pause size={12} className="mr-1" /> Suspender
                    </Button>
                  )}
                  {org.status === 'SUSPENSA' && (
                    <Button size="sm" variant="ghost" className="text-xs text-emerald-400"
                      onClick={() => activateMutation.mutate({ id: org.id })}>
                      <Play size={12} className="mr-1" /> Ativar
                    </Button>
                  )}
                  {org.status !== 'CANCELADA' && (
                    <Button size="sm" variant="ghost" className="text-xs text-red-400"
                      onClick={() => { if (confirm('Cancelar organização?')) cancelMutation.mutate({ id: org.id }) }}>
                      <XCircle size={12} className="mr-1" /> Cancelar
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
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-zinc-400">Anterior</Button>
          <span className="text-sm text-zinc-500 py-1">Página {page}</span>
          <Button variant="ghost" size="sm" disabled={orgs.length < 20} onClick={() => setPage(page + 1)} className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
