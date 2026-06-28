'use client'

import { useState } from 'react'
import { Shield, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const entidadeColors: Record<string, string> = {
  Tournament: 'bg-emerald-500/10 text-emerald-400',
  CashTable: 'bg-blue-500/10 text-blue-400',
  Tab: 'bg-amber-500/10 text-amber-400',
  User: 'bg-purple-500/10 text-purple-400',
  Wallet: 'bg-blue-500/10 text-blue-400',
  CashRegister: 'bg-zinc-500/10 text-zinc-400',
}

export default function AuditoriaPage() {
  const { toasts } = useToast()
  const [page, setPage] = useState(1)
  const [entidadeFilter, setEntidadeFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = trpc.audit.list.useQuery({
    entidade: entidadeFilter || undefined,
    acao: search || undefined,
    page, limit: 30,
  })

  const logs = data?.logs || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader title="Auditoria" description={data ? `${data.total} registros` : 'Carregando...'} />

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por ação..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs border-zinc-700 bg-zinc-800 text-white" />
        <Filter size={14} className="text-zinc-500" />
        {['', 'Tournament', 'CashTable', 'User', 'Wallet', 'Tab', 'CashRegister'].map((e) => (
          <Button key={e} variant="ghost" size="sm"
            className={`text-xs ${entidadeFilter === e ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setEntidadeFilter(e); setPage(1) }}>
            {e || 'Todas'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Shield size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum log de auditoria</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={entidadeColors[log.entidade] || 'bg-zinc-500/10 text-zinc-400'}>
                      {log.entidade}
                    </Badge>
                    <span className="text-sm text-white">{log.acao}</span>
                  </div>
                  <span className="text-xs text-zinc-600">
                    {new Date(log.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span>por {log.user.nome}</span>
                  <span>·</span>
                  <span className="font-mono text-zinc-600">{log.entidade_id.slice(0, 8)}...</span>
                  {log.ip_address && <><span>·</span><span>{log.ip_address}</span></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-zinc-400">Anterior</Button>
          <span className="text-sm text-zinc-500 py-1">Página {page} de {Math.ceil(data.total / 30)}</span>
          <Button variant="ghost" size="sm" disabled={logs.length < 30} onClick={() => setPage(page + 1)} className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
