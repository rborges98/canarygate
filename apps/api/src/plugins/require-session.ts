import type { FastifyRequest, FastifyReply } from 'fastify'
import '../types.ts'

export async function requireSession(
  request: FastifyRequest,
  reply: FastifyReply
) {
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
