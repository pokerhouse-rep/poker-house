'use client'

import Link from 'next/link'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <KeyRound size={24} className="text-amber-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">Esqueceu sua senha?</CardTitle>
          <CardDescription className="text-zinc-400">
            Para redefinir sua senha, entre em contato com a administração da sua casa de poker.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400 space-y-2">
            <p>O administrador pode redefinir sua senha diretamente pelo painel.</p>
            <p>Procure o responsável pela casa ou entre em contato pelo telefone/WhatsApp da casa.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/login-player">
              <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                <ArrowLeft size={16} className="mr-2" /> Voltar para login do jogador
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="w-full text-zinc-500">
                Acesso administrativo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
