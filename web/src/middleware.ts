import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/login-player', '/forgot-password', '/display']
const PLAYER_ROUTES = ['/portal']
const ADMIN_ROUTES_PREFIX = '/'

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

function isDisplayRoute(pathname: string) {
  return pathname.startsWith('/display')
}

function isPlayerRoute(pathname: string) {
  return pathname.startsWith('/portal')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('poker-access-token')?.value

  if (isDisplayRoute(pathname)) {
    return NextResponse.next()
  }

  if (isPublicRoute(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
