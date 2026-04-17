import type { FastifyRequest, FastifyReply } from 'fastify'
import '../types.ts'

const DEV_USER_ID = 'dev-user'
const DEV_USER_EMAIL = 'dev@canarygate.dev'

let devUserEnsured = false

async function ensureDevUser() {
  if (devUserEnsured) return
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
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.BYPASS_AUTH === 'true'
  ) {
    await ensureDevUser()
    request.userId = DEV_USER_ID
    request.userEmail = DEV_USER_EMAIL
    return
  }

  const { auth } = await import('../auth.ts')
  const reqHeaders = new Headers()
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === 'string') reqHeaders.set(key, value)
    else if (Array.isArray(value)) reqHeaders.set(key, value.join(', '))
  }
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session?.user) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  request.userId = session.user.id
  request.userEmail = session.user.email
}
