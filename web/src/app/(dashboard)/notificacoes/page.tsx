'use client'

import { useState } from 'react'
import { Bell, Check, CheckCheck, Mail, MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const tipoColors: Record<string, string> = {
  BUYIN: 'bg-blue-500/10 text-blue-400',
  REBUY: 'bg-amber-500/10 text-amber-400',
  ADDON: 'bg-purple-500/10 text-purple-400',
  PREMIO: 'bg-emerald-500/10 text-emerald-400',
  PAGAMENTO: 'bg-emerald-500/10 text-emerald-400',
  SALDO: 'bg-blue-500/10 text-blue-400',
  INSCRICAO: 'bg-blue-500/10 text-blue-400',
  RANKING: 'bg-amber-500/10 text-amber-400',
  RAKEBACK: 'bg-emerald-500/10 text-emerald-400',
  CONTA: 'bg-red-500/10 text-red-400',
  SISTEMA: 'bg-zinc-500/10 text-zinc-400',
}

export default function NotificacoesPage() {
  const { toasts, success } = useToast()
  const [filterRead, setFilterRead] = useState<boolean | ''>('')
  const [page, setPage] = useState(1)

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.notification.list.useQuery({
    lida: filterRead === '' ? undefined : filterRead,
    page, limit: 30,
  })

  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  })
  const markAllMutation = trpc.notification.markAllRead.useMutation({
    onSuccess: () => { success('Todas marcadas como lidas'); utils.notification.list.invalidate() },
  })

  const notifications = data?.notifications || []
  const unreadCount = notifications.filter((n) => !n.lida).length

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Notificações"
        description={data ? `${data.total} notificações` : 'Carregando...'}
        actions={
          <Button variant="outline" className="border-zinc-700 text-zinc-300"
            onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck size={16} className="mr-2" /> Marcar todas como lidas
          </Button>
        }
      />

      <div className="flex gap-2">
        {[
          { label: 'Todas', value: '' as const },
          { label: 'Não lidas', value: false as const },
          { label: 'Lidas', value: true as const },
        ].map((f) => (
          <Button key={String(f.value)} variant="ghost" size="sm"
            className={`text-xs ${filterRead === f.value ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setFilterRead(f.value); setPage(1) }}>
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Bell size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800">
            {notifications.map((n) => (
              <div key={n.id}
                className={`flex items-center justify-between px-4 py-3 ${!n.lida ? 'bg-zinc-900' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  {n.lida ? <MailOpen size={16} className="text-zinc-600" /> : <Mail size={16} className="text-blue-400" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{n.titulo}</p>
                      <Badge className={tipoColors[n.tipo] || 'bg-zinc-500/10 text-zinc-400'}>{n.tipo}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500">{n.mensagem}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">
                    {new Date(n.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  {!n.lida && (
                    <Button size="sm" variant="ghost" className="text-xs text-blue-400"
                      onClick={() => markReadMutation.mutate({ id: n.id })}>
                      <Check size={12} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-zinc-400">Anterior</Button>
          <span className="text-sm text-zinc-500 py-1">Página {page}</span>
          <Button variant="ghost" size="sm" disabled={notifications.length < 30} onClick={() => setPage(page + 1)} className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
