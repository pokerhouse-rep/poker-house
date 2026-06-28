'use client'

import { useState } from 'react'
import { Beer, Plus, X, UserPlus, Receipt, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

export default function BarPage() {
  const { toasts, success, error } = useToast()
  const [showOpenTab, setShowOpenTab] = useState(false)
  const [searchPlayer, setSearchPlayer] = useState('')
  const [selectedTab, setSelectedTab] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.tab.listOpen.useQuery({ page: 1, limit: 100 })
  const { data: products } = trpc.product.list.useQuery({ status: 'ATIVO' })
  const { data: categories } = trpc.product.categoryList.useQuery()
  const { data: playerSearch } = trpc.player.list.useQuery(
    { search: searchPlayer, page: 1, limit: 30 },
    { enabled: showOpenTab && searchPlayer.length > 0 }
  )

  const invalidate = () => utils.tab.listOpen.invalidate()

  const openTabMutation = trpc.tab.open.useMutation({
    onSuccess: (tab) => { success('Comanda aberta!'); setShowOpenTab(false); setSearchPlayer(''); setSelectedTab(tab.id); invalidate() },
    onError: (e) => error(e.message),
  })
  const addItemMutation = trpc.tab.addItem.useMutation({
    onSuccess: () => { success('Item adicionado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const closeTabMutation = trpc.tab.close.useMutation({
    onSuccess: () => { success('Comanda fechada!'); setSelectedTab(null); invalidate() },
    onError: (e) => error(e.message),
  })

  const tabs = data?.tabs || []
  const selected = tabs.find((t) => t.id === selectedTab)
  const totalConsumo = tabs.reduce((s, t) => s + Number(t.total), 0)

  const filteredProducts = products?.filter((p) =>
    !selectedCategory || p.categoria_id === selectedCategory
  ) || []

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Bar / Comandas"
        description={data ? `${data.total} comandas abertas` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowOpenTab(true)}>
            <UserPlus size={16} className="mr-2" /> Abrir Comanda
          </Button>
        }
      />

      {tabs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard title="Comandas Abertas" value={tabs.length} icon={Receipt} color="blue" />
          <KpiCard title="Consumo Total" value={`R$ ${totalConsumo.toFixed(2)}`} icon={ShoppingCart} color="emerald" />
          <KpiCard title="Ticket Médio" value={`R$ ${(totalConsumo / tabs.length).toFixed(2)}`} icon={Beer} color="amber" />
        </div>
      )}

      {showOpenTab && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Abrir Comanda</h3>
            <button onClick={() => setShowOpenTab(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </div>
          <input type="text" placeholder="Buscar jogador..."
            value={searchPlayer} onChange={(e) => setSearchPlayer(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white mb-2" />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {playerSearch?.players?.map((p) => (
              <button key={p.id}
                onClick={() => openTabMutation.mutate({ jogador_id: p.id })}
                disabled={openTabMutation.isPending}
                className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                <span>{p.nome} {p.nickname && `(${p.nickname})`}</span>
                <Plus size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />)
          ) : tabs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
              <Beer size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Nenhuma comanda aberta</p>
            </div>
          ) : (
            tabs.map((tab) => (
              <div key={tab.id} onClick={() => setSelectedTab(tab.id)}
                className={`cursor-pointer rounded-lg border bg-zinc-900 p-3 transition-colors hover:border-zinc-700 ${
                  selectedTab === tab.id ? 'border-emerald-600' : 'border-zinc-800'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{tab.jogador.nome}</p>
                    {tab.jogador.nickname && <p className="text-xs text-zinc-500">{tab.jogador.nickname}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-400">R$ {Number(tab.total).toFixed(2)}</p>
                    <p className="text-xs text-zinc-500">{tab.items.length} itens</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20">
              <Receipt size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Selecione uma comanda</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selected.jogador.nome}</h2>
                    <p className="text-xs text-zinc-500">
                      Aberta {new Date(selected.aberta_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-emerald-400">R$ {Number(selected.total).toFixed(2)}</p>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700"
                      onClick={() => { if (confirm('Fechar comanda?')) closeTabMutation.mutate({ tab_id: selected.id }) }}>
                      Fechar Comanda
                    </Button>
                  </div>
                </div>

                {selected.items.length > 0 && (
                  <div className="divide-y divide-zinc-800 border-t border-zinc-800 mt-3">
                    {selected.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div>
                          <span className="text-sm text-white">{item.produto.nome}</span>
                          <span className="ml-2 text-xs text-zinc-500">x{item.quantidade}</span>
                        </div>
                        <span className="text-sm text-zinc-300">R$ {Number(item.valor_total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Adicionar Item</h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  <Button variant="ghost" size="sm"
                    className={`text-xs ${selectedCategory === '' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    onClick={() => setSelectedCategory('')}>Todos</Button>
                  {categories?.map((c) => (
                    <Button key={c.id} variant="ghost" size="sm"
                      className={`text-xs ${selectedCategory === c.id ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                      onClick={() => setSelectedCategory(c.id)}>{c.nome}</Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {filteredProducts.map((p) => {
                    const qty = quantidades[p.id] || 1
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-2">
                        <div>
                          <p className="text-sm text-white">{p.nome}</p>
                          <p className="text-xs text-emerald-400">R$ {Number(p.preco).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setQuantidades({ ...quantidades, [p.id]: Math.max(1, qty - 1) })}
                            className="h-6 w-6 rounded bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700">-</button>
                          <span className="text-sm text-white w-6 text-center">{qty}</span>
                          <button onClick={() => setQuantidades({ ...quantidades, [p.id]: qty + 1 })}
                            className="h-6 w-6 rounded bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700">+</button>
                          <Button size="sm" className="h-6 ml-1 text-xs bg-emerald-600 hover:bg-emerald-700 px-2"
                            onClick={() => {
                              addItemMutation.mutate({ tab_id: selected.id, produto_id: p.id, quantidade: qty })
                              setQuantidades({ ...quantidades, [p.id]: 1 })
                            }}
                            disabled={addItemMutation.isPending}>
                            <Plus size={12} />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
