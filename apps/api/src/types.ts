import 'fastify'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    userEmail: string
    orgRole: 'OWNER' | 'MEMBER'
    projectRole: 'ADMIN' | 'MEMBER' | null
  }
}
