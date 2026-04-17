import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import * as invitesDb from '../db/invites.ts'

export default async function invitesRoutes(app: FastifyInstance) {
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['invites'], ...(route.schema ?? {}) }
  })

  // Rota pública — não requer sessão
  app.get<{ Params: { token: string } }>('/invites/:token', {
    handler: async (request, reply) => {
      const invite = await invitesDb.getInviteByToken(request.params.token)
      if (!invite)
        return reply
          .status(404)
          .send({ message: 'Invite not found or expired' })
      return {
        orgId: invite.orgId,
        orgName: invite.org?.name ?? '',
        email: invite.email,
        orgRole: invite.orgRole,
        projectId: invite.projectId ?? null,
        projectName: invite.project?.name ?? null,
        projectRole: invite.projectRole ?? null,
        expiresAt: invite.expiresAt
      }
    }
  })

  app.post<{ Params: { token: string } }>('/invites/:token/accept', {
    preHandler: requireSession,
    handler: async (request, reply) => {
      const result = await invitesDb.acceptInvite(
        request.params.token,
        request.userId,
        request.userEmail
      )
      if (!result)
        return reply
          .status(409)
          .send({ message: 'Invite not found, expired or already used' })
      return { message: 'Invite accepted' }
    }
  })

  app.post<{ Params: { token: string } }>('/invites/:token/decline', {
    preHandler: requireSession,
    handler: async (request, reply) => {
      const result = await invitesDb.declineInvite(
        request.params.token,
        request.userEmail
      )
      if (!result)
        return reply
          .status(409)
          .send({ message: 'Invite not found or already used' })
      return { message: 'Invite declined' }
    }
  })
}
