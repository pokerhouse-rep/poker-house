import { cookies } from 'next/headers'

const ACCESS_TOKEN_KEY = 'poker-access-token'
const REFRESH_TOKEN_KEY = 'poker-refresh-token'

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies()

  cookieStore.set(ACCESS_TOKEN_KEY, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8h
  })

  cookieStore.set(REFRESH_TOKEN_KEY, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30d
  })
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_KEY)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_TOKEN_KEY)?.value ?? null
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_KEY)
  cookieStore.delete(REFRESH_TOKEN_KEY)
}
