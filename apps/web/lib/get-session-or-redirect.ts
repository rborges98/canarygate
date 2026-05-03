import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { isLocalAuthBypassEnabled } from './is-local-auth-bypass-enabled'

export async function getSessionOrRedirect() {
  if (isLocalAuthBypassEnabled()) {
    return {
      user: { id: 'dev-user', email: 'dev@local.dev', name: 'Dev User' }
    }
  }
  const { auth } = await import('./auth')
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs })
  if (!session) {
    redirect('/login')
  }

  return session
}
