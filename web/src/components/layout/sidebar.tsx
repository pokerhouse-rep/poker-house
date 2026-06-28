'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, UserCog, Trophy, Spade, CircleDollarSign,
  Landmark, CreditCard, UtensilsCrossed, ShoppingBag, Medal, Percent,
  MapPin, Bell, FileText, Settings, ClipboardList, Gift, Shield,
  MonitorPlay, LogOut, ChevronLeft, ChevronRight, Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { type: 'separator', label: 'OPERAÇÃO' },
  { label: 'Jogadores', href: '/jogadores', icon: Users },
  { label: 'Torneios', href: '/torneios', icon: Trophy },
  { label: 'Cash Game', href: '/cash-game', icon: Spade },
  { label: 'Satélites', href: '/satelites', icon: CircleDollarSign },
  { type: 'separator', label: 'FINANCEIRO' },
  { label: 'Financeiro', href: '/financeiro', icon: Landmark },
  { label: 'Caixa', href: '/caixa', icon: CreditCard },
  { label: 'Carteira', href: '/carteiras', icon: Wallet },
  { label: 'Rake / Rakeback', href: '/rakeback', icon: Percent },
  { type: 'separator', label: 'CASA' },
  { label: 'Bar', href: '/bar', icon: UtensilsCrossed },
  { label: 'Produtos', href: '/produtos', icon: ShoppingBag },
  { label: 'Ranking', href: '/ranking', icon: Medal },
  { label: 'Presença', href: '/presenca', icon: MapPin },
  { label: 'Fidelidade', href: '/fidelidade', icon: Gift },
  { type: 'separator', label: 'SISTEMA' },
  { label: 'Funcionários', href: '/funcionarios', icon: UserCog },
  { label: 'Templates', href: '/templates', icon: FileText },
  { label: 'Display', href: '/display-config', icon: MonitorPlay },
  { label: 'Relatórios', href: '/relatorios', icon: ClipboardList },
  { label: 'Auditoria', href: '/auditoria', icon: Shield },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <span className="text-base font-bold text-emerald-400">♠ Poker Club</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item, i) => {
          if ('type' in item && item.type === 'separator') {
            if (collapsed) return <div key={i} className="my-2 border-t border-zinc-800" />
            return (
              <p key={i} className="mt-4 mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {item.label}
              </p>
            )
          }

          if (!('href' in item)) return null

          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 mx-2 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-zinc-800 p-2">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
