'use client'

import { Plus, Spade } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'

export default function CashGamePage() {
  // TODO: substituir por tRPC query
  const tables: Array<{
    id: string; nome: string; modalidade: string; stakes: string;
    status: string; max_jogadores: number; sessoes_ativas: number;
    waitlist_count: number
  }> = []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Game"
        description="Mesas de cash abertas e configuração"
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus size={16} className="mr-2" />
            Nova Mesa
          </Button>
        }
      />

      {tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
          <Spade size={48} className="text-zinc-700" />
          <p className="mt-4 text-zinc-500">Nenhuma mesa cadastrada</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((t) => (
            <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">{t.nome}</h3>
                <Badge className={
                  t.status === 'ABERTA' ? 'bg-emerald-500/10 text-emerald-400' :
                  t.status === 'CHEIA' ? 'bg-red-500/10 text-red-400' :
                  'bg-zinc-500/10 text-zinc-400'
                }>
                  {t.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{t.modalidade} · {t.stakes}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Jogadores</span>
                <span className={`font-medium ${t.sessoes_ativas >= t.max_jogadores ? 'text-red-400' : 'text-emerald-400'}`}>
                  {t.sessoes_ativas}/{t.max_jogadores}
                </span>
              </div>
              {t.waitlist_count > 0 && (
                <p className="mt-1 text-xs text-amber-400">{t.waitlist_count} na lista de espera</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
