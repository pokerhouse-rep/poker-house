'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'

type DisplayState = {
  tournament: {
    nome: string
    status: string
    prize_pool: number
    total_inscritos: number
    total_rebuys: number
    total_addons: number
    nivel_atual: number
  }
  blind: {
    nivel: number
    small_blind: number
    big_blind: number
    ante: number
    duracao_minutos: number
    is_break: boolean
  }
  next_blind: {
    small_blind: number
    big_blind: number
    ante: number
  } | null
  jogadores_restantes: number
  media_fichas: number
}

export default function TournamentDisplayPage({
  params,
}: {
  params: Promise<{ orgId: string; tournamentId: string }>
}) {
  const { tournamentId } = use(params)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isBreak, setIsBreak] = useState(false)

  // TODO: conectar Supabase Realtime para dados reais
  const state: DisplayState = {
    tournament: {
      nome: 'NL Hold\'em R$150',
      status: 'EM_ANDAMENTO',
      prize_pool: 12600,
      total_inscritos: 84,
      total_rebuys: 32,
      total_addons: 28,
      nivel_atual: 8,
    },
    blind: {
      nivel: 8,
      small_blind: 400,
      big_blind: 800,
      ante: 100,
      duracao_minutos: 25,
      is_break: false,
    },
    next_blind: {
      small_blind: 500,
      big_blind: 1000,
      ante: 100,
    },
    jogadores_restantes: 42,
    media_fichas: 30000,
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isLowTime = timeLeft < 60

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white select-none">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 px-8 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-emerald-400">♠</span>
          <h1 className="text-xl font-bold">{state.tournament.nome}</h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-zinc-500 text-xs">INSCRITOS</p>
            <p className="text-lg font-bold">{state.tournament.total_inscritos}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 text-xs">REBUYS</p>
            <p className="text-lg font-bold">{state.tournament.total_rebuys}</p>
          </div>
          <div className="text-center">
            <p className="text-zinc-500 text-xs">ADD-ONS</p>
            <p className="text-lg font-bold">{state.tournament.total_addons}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left — Timer and Blinds */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {isBreak ? (
            <div className="text-center">
              <p className="text-2xl font-semibold text-amber-400 uppercase tracking-wider">Intervalo</p>
              <p className={`mt-4 text-[120px] font-bold leading-none tabular-nums ${isLowTime ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
                Nível {state.blind.nivel}
              </p>

              <p className="mt-2 text-[80px] font-bold leading-none text-white">
                {state.blind.small_blind.toLocaleString()} / {state.blind.big_blind.toLocaleString()}
              </p>

              {state.blind.ante > 0 && (
                <p className="mt-2 text-2xl text-zinc-400">
                  Ante: {state.blind.ante.toLocaleString()}
                </p>
              )}

              <p className={`mt-8 text-[100px] font-bold leading-none tabular-nums ${isLowTime ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </p>
            </div>
          )}

          {state.next_blind && (
            <div className="text-center">
              <p className="text-xs text-zinc-600 uppercase tracking-wider">Próximo Nível</p>
              <p className="text-xl text-zinc-400">
                {state.next_blind.small_blind.toLocaleString()} / {state.next_blind.big_blind.toLocaleString()}
                {state.next_blind.ante > 0 && ` (ante ${state.next_blind.ante.toLocaleString()})`}
              </p>
            </div>
          )}
        </div>

        {/* Right — Stats */}
        <div className="flex w-80 flex-col justify-center gap-6 border-l border-zinc-800 bg-zinc-900/50 px-8">
          <StatItem label="Jogadores" value={state.jogadores_restantes} highlight />
          <StatItem label="Média de Fichas" value={state.media_fichas.toLocaleString()} />
          <StatItem label="Prize Pool" value={`R$ ${state.tournament.prize_pool.toLocaleString()}`} color="emerald" />
          <StatItem label="Nível" value={state.blind.nivel} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between bg-zinc-900 px-8 py-2 border-t border-zinc-800 text-xs text-zinc-600">
        <span>Tournament ID: {tournamentId.slice(0, 8)}</span>
        <span>{new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>
  )
}

function StatItem({ label, value, highlight, color }: {
  label: string
  value: string | number
  highlight?: boolean
  color?: 'emerald' | 'amber'
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`text-3xl font-bold ${
        color === 'emerald' ? 'text-emerald-400' :
        highlight ? 'text-white' :
        'text-zinc-300'
      }`}>
        {value}
      </p>
    </div>
  )
}
