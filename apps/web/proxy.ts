import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { isLocalAuthBypassEnabled } from './shared/auth'

const PUBLIC_PATHS = ['/login', '/verify', '/invite', '/api/auth']

export function proxy(request: NextRequest) {
  if (isLocalAuthBypassEnabled()) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (isPublic) {
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
