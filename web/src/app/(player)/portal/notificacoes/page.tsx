'use client'

import { useState } from 'react'
import { Bell, Check, Mail, MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

const tipoColors: Record<string, string> = {
  BUYIN: 'bg-blue-500/10 text-blue-400',
  REBUY: 'bg-amber-500/10 text-amber-400',
  PREMIO: 'bg-emerald-500/10 text-emerald-400',
  PAGAMENTO: 'bg-emerald-500/10 text-emerald-400',
  SALDO: 'bg-blue-500/10 text-blue-400',
  INSCRICAO: 'bg-blue-500/10 text-blue-400',
  RANKING: 'bg-amber-500/10 text-amber-400',
  RAKEBACK: 'bg-emerald-500/10 text-emerald-400',
  CONTA: 'bg-red-500/10 text-red-400',
  SISTEMA: 'bg-zinc-500/10 text-zinc-400',
}

export default function NotificacoesPlayerPage() {
  const [page, setPage] = useState(1)
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.notification.list.useQuery({ page, limit: 30 })

  const markReadMutation = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  })
  const markAllMutation = trpc.notification.markAllRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  })

  const notifications = data?.notifications || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Notificações</h1>
        {notifications.some((n) => !n.lida) && (
          <Button variant="ghost" size="sm" className="text-xs text-zinc-400"
            onClick={() => markAllMutation.mutate()}>
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
          <Bell size={40} className="text-zinc-700" />
          <p className="mt-3 text-zinc-500">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id}
              className={`rounded-lg border bg-zinc-900 p-3 ${!n.lida ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {n.lida
                    ? <MailOpen size={14} className="text-zinc-600 mt-0.5" />
                    : <Mail size={14} className="text-blue-400 mt-0.5" />}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{n.titulo}</p>
                      <Badge className={`${tipoColors[n.tipo] || 'bg-zinc-500/10 text-zinc-400'} text-[10px]`}>{n.tipo}</Badge>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{n.mensagem}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{new Date(n.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                {!n.lida && (
                  <button onClick={() => markReadMutation.mutate({ id: n.id })}
                    className="text-blue-400 hover:text-blue-300 p-1">
                    <Check size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-zinc-400">Anterior</Button>
          <span className="text-xs text-zinc-500 py-2">Página {page}</span>
          <Button variant="ghost" size="sm" disabled={notifications.length < 30} onClick={() => setPage(page + 1)} className="text-zinc-400">Próxima</Button>
        </div>
      )}
    </div>
  )
}
