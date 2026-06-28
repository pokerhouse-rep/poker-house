'use client'

import { useState } from 'react'
import {
  Plus, Vault, DollarSign, ArrowDownCircle, ArrowUpCircle,
  X, Lock, Eye, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const tipoLabels: Record<string, string> = {
  TORNEIO: 'Torneio', MESA_CASH: 'Mesa Cash', BAR: 'Bar', GERAL: 'Geral',
}
const tipoColors: Record<string, string> = {
  TORNEIO: 'bg-emerald-500/10 text-emerald-400',
  MESA_CASH: 'bg-blue-500/10 text-blue-400',
  BAR: 'bg-amber-500/10 text-amber-400',
  GERAL: 'bg-zinc-500/10 text-zinc-400',
}

type CashRegisterId = string

export default function CaixaPage() {
  const { toasts, success, error } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showOpenForm, setShowOpenForm] = useState(false)
  const [selectedCaixa, setSelectedCaixa] = useState<CashRegisterId | null>(null)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [showSupplyForm, setShowSupplyForm] = useState(false)

  // Open form state
  const [openTipo, setOpenTipo] = useState<'TORNEIO' | 'MESA_CASH' | 'BAR' | 'GERAL'>('GERAL')
  const [openFundo, setOpenFundo] = useState('')

  // Close form state
  const [closeValor, setCloseValor] = useState('')
  const [closeJustificativa, setCloseJustificativa] = useState('')

  // Withdraw/Supply form state
  const [movValor, setMovValor] = useState('')
  const [movMotivo, setMovMotivo] = useState('')

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.cashRegister.list.useQuery({
    tipo: (tipoFilter as 'TORNEIO' | 'MESA_CASH' | 'BAR' | 'GERAL') || undefined,
    status: (statusFilter as 'ABERTO' | 'FECHADO') || undefined,
    page,
    limit: 20,
  })

  const { data: detail } = trpc.cashRegister.getById.useQuery(
    { id: selectedCaixa! },
    { enabled: !!selectedCaixa }
  )

  const invalidate = () => {
    utils.cashRegister.list.invalidate()
    if (selectedCaixa) utils.cashRegister.getById.invalidate({ id: selectedCaixa })
  }

  const openMutation = trpc.cashRegister.open.useMutation({
    onSuccess: () => { success('Caixa aberto!'); setShowOpenForm(false); setOpenFundo(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const closeMutation = trpc.cashRegister.close.useMutation({
    onSuccess: () => {
      success('Caixa fechado!'); setShowCloseForm(false)
      setCloseValor(''); setCloseJustificativa(''); invalidate()
    },
    onError: (e) => error(e.message),
  })
  const withdrawMutation = trpc.cashRegister.withdraw.useMutation({
    onSuccess: () => { success('Sangria registrada!'); setShowWithdrawForm(false); setMovValor(''); setMovMotivo(''); invalidate() },
    onError: (e) => error(e.message),
  })
  const supplyMutation = trpc.cashRegister.supply.useMutation({
    onSuccess: () => { success('Suprimento registrado!'); setShowSupplyForm(false); setMovValor(''); setMovMotivo(''); invalidate() },
    onError: (e) => error(e.message),
  })

  const registers = data?.registers || []
  const openRegisters = registers.filter((r) => r.status === 'ABERTO')

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Caixa"
        description={data ? `${data.total} caixas` : 'Carregando...'}
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowOpenForm(true)}>
            <Plus size={16} className="mr-2" /> Abrir Caixa
          </Button>
        }
      />

      {/* Abrir Caixa Form */}
      {showOpenForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Abrir Caixa</h2>
            <button onClick={() => setShowOpenForm(false)} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault()
            openMutation.mutate({ tipo: openTipo, fundo_troco: Number(openFundo || 0) })
          }} className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-zinc-400">Tipo *</Label>
              <select value={openTipo} onChange={(e) => setOpenTipo(e.target.value as typeof openTipo)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                <option value="GERAL">Geral</option>
                <option value="TORNEIO">Torneio</option>
                <option value="MESA_CASH">Mesa Cash</option>
                <option value="BAR">Bar</option>
              </select>
            </div>
            <div>
              <Label className="text-zinc-400">Fundo de Troco (R$)</Label>
              <Input type="number" step="0.01" value={openFundo}
                onChange={(e) => setOpenFundo(e.target.value)} placeholder="0.00"
                className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={openMutation.isPending}>
                {openMutation.isPending ? 'Abrindo...' : 'Abrir Caixa'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* KPIs dos caixas abertos */}
      {openRegisters.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard title="Caixas Abertos" value={openRegisters.length} icon={Vault} color="emerald" />
          <KpiCard title="Total Fundo Troco"
            value={`R$ ${openRegisters.reduce((s, r) => s + Number(r.fundo_troco), 0).toFixed(2)}`}
            icon={DollarSign} color="blue" />
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['', 'ABERTO', 'FECHADO'].map((s) => (
          <Button key={s} variant="ghost" size="sm"
            className={`text-xs ${statusFilter === s ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setStatusFilter(s); setPage(1) }}>
            {s === '' ? 'Todos' : s === 'ABERTO' ? 'Abertos' : 'Fechados'}
          </Button>
        ))}
        <div className="h-6 w-px bg-zinc-800 mx-1" />
        {['', 'GERAL', 'TORNEIO', 'MESA_CASH', 'BAR'].map((t) => (
          <Button key={t} variant="ghost" size="sm"
            className={`text-xs ${tipoFilter === t ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            onClick={() => { setTipoFilter(t); setPage(1) }}>
            {t === '' ? 'Todos Tipos' : tipoLabels[t]}
          </Button>
        ))}
      </div>

      {/* Layout: Lista + Detalhe */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Lista de caixas */}
        <div className="lg:col-span-2 space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />)
          ) : registers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
              <Vault size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Nenhum caixa encontrado</p>
            </div>
          ) : (
            registers.map((r) => (
              <div key={r.id}
                onClick={() => setSelectedCaixa(r.id)}
                className={`cursor-pointer rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${
                  selectedCaixa === r.id ? 'border-emerald-600' : 'border-zinc-800'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={tipoColors[r.tipo]}>{tipoLabels[r.tipo]}</Badge>
                    <Badge className={r.status === 'ABERTO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}>
                      {r.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {new Date(r.aberto_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Fundo: R$ {Number(r.fundo_troco).toFixed(2)}</span>
                  <span className="text-zinc-500 text-xs">por {r.aberto_por.nome}</span>
                </div>
                {r.status === 'FECHADO' && r.diferenca !== null && (
                  <div className="mt-1 text-xs">
                    <span className={Number(r.diferenca) === 0 ? 'text-emerald-400' : 'text-red-400'}>
                      Diferença: R$ {Number(r.diferenca).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Paginação */}
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="text-zinc-400">Anterior</Button>
              <span className="text-sm text-zinc-500 py-1">Página {page}</span>
              <Button variant="ghost" size="sm" disabled={registers.length < 20} onClick={() => setPage(page + 1)}
                className="text-zinc-400">Próxima</Button>
            </div>
          )}
        </div>

        {/* Detalhe do caixa selecionado */}
        <div className="lg:col-span-3">
          {!selectedCaixa ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-20">
              <Eye size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Selecione um caixa para ver detalhes</p>
            </div>
          ) : !detail ? (
            <Skeleton className="h-96 rounded-lg bg-zinc-800" />
          ) : (
            <div className="space-y-4">
              {/* Header do detalhe */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className={tipoColors[detail.register.tipo]}>{tipoLabels[detail.register.tipo]}</Badge>
                    <Badge className={detail.register.status === 'ABERTO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}>
                      {detail.register.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                  {detail.register.status === 'ABERTO' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-zinc-700 text-red-400 hover:text-red-300"
                        onClick={() => { setShowWithdrawForm(true); setShowSupplyForm(false) }}>
                        <ArrowUpCircle size={14} className="mr-1" /> Sangria
                      </Button>
                      <Button size="sm" variant="outline" className="border-zinc-700 text-emerald-400 hover:text-emerald-300"
                        onClick={() => { setShowSupplyForm(true); setShowWithdrawForm(false) }}>
                        <ArrowDownCircle size={14} className="mr-1" /> Suprimento
                      </Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700"
                        onClick={() => setShowCloseForm(true)}>
                        <Lock size={14} className="mr-1" /> Fechar Caixa
                      </Button>
                    </div>
                  )}
                </div>

                {/* KPIs do caixa */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">Fundo de Troco</p>
                    <p className="text-lg font-bold text-white">R$ {Number(detail.register.fundo_troco).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Entradas</p>
                    <p className="text-lg font-bold text-emerald-400">R$ {detail.total_entradas.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Saídas</p>
                    <p className="text-lg font-bold text-red-400">R$ {detail.total_saidas.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Saldo Atual</p>
                    <p className="text-xl font-bold text-white">R$ {detail.saldo.toFixed(2)}</p>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <p>Aberto por {detail.register.aberto_por.nome}</p>
                    <p>{new Date(detail.register.aberto_em).toLocaleString('pt-BR')}</p>
                    {detail.register.fechado_por && (
                      <p>Fechado por {detail.register.fechado_por.nome}</p>
                    )}
                  </div>
                </div>
                {detail.register.status === 'FECHADO' && detail.register.diferenca !== null && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Valor Informado:</span>
                      <span className="text-white">R$ {Number(detail.register.valor_informado).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Valor Esperado:</span>
                      <span className="text-white">R$ {Number(detail.register.valor_esperado).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Diferença:</span>
                      <span className={Number(detail.register.diferenca) === 0 ? 'text-emerald-400' : 'text-red-400'}>
                        R$ {Number(detail.register.diferenca).toFixed(2)}
                      </span>
                    </div>
                    {detail.register.justificativa_diferenca && (
                      <p className="mt-1 text-xs text-zinc-500 italic">
                        {detail.register.justificativa_diferenca}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Form Fechar Caixa */}
              {showCloseForm && (
                <div className="rounded-lg border border-red-900/50 bg-zinc-950 p-4">
                  <h3 className="text-sm font-medium text-white mb-3">Fechar Caixa</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    closeMutation.mutate({
                      id: selectedCaixa,
                      valor_informado: Number(closeValor),
                      justificativa_diferenca: closeJustificativa || undefined,
                    })
                  }} className="space-y-3">
                    <div>
                      <Label className="text-zinc-400">Valor em caixa informado (R$) *</Label>
                      <Input type="number" step="0.01" value={closeValor}
                        onChange={(e) => setCloseValor(e.target.value)}
                        className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Justificativa (se houver diferença)</Label>
                      <Input value={closeJustificativa}
                        onChange={(e) => setCloseJustificativa(e.target.value)}
                        placeholder="Explique a diferença..."
                        className="mt-1 border-zinc-700 bg-zinc-800 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" className="text-zinc-400" onClick={() => setShowCloseForm(false)}>Cancelar</Button>
                      <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={closeMutation.isPending}>
                        {closeMutation.isPending ? 'Fechando...' : 'Confirmar Fechamento'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Form Sangria */}
              {showWithdrawForm && (
                <MovForm title="Sangria" color="red"
                  valor={movValor} motivo={movMotivo}
                  onValorChange={setMovValor} onMotivoChange={setMovMotivo}
                  onCancel={() => { setShowWithdrawForm(false); setMovValor(''); setMovMotivo('') }}
                  onSubmit={() => withdrawMutation.mutate({ caixa_id: selectedCaixa, valor: Number(movValor), motivo: movMotivo })}
                  isPending={withdrawMutation.isPending} />
              )}

              {/* Form Suprimento */}
              {showSupplyForm && (
                <MovForm title="Suprimento" color="emerald"
                  valor={movValor} motivo={movMotivo}
                  onValorChange={setMovValor} onMotivoChange={setMovMotivo}
                  onCancel={() => { setShowSupplyForm(false); setMovValor(''); setMovMotivo('') }}
                  onSubmit={() => supplyMutation.mutate({ caixa_id: selectedCaixa, valor: Number(movValor), motivo: movMotivo })}
                  isPending={supplyMutation.isPending} />
              )}

              {/* Movimentações */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3">
                  <h3 className="text-sm font-medium text-zinc-300">Movimentações ({detail.transactions.length})</h3>
                </div>
                {detail.transactions.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-sm">Nenhuma movimentação</div>
                ) : (
                  <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
                    {detail.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-1.5 ${
                            tx.tipo === 'CREDITO' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {tx.tipo === 'CREDITO' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                          </div>
                          <div>
                            <p className="text-sm text-white">{tx.categoria}</p>
                            {tx.descricao && <p className="text-xs text-zinc-500">{tx.descricao}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${tx.tipo === 'CREDITO' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.tipo === 'CREDITO' ? '+' : '-'} R$ {Number(tx.valor).toFixed(2)}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
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

function MovForm({ title, color, valor, motivo, onValorChange, onMotivoChange, onCancel, onSubmit, isPending }: {
  title: string; color: 'red' | 'emerald'
  valor: string; motivo: string
  onValorChange: (v: string) => void; onMotivoChange: (v: string) => void
  onCancel: () => void; onSubmit: () => void; isPending: boolean
}) {
  return (
    <div className={`rounded-lg border ${color === 'red' ? 'border-red-900/50' : 'border-emerald-900/50'} bg-zinc-950 p-4`}>
      <h3 className="text-sm font-medium text-white mb-3">{title}</h3>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-zinc-400">Valor (R$) *</Label>
            <Input type="number" step="0.01" value={valor} onChange={(e) => onValorChange(e.target.value)}
              className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
          </div>
          <div>
            <Label className="text-zinc-400">Motivo *</Label>
            <Input value={motivo} onChange={(e) => onMotivoChange(e.target.value)}
              placeholder="Descreva o motivo..." className="mt-1 border-zinc-700 bg-zinc-800 text-white" required />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="text-zinc-400" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" className={color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            disabled={isPending}>
            {isPending ? 'Registrando...' : `Confirmar ${title}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
