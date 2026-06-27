import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export type JWTPayload = {
  sub: string
  org: string
  tipo: 'ADMIN' | 'FUNCIONARIO' | 'JOGADOR'
  roles: string[]
  isSuperAdmin?: boolean
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 28800 }) // 8h in seconds
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: 2592000, // 30d in seconds
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}
