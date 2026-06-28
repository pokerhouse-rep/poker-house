'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Wallet, FileText, Trophy, Spade,
  Medal, BarChart3, Bell, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { label: 'Início', href: '/portal', icon: LayoutDashboard },
  { label: 'Carteira', href: '/portal/carteira', icon: Wallet },
  { label: 'Extrato', href: '/portal/extrato', icon: FileText },
  { label: 'Torneios', href: '/portal/torneios', icon: Trophy },
  { label: 'Cash', href: '/portal/cash', icon: Spade },
  { label: 'Ranking', href: '/portal/ranking', icon: Medal },
  { label: 'Estatísticas', href: '/portal/estatisticas', icon: BarChart3 },
  { label: 'Notificações', href: '/portal/notificacoes', icon: Bell },
]

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <span className="text-lg font-bold text-emerald-400">♠ Poker Club</span>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login-player'
          }}
          className="text-zinc-500 hover:text-red-400"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-20">
        {children}
      </main>

      {/* Bottom Nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t border-zinc-800 bg-zinc-900 py-2">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]',
                isActive ? 'text-emerald-400' : 'text-zinc-500'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
