'use client'

import { useState } from 'react'
import {
  Plus, Spade, X, Users, DollarSign, UserPlus,
  LogOut, Coins, Lock, Unlock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA' | 'CARTEIRA'

const statusColors: Record<string, string> = {
  ABERTA: 'bg-emerald-500/10 text-emerald-400',
  CHEIA: 'bg-red-500/10 text-red-400',
  FECHADA: 'bg-zinc-500/10 text-zinc-400',
}

export default function CashGamePage() {
  const { toasts, success, error } = useToast()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showSeatForm, setShowSeatForm] = useState(false)
  const [searchPlayer, setSearchPlayer] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<FormaPagamento>('DINHEIRO')

  // Create form
  const [form, setForm] = useState({
    nome: '', modalidade: 'NL Hold\'em', stakes: '', blind_small: '',
    blind_big: '', buyin_minimo: '', buyin_maximo: '', max_jogadores: '9',
    rake_tipo: 'POT_RAKE' as 'POT_RAKE' | 'TIME_RAKE',
    rake_percentual: '', rake_cap: '', rake_valor_hora: '',
  })

  // Seat form
  const [seatBuyin, setSeatBuyin] = useState('')

  // Buy chips / Cashout
  const [buyChipsId, setBuyChipsId] = useState<string | null>(null)
  const [buyChipsValor, setBuyChipsValor] = useState('')
  const [cashoutId, setCashoutId] = useState<string | null>(null)
  const [cashoutValor, setCashoutValor] = useState('')

  // Rake
  const [showRakeForm, setShowRakeForm] = useState(false)
  const [rakeValor, setRakeValor] = useState('')

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.cashTable.list.useQuery({ page: 1, limit: 50 })
  const { data: players } = trpc.player.list.useQuery(
    { search: searchPlayer, page: 1, limit: 50 },
    { enabled: showSeatForm }
  )

  const invalidate = () => utils.cashTable.list.invalidate()

  const createMutation = trpc.cashTable.create.useMutation({
    onSuccess: () => { success('Mesa criada!'); setShowCreateForm(false); invalidate() },
    onError: (e) => error(e.message),
  })
  const openMutation = trpc.cashTable.open.useMutation({
    onSuccess: () => { success('Mesa aberta!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const closeMutation = trpc.cashTable.close.useMutation({
    onSuccess: () => { success('Mesa fechada!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const seatMutation = trpc.cashTable.seatPlayer.useMutation({
    onSuccess: () => { success('Jogador sentado!'); setShowSeatForm(false); setSeatBuyin(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const buyChipsMutation = trpc.cashTable.buyChips.useMutation({
    onSuccess: () => { success('Fichas compradas!'); setBuyChipsId(null); setBuyChipsValor(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const cashoutMutation = trpc.cashTable.cashoutPlayer.useMutation({
    onSuccess: (result) => {
      success(`Cashout! Resultado: R$ ${result.resultado.toFixed(2)}`)
      setCashoutId(null); setCashoutValor(''); invalidate()
    },
    onError: (e) => error(e.message),
  })
  const rakeMutation = trpc.cashTable.registerRake.useMutation({
    onSuccess: () => { success('Rake registrado!'); setShowRakeForm(false); setRakeValor(''); invalidate() },
    onError: (e) => error(e.message),
  })

  const tables = data?.tables || []
  const selected = tables.find((t) => t.id === selectedTable)

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Cash Game"
        description={data ? `${data.total} mesas` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowCreateForm(true)}>
            <Plus size={16} className="mr-2" /> Nova Mesa
          </Button>
        }
      />

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Nova Mesa</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              nome: form.nome, modalidade: form.modalidade, stakes: form.stakes,
              blind_small: Number(form.blind_small), blind_big: Number(form.blind_big),
              buyin_minimo: Number(form.buyin_minimo), buyin_maximo: Number(form.buyin_maximo),
              max_jogadores: Number(form.max_jogadores),
              rake_tipo: form.rake_tipo,
              rake_percentual: form.rake_percentual ? Number(form.rake_percentual) : undefined,
              rake_cap: form.rake_cap ? Number(form.rake_cap) : undefined,
              rake_valor_hora: form.rake_valor_hora ? Number(form.rake_valor_hora) : undefined,
            })
          }} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">Nome da mesa *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Mesa 1" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Modalidade</Label>
                <Input value={form.modalidade} onChange={(e) => setForm({ ...form, modalidade: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400">Stakes *</Label>
                <Input value={form.stakes} onChange={(e) => setForm({ ...form, stakes: e.target.value })}
                  placeholder="Ex: 2/5" className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Small Blind *</Label>
                <Input type="number" step="0.01" value={form.blind_small}
                  onChange={(e) => setForm({ ...form, blind_small: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Big Blind *</Label>
                <Input type="number" step="0.01" value={form.blind_big}
                  onChange={(e) => setForm({ ...form, blind_big: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Buy-in Mínimo *</Label>
                <Input type="number" step="0.01" value={form.buyin_minimo}
                  onChange={(e) => setForm({ ...form, buyin_minimo: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Buy-in Máximo *</Label>
                <Input type="number" step="0.01" value={form.buyin_maximo}
                  onChange={(e) => setForm({ ...form, buyin_maximo: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
              </div>
              <div>
                <Label className="text-zinc-400">Máx Jogadores</Label>
                <Input type="number" value={form.max_jogadores}
                  onChange={(e) => setForm({ ...form, max_jogadores: e.target.value })}
                  className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
              </div>
              <div>
                <Label className="text-zinc-400">Tipo de Rake</Label>
                <select value={form.rake_tipo}
                  onChange={(e) => setForm({ ...form, rake_tipo: e.target.value as 'POT_RAKE' | 'TIME_RAKE' })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                  <option value="POT_RAKE">Pot Rake</option>
                  <option value="TIME_RAKE">Time Rake</option>
                </select>
              </div>
              {form.rake_tipo === 'POT_RAKE' && (
                <>
                  <div>
                    <Label className="text-zinc-400">Rake %</Label>
                    <Input type="number" step="0.01" value={form.rake_percentual}
                      onChange={(e) => setForm({ ...form, rake_percentual: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div>
                    <Label className="text-zinc-400">Rake Cap (R$)</Label>
                    <Input type="number" step="0.01" value={form.rake_cap}
                      onChange={(e) => setForm({ ...form, rake_cap: e.target.value })}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                </>
              )}
              {form.rake_tipo === 'TIME_RAKE' && (
                <div>
                  <Label className="text-zinc-400">Valor/Hora (R$)</Label>
                  <Input type="number" step="0.01" value={form.rake_valor_hora}
                    onChange={(e) => setForm({ ...form, rake_valor_hora: e.target.value })}
                    className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Mesa'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Layout: Mesas + Detalhe */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lista de mesas */}
        <div className="lg:col-span-2 space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg bg-zinc-800" />)
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16">
              <Spade size={48} className="text-zinc-700" />
              <p className="mt-4 text-zinc-500">Nenhuma mesa cadastrada</p>
            </div>
          ) : (
            tables.map((t) => (
              <div key={t.id} onClick={() => setSelectedTable(t.id)}
                className={`cursor-pointer rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${
                  selectedTable === t.id ? 'border-emerald-600' : 'border-zinc-800'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{t.nome}</h3>
                  <Badge className={statusColors[t.status]}>{t.status === 'FECHADA' ? 'Fechada' : t.status === 'CHEIA' ? 'Cheia' : 'Aberta'}</Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{t.modalidade} · {t.stakes}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    <Users size={14} className="inline mr-1" />
                    {t._count.sessions}/{t.max_jogadores}
                  </span>
                  {t.waitlist.length > 0 && (
                    <span className="text-xs text-amber-400">{t.waitlist.length} na lista de espera</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalhe da mesa */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20">
              <Spade size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Selecione uma mesa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header da mesa */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selected.nome}</h2>
                    <p className="text-sm text-zinc-500">{selected.modalidade} · {selected.stakes} · Buy-in R$ {Number(selected.buyin_minimo).toFixed(0)}–{Number(selected.buyin_maximo).toFixed(0)}</p>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === 'FECHADA' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => openMutation.mutate({ id: selected.id })} disabled={openMutation.isPending}>
                        <Unlock size={14} className="mr-1" /> Abrir Mesa
                      </Button>
                    )}
                    {['ABERTA', 'CHEIA'].includes(selected.status) && (
                      <>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => setShowSeatForm(!showSeatForm)}>
                          <UserPlus size={14} className="mr-1" /> Sentar Jogador
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-amber-400"
                          onClick={() => setShowRakeForm(!showRakeForm)}>
                          <Coins size={14} className="mr-1" /> Rake
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400"
                          onClick={() => { if (confirm('Fechar mesa?')) closeMutation.mutate({ id: selected.id }) }}
                          disabled={closeMutation.isPending}>
                          <Lock size={14} className="mr-1" /> Fechar
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Info resumo */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Jogadores</p>
                    <p className="text-lg font-bold text-white">{selected._count.sessions}/{selected.max_jogadores}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Rake</p>
                    <p className="text-sm text-white">
                      {selected.rake_tipo === 'POT_RAKE'
                        ? `${Number(selected.rake_percentual)}% (cap R$ ${Number(selected.rake_cap).toFixed(2)})`
                        : `R$ ${Number(selected.rake_valor_hora).toFixed(2)}/h`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Espera</p>
                    <p className="text-lg font-bold text-amber-400">{selected.waitlist.length}</p>
                  </div>
                </div>
              </div>

              {/* Forma de pagamento */}
              {['ABERTA', 'CHEIA'].includes(selected.status) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Pagamento:</span>
                  <select value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value as FormaPagamento)}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white">
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão Débito</option>
                    <option value="CARTEIRA">Carteira</option>
                  </select>
                </div>
              )}

              {/* Seat player form */}
              {showSeatForm && (
                <div className="rounded-lg border border-blue-900/50 bg-zinc-950 p-4">
                  <h3 className="text-sm font-medium text-white mb-3">Sentar Jogador</h3>
                  <input type="text" placeholder="Buscar jogador..."
                    value={searchPlayer} onChange={(e) => setSearchPlayer(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white mb-2" />
                  <div className="mb-3">
                    <Label className="text-zinc-400 text-xs">Buy-in (R$) *</Label>
                    <Input type="number" step="0.01" value={seatBuyin}
                      onChange={(e) => setSeatBuyin(e.target.value)}
                      placeholder={`${Number(selected.buyin_minimo)}–${Number(selected.buyin_maximo)}`}
                      className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {players?.players?.map((p) => (
                      <button key={p.id}
                        onClick={() => {
                          if (!seatBuyin) { error('Informe o buy-in'); return }
                          seatMutation.mutate({
                            table_id: selected.id, jogador_id: p.id,
                            buyin_valor: Number(seatBuyin), forma_pagamento: selectedPayment,
                          })
                        }}
                        disabled={seatMutation.isPending}
                        className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                        <span>{p.nome} {p.nickname && `(${p.nickname})`}</span>
                        <Plus size={14} />
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-zinc-500" onClick={() => setShowSeatForm(false)}>Cancelar</Button>
                </div>
              )}

              {/* Rake form */}
              {showRakeForm && (
                <div className="rounded-lg border border-amber-900/50 bg-zinc-950 p-4">
                  <h3 className="text-sm font-medium text-white mb-3">Registrar Rake</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    rakeMutation.mutate({ table_id: selected.id, valor: Number(rakeValor) })
                  }} className="flex gap-3">
                    <Input type="number" step="0.01" value={rakeValor}
                      onChange={(e) => setRakeValor(e.target.value)} placeholder="Valor (R$)"
                      className="border-zinc-700 bg-zinc-800 text-white" required />
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={rakeMutation.isPending}>
                      Registrar
                    </Button>
                    <Button type="button" variant="ghost" className="text-zinc-500" onClick={() => setShowRakeForm(false)}>Cancelar</Button>
                  </form>
                </div>
              )}

              {/* Jogadores sentados */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-medium text-zinc-300">Jogadores na mesa ({selected.sessions.length})</h3>
                </div>
                {selected.sessions.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-sm">Nenhum jogador sentado</div>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {selected.sessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-300">
                            {s.jogador.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {s.jogador.nome}
                              {s.jogador.nickname && <span className="ml-1 text-zinc-500">({s.jogador.nickname})</span>}
                            </p>
                            {s.assento_numero && <p className="text-xs text-zinc-500">Assento {s.assento_numero}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {buyChipsId === s.id ? (
                            <form onSubmit={(e) => {
                              e.preventDefault()
                              buyChipsMutation.mutate({ session_id: s.id, valor: Number(buyChipsValor), forma_pagamento: selectedPayment })
                            }} className="flex gap-1">
                              <Input type="number" step="0.01" value={buyChipsValor}
                                onChange={(e) => setBuyChipsValor(e.target.value)}
                                placeholder="R$" className="w-24 h-8 text-xs border-zinc-700 bg-zinc-800 text-white" required />
                              <Button type="submit" size="sm" className="h-8 text-xs bg-blue-600" disabled={buyChipsMutation.isPending}>OK</Button>
                              <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-zinc-500"
                                onClick={() => setBuyChipsId(null)}>X</Button>
                            </form>
                          ) : cashoutId === s.id ? (
                            <form onSubmit={(e) => {
                              e.preventDefault()
                              cashoutMutation.mutate({ session_id: s.id, fichas_valor: Number(cashoutValor) })
                            }} className="flex gap-1">
                              <Input type="number" step="0.01" value={cashoutValor}
                                onChange={(e) => setCashoutValor(e.target.value)}
                                placeholder="Fichas R$" className="w-24 h-8 text-xs border-zinc-700 bg-zinc-800 text-white" required />
                              <Button type="submit" size="sm" className="h-8 text-xs bg-red-600" disabled={cashoutMutation.isPending}>OK</Button>
                              <Button type="button" size="sm" variant="ghost" className="h-8 text-xs text-zinc-500"
                                onClick={() => setCashoutId(null)}>X</Button>
                            </form>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" className="text-xs text-blue-400"
                                onClick={() => { setBuyChipsId(s.id); setCashoutId(null) }}>
                                <DollarSign size={12} className="mr-1" /> Comprar
                              </Button>
                              <Button size="sm" variant="ghost" className="text-xs text-red-400"
                                onClick={() => { setCashoutId(s.id); setBuyChipsId(null) }}>
                                <LogOut size={12} className="mr-1" /> Cashout
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
