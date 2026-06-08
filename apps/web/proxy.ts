import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { isLocalAuthBypassEnabled } from './shared/auth/bypass'

const PUBLIC_PATHS = [
  '/',
  '/docs',
  '/home',
  '/login',
  '/verify',
  '/invite',
  '/api/auth',
  '/manifest.json'
]

function isPublicAssetPath(pathname: string) {
  return /\.[^/]+$/.test(pathname)
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((publicPath) => {
    if (publicPath === '/') {
      return pathname === publicPath
    }

    return pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  })
}

export function proxy(request: NextRequest) {
  if (isLocalAuthBypassEnabled()) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  if (isPublicAssetPath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)']
}
