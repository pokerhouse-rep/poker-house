import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { verifyToken, type JWTPayload } from '@/lib/auth/jwt'

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

function extractTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie')
  if (!cookie) return null

  const match = cookie.match(/poker-access-token=([^;]+)/)
  return match ? match[1] : null
}

function mapPayloadToUser(payload: JWTPayload): UserContext {
  return {
    id: payload.sub,
    organizationId: payload.org,
    tipo: payload.tipo,
    roles: payload.roles,
    isSuperAdmin: payload.isSuperAdmin ?? false,
  }
}

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<Context> {
  const { req } = opts

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  const userAgent = req.headers.get('user-agent')

  const token = extractTokenFromRequest(req)
  let user: UserContext | null = null

  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      user = mapPayloadToUser(payload)
    }
  }

  return { user, ip, userAgent }
}
