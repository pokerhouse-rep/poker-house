import { NextResponse } from 'next/server'
import { loginAdmin, loginPlayer } from '@/server/services/auth/auth.service'
import { cookies } from 'next/headers'

async function setTokenCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  cookieStore.set('poker-access-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  cookieStore.set('poker-refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, ...credentials } = body

    let result

    if (tipo === 'admin') {
      result = await loginAdmin(credentials)
    } else if (tipo === 'player') {
      result = await loginPlayer(credentials)
    } else {
      return NextResponse.json(
        { error: 'Tipo de login inválido' },
        { status: 400 }
      )
    }

    if ('requireOrgSelection' in result) {
      return NextResponse.json(result)
    }

    await setTokenCookies(result.token, result.refreshToken)

    return NextResponse.json({ user: result.user })
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string }
    const status =
      err.code === 'UNAUTHORIZED' ? 401 :
      err.code === 'FORBIDDEN' ? 403 : 500

    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status }
    )
  }
}
