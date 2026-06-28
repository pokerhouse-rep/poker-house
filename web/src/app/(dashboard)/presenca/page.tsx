'use client'

import { useState } from 'react'
import { UserCheck, LogIn, LogOut, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export default function PresencaPage() {
  const { toasts, success, error } = useToast()
  const [searchPlayer, setSearchPlayer] = useState('')
  const [showCheckin, setShowCheckin] = useState(false)

  const utils = trpc.useUtils()
  const { data: active, isLoading } = trpc.presence.getActive.useQuery()
  const { data: playerSearch } = trpc.player.list.useQuery(
    { search: searchPlayer, page: 1, limit: 30 },
    { enabled: showCheckin && searchPlayer.length > 0 }
  )

  const invalidate = () => utils.presence.getActive.invalidate()

  const checkinMutation = trpc.presence.checkin.useMutation({
    onSuccess: () => { success('Check-in realizado!'); setShowCheckin(false); setSearchPlayer(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const checkoutMutation = trpc.presence.checkout.useMutation({
    onSuccess: () => { success('Check-out realizado!'); invalidate() },
    onError: (e) => error(e.message),
  })

  const presences = active || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Presença"
        description="Controle de presença na casa"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCheckin(!showCheckin)}>
            <LogIn size={16} className="mr-2" /> Check-in
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Na Casa Agora" value={presences.length} icon={Users} color="emerald" />
        <KpiCard title="Check-ins Hoje" value={presences.length} subtitle="Jogadores presentes" icon={UserCheck} color="blue" />
      </div>

      {showCheckin && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-medium text-white mb-3">Check-in de Jogador</h3>
          <input type="text" placeholder="Buscar jogador..."
            value={searchPlayer} onChange={(e) => setSearchPlayer(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white mb-2" />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {playerSearch?.players?.map((p) => (
              <button key={p.id}
                onClick={() => checkinMutation.mutate({ jogador_id: p.id })}
                disabled={checkinMutation.isPending}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                <span>{p.nome} {p.nickname && `(${p.nickname})`}</span>
                <LogIn size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />)}
        </div>
      ) : presences.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <UserCheck size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum jogador na casa</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-medium text-zinc-300">Jogadores na casa ({presences.length})</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {presences.map((p) => {
              const checkInTime = new Date(p.checkin_at)
              const minutes = Math.round((Date.now() - checkInTime.getTime()) / 60000)
              const hours = Math.floor(minutes / 60)
              const duration = hours > 0 ? `${hours}h${minutes % 60}min` : `${minutes}min`

              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-medium text-emerald-400">
                      {p.jogador.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {p.jogador.nome}
                        {p.jogador.nickname && <span className="ml-1 text-zinc-500">({p.jogador.nickname})</span>}
                      </p>
                      <p className="text-xs text-zinc-500">
                        <Clock size={10} className="inline mr-1" />
                        Desde {checkInTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {duration}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs text-red-400 hover:text-red-300"
                    onClick={() => checkoutMutation.mutate({ jogador_id: p.jogador.id })}
                    disabled={checkoutMutation.isPending}>
                    <LogOut size={14} className="mr-1" /> Check-out
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
