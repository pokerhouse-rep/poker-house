'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'

const statusColors: Record<string, string> = {
  RASCUNHO: 'bg-zinc-500/10 text-zinc-400',
  INSCRICOES_ABERTAS: 'bg-blue-500/10 text-blue-400',
  EM_ANDAMENTO: 'bg-emerald-500/10 text-emerald-400',
  PAUSADO: 'bg-amber-500/10 text-amber-400',
  FINALIZADO: 'bg-purple-500/10 text-purple-400',
  CANCELADO: 'bg-red-500/10 text-red-400',
}

const statusLabels: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  INSCRICOES_ABERTAS: 'Inscrições Abertas',
  EM_ANDAMENTO: 'Em Andamento',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
}

type Tournament = {
  id: string
  nome: string
  status: string
  buyin_valor: number
  prize_pool: number
  total_inscritos: number
  garantido_ativo: boolean
  garantido_valor: number | null
  data_inicio: string | null
}

export default function TorneiosPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // TODO: substituir por tRPC query
  const tournaments: Tournament[] = []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneios"
        description="Gerencie torneios e inscrições"
        actions={
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push('/torneios/novo')}
          >
            <Plus size={16} className="mr-2" />
            Novo Torneio
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {['', 'INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'FINALIZADO', 'RASCUNHO'].map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === '' ? 'Todos' : statusLabels[s]}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Buscar torneio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-zinc-700 bg-zinc-900 pl-9 text-white placeholder:text-zinc-500"
        />
      </div>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Trophy size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhum torneio cadastrado</p>
          <Button
            className="mt-4 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => router.push('/torneios/novo')}
          >
            Criar primeiro torneio
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/torneios/${t.id}`)}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">{t.nome}</h3>
                <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-zinc-500">Buy-in</p>
                  <p className="text-white">R$ {Number(t.buyin_valor).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Prize Pool</p>
                  <p className="text-emerald-400">R$ {Number(t.prize_pool).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Inscritos</p>
                  <p className="text-white">{t.total_inscritos}</p>
                </div>
                {t.garantido_ativo && t.garantido_valor && (
                  <div>
                    <p className="text-zinc-500">Garantido</p>
                    <p className="text-amber-400">R$ {Number(t.garantido_valor).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
