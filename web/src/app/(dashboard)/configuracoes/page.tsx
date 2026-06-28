'use client'

import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { ToastContainer } from '@/components/shared/toast-container'
import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc/client'

const configDescriptions: Record<string, string> = {
  rakeback_percentual: 'Percentual de rakeback padrão (%)',
  rake_percentual_torneio: 'Percentual de rake em torneios (%)',
  chip_dealer_padrao: 'Valor do chip dealer padrão (R$)',
  late_registration_padrao: 'Nível padrão de late registration',
  comanda_auto_open: 'Abrir comanda automaticamente no check-in',
  whatsapp_ativo: 'Integração WhatsApp ativa',
  horario_abertura: 'Horário de abertura da casa',
  horario_fechamento: 'Horário de fechamento da casa',
}

export default function ConfiguracoesPage() {
  const { toasts, success, error } = useToast()
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.config.getAll.useQuery()

  const saveMutation = trpc.config.setBulk.useMutation({
    onSuccess: () => { success('Configurações salvas!'); setHasChanges(false); utils.config.getAll.invalidate() },
    onError: (e) => error(e.message),
  })

  useEffect(() => {
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((c) => { map[c.chave] = typeof c.valor === 'string' ? c.valor : JSON.stringify(c.valor) })
      setConfigs(map)
    }
  }, [data])

  function handleChange(chave: string, valor: string) {
    setConfigs({ ...configs, [chave]: valor })
    setHasChanges(true)
  }

  function handleSave() {
    const items = Object.entries(configs).map(([chave, valor]) => {
      const num = Number(valor)
      return { chave, valor: !isNaN(num) && valor.trim() !== '' ? num : valor }
    })
    saveMutation.mutate({ configs: items })
  }

  const defaultConfigs = [
    'rakeback_percentual', 'rake_percentual_torneio', 'chip_dealer_padrao',
    'late_registration_padrao', 'horario_abertura', 'horario_fechamento',
    'comanda_auto_open', 'whatsapp_ativo',
  ]

  const allKeys = [...new Set([...defaultConfigs, ...Object.keys(configs)])]

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} />

      <PageHeader
        title="Configurações"
        description="Configurações da casa de poker"
        actions={
          hasChanges ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save size={16} className="mr-2" /> {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
          {allKeys.map((chave) => (
            <div key={chave} className="flex items-center justify-between px-4 py-4">
              <div className="flex-1 mr-4">
                <Label className="text-sm text-white">{chave}</Label>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {configDescriptions[chave] || 'Configuração personalizada'}
                </p>
              </div>
              <Input
                value={configs[chave] || ''}
                onChange={(e) => handleChange(chave, e.target.value)}
                className="w-48 border-zinc-700 bg-zinc-800 text-white"
                placeholder="Valor..."
              />
            </div>
          ))}
        </div>
      )}

      {/* Adicionar nova config */}
      <AddConfigRow onAdd={(chave, valor) => {
        handleChange(chave, valor)
        success(`Config "${chave}" adicionada`)
      }} />
    </div>
  )
}

function AddConfigRow({ onAdd }: { onAdd: (chave: string, valor: string) => void }) {
  const [chave, setChave] = useState('')
  const [valor, setValor] = useState('')

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="text-sm font-medium text-zinc-300 mb-3">Adicionar Configuração</h3>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (chave) { onAdd(chave, valor); setChave(''); setValor('') }
      }} className="flex gap-3">
        <Input value={chave} onChange={(e) => setChave(e.target.value)}
          placeholder="Chave (ex: minha_config)" className="border-zinc-700 bg-zinc-800 text-white" required />
        <Input value={valor} onChange={(e) => setValor(e.target.value)}
          placeholder="Valor" className="border-zinc-700 bg-zinc-800 text-white" />
        <Button type="submit" variant="outline" className="border-zinc-700 text-zinc-300">Adicionar</Button>
      </form>
    </div>
  )
}
