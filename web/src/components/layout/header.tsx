'use client'

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400">
          <Menu size={20} />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-zinc-200">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>
      </div>
    </header>
  )
}
