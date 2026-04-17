import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getSessionOrRedirect() {
  if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_AUTH === 'true') {
    return {
      user: { id: 'dev-user', email: 'dev@local.dev', name: 'Dev User' }
    }
  }
  const { auth } = await import('./auth')
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session) redirect('/login')
  return session
}
