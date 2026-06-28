'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc/client'

type Player = {
  id: string
  nome: string
  nickname: string | null
  cpf: string
  telefone: string
  status: string
  tags: string[]
  wallet: { saldo_disponivel: unknown } | null
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

export default function JogadoresPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = trpc.player.list.useQuery({
    search: search || undefined,
    page,
    limit: 20,
  })

  const columns = [
    {
      header: 'Jogador',
      accessor: (row: Player) => (
        <div>
          <p className="font-medium text-white">{row.nome}</p>
          {row.nickname && <p className="text-xs text-zinc-500">@{row.nickname}</p>}
        </div>
      ),
    },
    { header: 'CPF', accessor: (row: Player) => formatCpf(row.cpf) },
    { header: 'Telefone', accessor: 'telefone' as keyof Player },
    {
      header: 'Status',
      accessor: (row: Player) => (
        <Badge className={
          row.status === 'ATIVO' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' :
          row.status === 'BLOQUEADO' ? 'bg-red-500/10 text-red-400' :
          'bg-zinc-500/10 text-zinc-400'
        }>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Tags',
      accessor: (row: Player) => (
        <div className="flex gap-1">
          {row.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Saldo',
      accessor: (row: Player) => (
        <span className="text-emerald-400 font-medium">
          R$ {Number(row.wallet?.saldo_disponivel || 0).toFixed(2)}
        </span>
      ),
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jogadores"
        description={data ? `${data.total} jogadores cadastrados` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus size={16} className="mr-2" />
            Novo Jogador
          </Button>
        }
      />

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, CPF ou nickname..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="border-zinc-700 bg-zinc-900 pl-9 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={(data?.players || []) as Player[]}
          total={data?.total || 0}
          page={page}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/jogadores/${row.id}`)}
          emptyMessage="Nenhum jogador encontrado"
        />
      )}
    </div>
  )
}
