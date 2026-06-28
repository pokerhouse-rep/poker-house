import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple'
}

const colorMap = {
  emerald: 'bg-emerald-500/10 text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/10 text-amber-400',
  red: 'bg-red-500/10 text-red-400',
  purple: 'bg-purple-500/10 text-purple-400',
}

export function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald' }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
        <div className={cn('rounded-md p-2', colorMap[color])}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  )
}
