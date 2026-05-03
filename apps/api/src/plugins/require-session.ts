import type { FastifyRequest, FastifyReply } from 'fastify'
import '../types.ts'

const DEV_USER_ID = 'dev-user'
const DEV_USER_EMAIL = 'dev@canarygate.dev'

let devUserEnsured = false

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
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3000'

  return (
    process.env.NODE_ENV === 'development' &&
    process.env.BYPASS_AUTH === 'true' &&
    isLocalUrl(apiUrl) &&
    isLocalUrl(webUrl)
  )
}

async function ensureDevUser() {
  if (devUserEnsured) {
    return
  }

  const { db } = await import('@canarygate/database/client')
  const { users } = await import('@canarygate/database/schema')
  await db
    .insert(users)
    .values({
      id: DEV_USER_ID,
      name: 'Dev User',
      email: DEV_USER_EMAIL,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onConflictDoNothing()
  devUserEnsured = true
}

export async function requireSession(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (isLocalAuthBypassEnabled()) {
    await ensureDevUser()
    request.userId = DEV_USER_ID
    request.userEmail = DEV_USER_EMAIL
    return
  }

  const { auth } = await import('../auth.ts')
  const reqHeaders = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === 'string') {
      reqHeaders.set(key, value)
    } else if (Array.isArray(value)) {
      reqHeaders.set(key, value.join(', '))
    }
  }

  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session?.user) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  request.userId = session.user.id
  request.userEmail = session.user.email
}
