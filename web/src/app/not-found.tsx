import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <p className="text-6xl font-bold text-zinc-800">404</p>
      <p className="mt-2 text-lg text-zinc-400">Página não encontrada</p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 transition-colors">
          Ir para o Dashboard
        </Link>
        <Link href="/portal"
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          Portal do Jogador
        </Link>
      </div>
    </div>
  )
}
