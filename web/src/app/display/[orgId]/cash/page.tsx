'use client'

export default function CashWaitlistDisplayPage() {
  // TODO: conectar Supabase Realtime
  const tables = [
    { nome: 'Mesa 1 — NL 2/5', jogadores: 9, max: 9, waitlist: ['João P.', 'Maria S.', 'Carlos B.'] },
    { nome: 'Mesa 2 — NL 5/10', jogadores: 6, max: 9, waitlist: ['Pedro K.'] },
    { nome: 'Mesa 3 — PLO 2/5', jogadores: 8, max: 9, waitlist: [] },
  ]

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white select-none">
      <div className="flex items-center justify-between bg-zinc-900 px-8 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-emerald-400">♠</span>
          <h1 className="text-2xl font-bold">Cash Game — Mesas e Lista de Espera</h1>
        </div>
        <p className="text-zinc-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="flex-1 grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {tables.map((table, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{table.nome}</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                table.jogadores >= table.max
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {table.jogadores}/{table.max}
              </span>
            </div>

            {table.waitlist.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Lista de Espera</p>
                <div className="space-y-2">
                  {table.waitlist.map((name, j) => (
                    <div key={j} className="flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-bold text-emerald-400">
                        {j + 1}
                      </span>
                      <span className="text-lg">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-center rounded-lg border border-dashed border-zinc-800 py-8">
                <p className="text-zinc-600">
                  {table.jogadores >= table.max ? 'Sem espera' : 'Vagas disponíveis'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
