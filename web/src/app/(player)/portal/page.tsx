'use client'

import { Wallet, Trophy, Spade, TrendingUp, Medal, Target } from 'lucide-react'

export default function PlayerPortalPage() {
  // TODO: dados reais via tRPC
  const player = {
    nome: 'João Silva',
    nickname: 'JokerJS',
    saldo_disponivel: 1250.00,
    saldo_total: 1890.00,
  }

  const stats = {
    torneios_jogados: 47,
    vitorias: 3,
    itm: 28.5,
    roi: 42.3,
    cash_resultado: 2340.00,
    ranking_posicao: 5,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Olá, {player.nickname || player.nome}!</h1>
        <p className="text-sm text-zinc-500">Bem-vindo ao seu portal</p>
      </div>

      {/* Saldo */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
        <p className="text-sm text-emerald-100">Saldo Disponível</p>
        <p className="mt-1 text-3xl font-bold text-white">
          R$ {player.saldo_disponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-xs text-emerald-200">
          Total na carteira: R$ {player.saldo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat icon={Trophy} label="Torneios" value={stats.torneios_jogados} />
        <MiniStat icon={Medal} label="Vitórias" value={stats.vitorias} color="amber" />
        <MiniStat icon={Target} label="ITM" value={`${stats.itm}%`} color="blue" />
        <MiniStat icon={TrendingUp} label="ROI" value={`${stats.roi}%`} color="emerald" />
        <MiniStat icon={Spade} label="Cash" value={`R$ ${stats.cash_resultado.toLocaleString()}`} color="purple" />
        <MiniStat icon={Medal} label="Ranking" value={`#${stats.ranking_posicao}`} color="amber" />
      </div>

      {/* Próximos Torneios */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Próximos Torneios</h2>
        <div className="space-y-2">
          <TournamentCard
            nome="NL Hold'em R$100"
            data="Hoje, 20:00"
            buyin="R$ 100"
            inscritos={32}
          />
          <TournamentCard
            nome="PLO R$200"
            data="Amanhã, 19:00"
            buyin="R$ 200"
            inscritos={12}
          />
        </div>
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
    zinc: 'text-zinc-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
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

function TournamentCard({ nome, data, buyin, inscritos }: {
  nome: string; data: string; buyin: string; inscritos: number
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div>
        <p className="text-sm font-medium text-white">{nome}</p>
        <p className="text-xs text-zinc-500">{data}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-emerald-400">{buyin}</p>
        <p className="text-xs text-zinc-500">{inscritos} inscritos</p>
      </div>
    </div>
  )
}
