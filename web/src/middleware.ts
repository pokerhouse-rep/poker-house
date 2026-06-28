import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/login-player', '/forgot-password']

function decodeJwtPayload(token: string): { tipo?: string; isSuperAdmin?: boolean } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('poker-access-token')?.value

  if (pathname.startsWith('/display')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (isPublic) {
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload?.tipo === 'JOGADOR') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    if (pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/login-player', request.url))
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = decodeJwtPayload(token)

  if (pathname.startsWith('/portal') && payload?.tipo !== 'JOGADOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname.startsWith('/admin') && !payload?.isSuperAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!pathname.startsWith('/portal') && !pathname.startsWith('/admin') && payload?.tipo === 'JOGADOR') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
