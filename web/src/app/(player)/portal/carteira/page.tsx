'use client'

import { Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

export default function CarteiraPage() {
  const { data: wallet, isLoading } = trpc.wallet.myWallet.useQuery()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl bg-zinc-800" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg bg-zinc-800" />)}
        </div>
      </div>
    )
  }

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Wallet size={40} className="text-zinc-700" />
        <p className="mt-3 text-zinc-500">Carteira não encontrada</p>
      </div>
    )
  }

  const saldos = [
    { tipo: 'Disponível', valor: Number(wallet.saldo_disponivel), color: 'text-emerald-400' },
    { tipo: 'Premiações', valor: Number(wallet.saldo_premiacoes), color: 'text-amber-400' },
    { tipo: 'Rakeback', valor: Number(wallet.saldo_rakeback), color: 'text-blue-400' },
    { tipo: 'Bônus', valor: Number(wallet.saldo_bonus), color: 'text-purple-400' },
    { tipo: 'Promocional', valor: Number(wallet.saldo_promocional), color: 'text-pink-400' },
    { tipo: 'Pendente', valor: Number(wallet.saldo_pendente), color: 'text-zinc-400' },
    { tipo: 'Bloqueado', valor: Number(wallet.saldo_bloqueado), color: 'text-red-400' },
  ]

  const total = saldos.reduce((s, item) => s + item.valor, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Carteira</h1>

      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
        <p className="text-sm text-emerald-100">Saldo Total</p>
        <p className="mt-1 text-3xl font-bold text-white">
          R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div className="space-y-2">
        {saldos.map((s) => (
          <div key={s.tipo} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <span className="text-sm text-zinc-400">{s.tipo}</span>
            <span className={`font-medium ${s.color}`}>
              R$ {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
