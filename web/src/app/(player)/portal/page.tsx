'use client'

import Link from 'next/link'
import { Wallet, Trophy, Spade, TrendingUp, Medal, Target, Bell } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'

const statusLabels: Record<string, string> = {
  INSCRICOES_ABERTAS: 'Inscrições Abertas',
  EM_ANDAMENTO: 'Em Andamento',
}

export default function PlayerPortalPage() {
  const { data: wallet, isLoading: loadingWallet } = trpc.wallet.myWallet.useQuery()
  const { data: tournaments } = trpc.tournament.getAvailable.useQuery()
  const { data: notifications } = trpc.notification.list.useQuery({ lida: false, page: 1, limit: 5 })

  const saldoTotal = wallet
    ? Number(wallet.saldo_disponivel) + Number(wallet.saldo_pendente) + Number(wallet.saldo_bonus) +
      Number(wallet.saldo_rakeback) + Number(wallet.saldo_premiacoes) + Number(wallet.saldo_promocional)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Olá!</h1>
        <p className="text-sm text-zinc-500">Bem-vindo ao seu portal</p>
      </div>

      {/* Saldo */}
      {loadingWallet ? (
        <Skeleton className="h-28 rounded-xl bg-zinc-800" />
      ) : wallet ? (
        <Link href="/portal/carteira">
          <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
            <p className="text-sm text-emerald-100">Saldo Disponível</p>
            <p className="mt-1 text-3xl font-bold text-white">
              R$ {Number(wallet.saldo_disponivel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-emerald-200">
              Total na carteira: R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </Link>
      ) : (
        <div className="rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-800 p-5">
          <p className="text-sm text-zinc-400">Carteira não disponível</p>
        </div>
      )}

      {/* Notificações não lidas */}
      {notifications && notifications.notifications.length > 0 && (
        <Link href="/portal/notificacoes">
          <div className="flex items-center gap-2 rounded-lg border border-blue-900/50 bg-blue-950/30 p-3">
            <Bell size={16} className="text-blue-400" />
            <span className="text-sm text-blue-300">{notifications.total} notificações não lidas</span>
          </div>
        </Link>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/portal/carteira">
          <MiniStat icon={Wallet} label="Disponível" value={wallet ? `R$ ${Number(wallet.saldo_disponivel).toFixed(2)}` : '—'} color="emerald" />
        </Link>
        <Link href="/portal/carteira">
          <MiniStat icon={TrendingUp} label="Rakeback" value={wallet ? `R$ ${Number(wallet.saldo_rakeback).toFixed(2)}` : '—'} color="blue" />
        </Link>
        <Link href="/portal/carteira">
          <MiniStat icon={Medal} label="Premiações" value={wallet ? `R$ ${Number(wallet.saldo_premiacoes).toFixed(2)}` : '—'} color="amber" />
        </Link>
        <Link href="/portal/carteira">
          <MiniStat icon={Target} label="Bônus" value={wallet ? `R$ ${Number(wallet.saldo_bonus).toFixed(2)}` : '—'} color="purple" />
        </Link>
      </div>

      {/* Torneios disponíveis */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">Torneios Disponíveis</h2>
          <Link href="/portal/torneios" className="text-xs text-emerald-400">Ver todos</Link>
        </div>
        {!tournaments || tournaments.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500 text-sm">
            Nenhum torneio disponível no momento
          </div>
        ) : (
          <div className="space-y-2">
            {tournaments.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div>
                  <p className="text-sm font-medium text-white">{t.nome}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="bg-blue-500/10 text-blue-400 text-[10px]">{statusLabels[t.status]}</Badge>
                    <span className="text-xs text-zinc-500">{t.total_inscritos} inscritos</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-400">R$ {Number(t.buyin_valor).toFixed(2)}</p>
                  <p className="text-xs text-zinc-500">Prize: R$ {Number(t.prize_pool).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, color = 'zinc' }: {
  icon: React.ComponentType<{ size: number; className?: string }>
  label: string
  value: string | number
  color?: string
}) {
  const colors: Record<string, string> = {
    zinc: 'text-zinc-400', emerald: 'text-emerald-400',
    blue: 'text-blue-400', amber: 'text-amber-400', purple: 'text-purple-400',
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className={colors[color]} />
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  )
}
