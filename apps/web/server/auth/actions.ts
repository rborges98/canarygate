'use server'

import { headers } from 'next/headers'
import { logServerError } from '@canarygate/logger'
import { auth } from '@/services/auth/server'
import { getSession } from '@/shared/auth'

type RevokeAllSessionsResult = {
  ok: boolean
  message?: string
}

export async function revokeAllSessions(): Promise<RevokeAllSessionsResult> {
  try {
    const session = await getSession()

    if (!session || !('session' in session)) {
      return { ok: false }
    }

    const hdrs = await headers()
    const sessions = await auth.api.listSessions({ headers: hdrs })

    for (const item of sessions) {
      if (item.token === session.session.token) {
        continue
      }

      await auth.api.revokeSession({
        headers: hdrs,
        body: { token: item.token }
      })
    }

    return { ok: true }
  } catch (error) {
    logServerError('revokeAllSessions falhou', error)
    return { ok: false }
  }
}
