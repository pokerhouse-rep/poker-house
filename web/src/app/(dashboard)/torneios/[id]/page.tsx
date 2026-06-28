'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, DollarSign, RefreshCw, Plus, Trophy,
  Play, Pause, Square, XCircle, CheckCircle, UserPlus,
  Repeat, Layers, ChevronRight, Clock, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

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

type FormaPagamento = 'DINHEIRO' | 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA' | 'CARTEIRA'

export default function TorneioDet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toasts, success, error } = useToast()
  const [selectedPayment, setSelectedPayment] = useState<FormaPagamento>('DINHEIRO')
  const [showPlayerSelect, setShowPlayerSelect] = useState(false)
  const [searchPlayer, setSearchPlayer] = useState('')

  const utils = trpc.useUtils()
  const { data: tournament, isLoading } = trpc.tournament.getById.useQuery({ id })
  const { data: players } = trpc.player.list.useQuery(
    { search: searchPlayer, page: 1, limit: 50 },
    { enabled: showPlayerSelect }
  )

  const invalidate = () => utils.tournament.getById.invalidate({ id })

  const openRegMutation = trpc.tournament.openRegistration.useMutation({
    onSuccess: () => { success('Inscrições abertas!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const startMutation = trpc.tournament.start.useMutation({
    onSuccess: () => { success('Torneio iniciado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const pauseMutation = trpc.tournament.pause.useMutation({
    onSuccess: () => { success('Torneio pausado'); invalidate() },
    onError: (e) => error(e.message),
  })
  const resumeMutation = trpc.tournament.resume.useMutation({
    onSuccess: () => { success('Torneio retomado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const finishMutation = trpc.tournament.finish.useMutation({
    onSuccess: () => { success('Torneio finalizado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const cancelMutation = trpc.tournament.cancel.useMutation({
    onSuccess: () => { success('Torneio cancelado'); invalidate() },
    onError: (e) => error(e.message),
  })
  const registerEntryMutation = trpc.tournament.registerEntry.useMutation({
    onSuccess: () => { success('Jogador inscrito!'); invalidate(); setShowPlayerSelect(false) },
    onError: (e) => error(e.message),
  })
  const rebuyMutation = trpc.tournament.registerRebuy.useMutation({
    onSuccess: () => { success('Rebuy registrado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const reentryMutation = trpc.tournament.registerReentry.useMutation({
    onSuccess: () => { success('Reentrada registrada!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const addonMutation = trpc.tournament.registerAddon.useMutation({
    onSuccess: () => { success('Add-on registrado!'); invalidate() },
    onError: (e) => error(e.message),
  })
  const eliminateMutation = trpc.tournament.eliminatePlayer.useMutation({
    onSuccess: () => { success('Jogador eliminado'); invalidate() },
    onError: (e) => error(e.message),
  })
  const advanceBlindMutation = trpc.tournament.advanceBlind.useMutation({
    onSuccess: () => { success('Blind avançado!'); invalidate() },
    onError: (e) => error(e.message),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-zinc-800" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 bg-zinc-800 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 bg-zinc-800 rounded-lg" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Trophy size={48} className="text-zinc-700" />
        <p className="mt-4 text-zinc-500">Torneio não encontrado</p>
        <Button variant="ghost" className="mt-4 text-zinc-400" onClick={() => router.push('/torneios')}>
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>
      </div>
    )
  }

  const t = tournament
  const activeEntries = t.entries.filter((e) => !e.eliminado)
  const eliminatedEntries = t.entries.filter((e) => e.eliminado)
  const currentBlind = t.blind_structure.levels.find((l) => l.nivel === t.nivel_atual)
  const nextBlind = t.blind_structure.levels.find((l) => l.nivel === t.nivel_atual + 1)
  const totalChips = t.entries.length * t.starting_stack +
    t.total_rebuys * (t.rebuy_fichas || 0) +
    t.total_reentradas * (t.reentrada_fichas || 0) +
    t.total_addons * (t.addon_fichas || 0)
  const avgStack = activeEntries.length > 0 ? Math.round(totalChips / activeEntries.length) : 0

  const canRegister = ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO'].includes(t.status)
  const canAction = ['INSCRICOES_ABERTAS', 'EM_ANDAMENTO'].includes(t.status)

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => router.push('/torneios')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{t.nome}</h1>
            <Badge className={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
          </div>
          <p className="text-sm text-zinc-500">
            Buy-in R$ {Number(t.buyin_valor).toFixed(2)}
            {Number(t.rake_valor) > 0 && ` + R$ ${Number(t.rake_valor).toFixed(2)} rake`}
          </p>
        </div>

        {/* Status actions */}
        <div className="flex gap-2">
          {t.status === 'RASCUNHO' && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openRegMutation.mutate({ id })} disabled={openRegMutation.isPending}>
              <CheckCircle size={14} className="mr-1" /> Abrir Inscrições
            </Button>
          )}
          {t.status === 'INSCRICOES_ABERTAS' && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => startMutation.mutate({ id })} disabled={startMutation.isPending}>
              <Play size={14} className="mr-1" /> Iniciar
            </Button>
          )}
          {t.status === 'EM_ANDAMENTO' && (
            <>
              <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300"
                onClick={() => pauseMutation.mutate({ id })} disabled={pauseMutation.isPending}>
                <Pause size={14} className="mr-1" /> Pausar
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
                onClick={() => finishMutation.mutate({ id })} disabled={finishMutation.isPending}>
                <Square size={14} className="mr-1" /> Finalizar
              </Button>
            </>
          )}
          {t.status === 'PAUSADO' && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => resumeMutation.mutate({ id })} disabled={resumeMutation.isPending}>
              <Play size={14} className="mr-1" /> Retomar
            </Button>
          )}
          {!['FINALIZADO', 'CANCELADO'].includes(t.status) && (
            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300"
              onClick={() => { if (confirm('Cancelar este torneio?')) cancelMutation.mutate({ id }) }}>
              <XCircle size={14} className="mr-1" /> Cancelar
            </Button>
          )}
          {['EM_ANDAMENTO', 'PAUSADO'].includes(t.status) && (
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300"
              onClick={() => router.push(`/display/${t.organization_id}/${t.id}`)}>
              <Eye size={14} className="mr-1" /> Display
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard title="Inscritos" value={t.total_inscritos}
          subtitle={`${activeEntries.length} em jogo`} icon={Users} color="blue" />
        <KpiCard title="Prize Pool" value={`R$ ${Number(t.prize_pool).toFixed(2)}`}
          subtitle={t.garantido_ativo && t.garantido_valor ? `Garantido: R$ ${Number(t.garantido_valor).toFixed(2)}` : undefined}
          icon={DollarSign} color="emerald" />
        <KpiCard title="Rebuys / Reentradas" value={`${t.total_rebuys} / ${t.total_reentradas}`}
          subtitle={`${t.total_addons} add-ons`} icon={RefreshCw} color="amber" />
        <KpiCard title="Stack Médio" value={avgStack.toLocaleString('pt-BR')}
          subtitle={currentBlind ? `Blind: ${currentBlind.small_blind}/${currentBlind.big_blind}` : 'Nível 0'}
          icon={Layers} color="purple" />
      </div>

      {/* Blind info bar */}
      {['EM_ANDAMENTO', 'PAUSADO'].includes(t.status) && currentBlind && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-zinc-500">Nível {currentBlind.nivel}</p>
              <p className="text-lg font-bold text-white">
                {currentBlind.is_break ? 'BREAK' : `${currentBlind.small_blind} / ${currentBlind.big_blind}`}
              </p>
            </div>
            {currentBlind.ante > 0 && (
              <div>
                <p className="text-xs text-zinc-500">Ante</p>
                <p className="text-lg font-bold text-amber-400">{currentBlind.ante}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-500">Duração</p>
              <p className="text-sm text-zinc-300"><Clock size={12} className="inline mr-1" />{currentBlind.duracao_minutos} min</p>
            </div>
            {nextBlind && (
              <>
                <ChevronRight size={16} className="text-zinc-600" />
                <div>
                  <p className="text-xs text-zinc-500">Próximo</p>
                  <p className="text-sm text-zinc-400">
                    {nextBlind.is_break ? 'Break' : `${nextBlind.small_blind}/${nextBlind.big_blind}`}
                  </p>
                </div>
              </>
            )}
          </div>
          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300"
            onClick={() => advanceBlindMutation.mutate({ tournament_id: id })}
            disabled={advanceBlindMutation.isPending}>
            Avançar Blind
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="jogadores">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="jogadores">Jogadores ({t.entries.length})</TabsTrigger>
          <TabsTrigger value="blinds">Blinds</TabsTrigger>
          <TabsTrigger value="premiacao">Premiação</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        {/* Jogadores tab */}
        <TabsContent value="jogadores" className="space-y-4">
          {canRegister && (
            <div className="flex items-center gap-3">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowPlayerSelect(!showPlayerSelect)}>
                <UserPlus size={14} className="mr-1" /> Inscrever Jogador
              </Button>
              <select value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value as FormaPagamento)}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white">
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO_CREDITO">Cartão Crédito</option>
                <option value="CARTAO_DEBITO">Cartão Débito</option>
                <option value="CARTEIRA">Carteira</option>
              </select>
            </div>
          )}

          {showPlayerSelect && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <input type="text" placeholder="Buscar jogador por nome..."
                value={searchPlayer} onChange={(e) => setSearchPlayer(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white mb-3" />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {players?.players?.map((p) => (
                  <button key={p.id}
                    onClick={() => registerEntryMutation.mutate({
                      tournament_id: id, jogador_id: p.id, forma_pagamento: selectedPayment,
                    })}
                    disabled={registerEntryMutation.isPending}
                    className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                    <span>{p.nome} {p.nickname && `(${p.nickname})`}</span>
                    <Plus size={14} />
                  </button>
                ))}
                {players?.players?.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhum jogador encontrado</p>
                )}
              </div>
            </div>
          )}

          {/* Active players */}
          {activeEntries.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-4 py-3">
                <h3 className="text-sm font-medium text-zinc-300">Em jogo ({activeEntries.length})</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {activeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-300">
                        {entry.jogador.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {entry.jogador.nome}
                          {entry.jogador.nickname && <span className="ml-1 text-zinc-500">({entry.jogador.nickname})</span>}
                        </p>
                        <div className="flex gap-2 text-xs text-zinc-500">
                          {entry.rebuys_realizados > 0 && <span>{entry.rebuys_realizados}x rebuy</span>}
                          {entry.reentradas_realizadas > 0 && <span>{entry.reentradas_realizadas}x reentrada</span>}
                          {entry.addon_realizado && <span>add-on</span>}
                          {entry.mesa_numero && <span>Mesa {entry.mesa_numero}</span>}
                          {entry.assento_numero && <span>Assento {entry.assento_numero}</span>}
                        </div>
                      </div>
                    </div>
                    {canAction && (
                      <div className="flex gap-1">
                        {t.rebuy_ativo && (!t.rebuy_maximo || entry.rebuys_realizados < t.rebuy_maximo) && (
                          <Button size="sm" variant="ghost" className="text-xs text-amber-400 hover:text-amber-300"
                            onClick={() => rebuyMutation.mutate({ entry_id: entry.id, forma_pagamento: selectedPayment })}
                            disabled={rebuyMutation.isPending}>
                            Rebuy
                          </Button>
                        )}
                        {t.reentrada_ativa && (!t.reentrada_maxima || entry.reentradas_realizadas < (t.reentrada_maxima ?? 0)) && (
                          <Button size="sm" variant="ghost" className="text-xs text-blue-400 hover:text-blue-300"
                            onClick={() => reentryMutation.mutate({ entry_id: entry.id, forma_pagamento: selectedPayment })}
                            disabled={reentryMutation.isPending}>
                            Reentrada
                          </Button>
                        )}
                        {t.addon_ativo && !entry.addon_realizado && (
                          <Button size="sm" variant="ghost" className="text-xs text-purple-400 hover:text-purple-300"
                            onClick={() => addonMutation.mutate({ entry_id: entry.id, forma_pagamento: selectedPayment })}
                            disabled={addonMutation.isPending}>
                            Add-on
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-xs text-red-400 hover:text-red-300"
                          onClick={() => eliminateMutation.mutate({ entry_id: entry.id })}
                          disabled={eliminateMutation.isPending}>
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eliminated players */}
          {eliminatedEntries.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-4 py-3">
                <h3 className="text-sm font-medium text-zinc-500">Eliminados ({eliminatedEntries.length})</h3>
              </div>
              <div className="divide-y divide-zinc-800">
                {eliminatedEntries
                  .sort((a, b) => (a.posicao_final ?? 999) - (b.posicao_final ?? 999))
                  .map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3 opacity-60">
                    <div className="flex items-center gap-3">
                      {entry.posicao_final && (
                        <span className="text-sm font-bold text-zinc-500 w-6 text-right">#{entry.posicao_final}</span>
                      )}
                      <p className="text-sm text-zinc-400">
                        {entry.jogador.nome}
                        {entry.jogador.nickname && <span className="ml-1 text-zinc-600">({entry.jogador.nickname})</span>}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs text-zinc-600">
                      {entry.rebuys_realizados > 0 && <span>{entry.rebuys_realizados}x rebuy</span>}
                      {entry.reentradas_realizadas > 0 && <span>{entry.reentradas_realizadas}x reentrada</span>}
                      {entry.addon_realizado && <span>add-on</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {t.entries.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
              <Users size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Nenhum jogador inscrito</p>
            </div>
          )}
        </TabsContent>

        {/* Blinds tab */}
        <TabsContent value="blinds">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="divide-y divide-zinc-800">
              {t.blind_structure.levels.map((level) => (
                <div key={level.id}
                  className={`flex items-center justify-between px-4 py-3 ${
                    level.nivel === t.nivel_atual ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500' : ''
                  }`}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-zinc-500 w-8">N{level.nivel}</span>
                    {level.is_break ? (
                      <span className="text-sm font-medium text-amber-400">BREAK</span>
                    ) : (
                      <span className="text-sm text-white">
                        {level.small_blind} / {level.big_blind}
                        {level.ante > 0 && <span className="text-zinc-500 ml-2">(ante {level.ante})</span>}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-zinc-500">{level.duracao_minutos} min</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Premiacao tab */}
        <TabsContent value="premiacao" className="space-y-4">
          {t.prizes.length > 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="divide-y divide-zinc-800">
                {t.prizes.map((prize) => (
                  <div key={prize.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-400">#{prize.posicao}</span>
                      <span className="text-sm text-white">R$ {Number(prize.valor_final).toFixed(2)}</span>
                      {prize.percentual && (
                        <span className="text-xs text-zinc-500">({Number(prize.percentual)}%)</span>
                      )}
                    </div>
                    {prize.is_deal && (
                      <Badge className="bg-amber-500/10 text-amber-400">Deal</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12">
              <Trophy size={40} className="text-zinc-700" />
              <p className="mt-3 text-zinc-500">Premiação ainda não definida</p>
            </div>
          )}
        </TabsContent>

        {/* Info tab */}
        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Dados do Torneio</h3>
              <InfoRow label="Buy-in" value={`R$ ${Number(t.buyin_valor).toFixed(2)}`} />
              <InfoRow label="Rake" value={`R$ ${Number(t.rake_valor).toFixed(2)}`} />
              <InfoRow label="Chip Dealer" value={`R$ ${Number(t.chip_dealer_valor).toFixed(2)}`} />
              <InfoRow label="Starting Stack" value={t.starting_stack.toLocaleString('pt-BR')} />
              <InfoRow label="Estrutura" value={t.blind_structure.nome} />
              {t.garantido_ativo && t.garantido_valor && (
                <InfoRow label="Garantido" value={`R$ ${Number(t.garantido_valor).toFixed(2)}`} />
              )}
              {t.late_registration_ativo && (
                <InfoRow label="Late Reg." value={`Até nível ${t.late_registration_ate_nivel}`} />
              )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Opções de Jogo</h3>
              <InfoRow label="Rebuy" value={t.rebuy_ativo
                ? `Sim — R$ ${Number(t.rebuy_valor).toFixed(2)} (${t.rebuy_fichas} fichas, máx ${t.rebuy_maximo})`
                : 'Não'} />
              <InfoRow label="Reentrada" value={t.reentrada_ativa
                ? `Sim — R$ ${Number(t.reentrada_valor).toFixed(2)} (${t.reentrada_fichas} fichas, máx ${t.reentrada_maxima})`
                : 'Não'} />
              <InfoRow label="Add-on" value={t.addon_ativo
                ? `Sim — R$ ${Number(t.addon_valor).toFixed(2)} (${t.addon_fichas} fichas)`
                : 'Não'} />
              {Number(t.overlay_valor) > 0 && (
                <InfoRow label="Overlay" value={`R$ ${Number(t.overlay_valor).toFixed(2)}`} />
              )}
              {t.data_inicio && (
                <InfoRow label="Início" value={new Date(t.data_inicio).toLocaleString('pt-BR')} />
              )}
              {t.data_fim && (
                <InfoRow label="Fim" value={new Date(t.data_fim).toLocaleString('pt-BR')} />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  )
}
