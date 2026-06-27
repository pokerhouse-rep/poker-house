'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

type OrgOption = { id: string; nome_fantasia: string }

export default function LoginPlayerPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [orgs, setOrgs] = useState<OrgOption[] | null>(null)
  const [selectedOrg, setSelectedOrg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const body: Record<string, string> = { tipo: 'player', cpf, senha }
      if (selectedOrg) body.organization_id = selectedOrg

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login')
        return
      }

      if (data.requireOrgSelection) {
        setOrgs(data.organizations)
        return
      }

      router.push('/portal')
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Poker Club
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Portal do Jogador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-zinc-300">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                required
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>

            {orgs && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Selecione a casa</Label>
                <div className="space-y-2">
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedOrg(org.id)}
                      className={`w-full rounded-md border p-3 text-left text-sm transition-colors ${
                        selectedOrg === org.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600'
                      }`}
                    >
                      {org.nome_fantasia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-zinc-300">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                Acesso administrativo
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
