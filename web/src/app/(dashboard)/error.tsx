'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertTriangle size={32} className="text-red-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">Algo deu errado</h2>
      <p className="mt-1 text-sm text-zinc-500 max-w-md text-center">
        {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700">
          Tentar novamente
        </Button>
        <Button variant="outline" className="border-zinc-700 text-zinc-300"
          onClick={() => window.location.href = '/dashboard'}>
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  )
}
