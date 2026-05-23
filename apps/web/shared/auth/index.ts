import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export type SessionUser = {
  id: string
  email: string
  name: string
  image?: string | null
}

function isLocalUrl(value: string | undefined) {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export function isLocalAuthBypassEnabled() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  return (
    process.env.NODE_ENV === 'development' &&
    process.env.BYPASS_AUTH === 'true' &&
    isLocalUrl(appUrl) &&
    isLocalUrl(apiUrl)
  )
}

const BYPASS_SESSION = {
  user: {
    id: 'dev-user',
    email: 'dev@local.dev',
    name: 'Dev User',
    image: null
  }
} satisfies { user: SessionUser }

export async function getSession() {
  if (isLocalAuthBypassEnabled()) {
    return BYPASS_SESSION
  }

  const { auth } = await import('@/services/auth/server')
  const hdrs = await headers()

  return auth.api.getSession({ headers: hdrs })
}

export async function getSessionOrRedirect() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}
