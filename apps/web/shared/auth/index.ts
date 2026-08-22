import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export type SessionUser = {
  id: string
  email: string
  name: string
  image?: string | null
}

export const getSession = cache(async () => {
  const { auth } = await import('@/services/auth/server')
  const hdrs = await headers()

  return auth.api.getSession({ headers: hdrs })
})

export async function getSessionOrRedirect() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return session
}
