import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/provider'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Poker Club - Gestão de Casas de Poker',
  description: 'Plataforma SaaS para gerenciamento completo de casas de poker',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
