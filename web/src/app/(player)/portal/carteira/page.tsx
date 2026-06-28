'use client'

export default function CarteiraPage() {
  const saldos = [
    { tipo: 'Disponível', valor: 1250.00, color: 'text-emerald-400' },
    { tipo: 'Premiações', valor: 500.00, color: 'text-amber-400' },
    { tipo: 'Rakeback', valor: 140.00, color: 'text-blue-400' },
    { tipo: 'Bônus', valor: 0, color: 'text-purple-400' },
    { tipo: 'Promocional', valor: 0, color: 'text-pink-400' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Carteira</h1>

      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5">
        <p className="text-sm text-emerald-100">Saldo Total</p>
        <p className="mt-1 text-3xl font-bold text-white">R$ 1.890,00</p>
      </div>

      <div className="space-y-2">
        {saldos.map((s) => (
          <div key={s.tipo} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <span className="text-sm text-zinc-400">{s.tipo}</span>
            <span className={`font-medium ${s.color}`}>
              R$ {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
