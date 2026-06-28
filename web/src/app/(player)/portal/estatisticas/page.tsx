'use client'

import { BarChart3, Trophy, Spade, DollarSign, Target, Medal } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export default function EstatisticasPage() {
  const { data: wallet, isLoading: loadingWallet } = trpc.wallet.myWallet.useQuery()
  const { data: rakeback } = trpc.rakeback.myRakeback.useQuery({ page: 1, limit: 100 })

  const totalRakebackRecebido = rakeback?.transactions.reduce((s, t) => s + Number(t.valor), 0) || 0

  if (loadingWallet) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-white">Estatísticas</h1>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Estatísticas</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={DollarSign} label="Saldo Disponível"
          value={wallet ? `R$ ${Number(wallet.saldo_disponivel).toFixed(2)}` : '—'}
          color="emerald" />
        <StatCard icon={Medal} label="Premiações"
          value={wallet ? `R$ ${Number(wallet.saldo_premiacoes).toFixed(2)}` : '—'}
          color="amber" />
        <StatCard icon={Target} label="Rakeback Acumulado"
          value={wallet ? `R$ ${Number(wallet.saldo_rakeback).toFixed(2)}` : '—'}
          color="blue" />
        <StatCard icon={Trophy} label="Total Rakeback Recebido"
          value={`R$ ${totalRakebackRecebido.toFixed(2)}`}
          color="blue" />
        <StatCard icon={DollarSign} label="Bônus"
          value={wallet ? `R$ ${Number(wallet.saldo_bonus).toFixed(2)}` : '—'}
          color="purple" />
        <StatCard icon={Spade} label="Promocional"
          value={wallet ? `R$ ${Number(wallet.saldo_promocional).toFixed(2)}` : '—'}
          color="pink" />
      </div>

      {/* Últimos rakebacks */}
      {rakeback && rakeback.transactions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">Últimos Rakebacks</h2>
          <div className="space-y-1">
            {rakeback.transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div>
                  <p className="text-xs text-zinc-500">{tx.descricao || 'Rakeback'}</p>
                  <p className="text-[10px] text-zinc-600">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className="text-sm font-medium text-emerald-400">+R$ {Number(tx.valor).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size: number; className?: string }>
  label: string; value: string; color: string
}) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400', blue: 'text-blue-400',
    amber: 'text-amber-400', purple: 'text-purple-400', pink: 'text-pink-400',
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className={colors[color] || 'text-zinc-400'} />
        <span className="text-[10px] text-zinc-500 uppercase">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  )
}
