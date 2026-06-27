import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

export type UserContext = {
  id: string
  organizationId: string
  tipo: 'ADMIN' | 'FUNCIONARIO' | 'JOGADOR'
  roles: string[]
  isSuperAdmin: boolean
}

export type Context = {
  user: UserContext | null
  ip: string | null
  userAgent: string | null
}

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<Context> {
  const { req } = opts

  // TODO: implementar extração do JWT e validação
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  const userAgent = req.headers.get('user-agent')

  return {
    user: null,
    ip,
    userAgent,
  }
}
