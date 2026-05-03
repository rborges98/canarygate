import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import * as historyDb from '../db/history.ts'
import * as invitesDb from '../db/invites.ts'

const INVITE_LOOKUP_RATE_LIMIT = { max: 20, timeWindow: '1 minute' }
const INVITE_MUTATION_RATE_LIMIT = { max: 10, timeWindow: '1 minute' }
const INVITE_TOKEN_SCHEMA = { type: 'string', format: 'uuid' } as const

export default async function invitesRoutes(app: FastifyInstance) {
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['invites'], ...(route.schema ?? {}) }
  })

  // Rota pública — não requer sessão
  app.get<{ Params: { token: string } }>('/invites/:token', {
    config: { rateLimit: INVITE_LOOKUP_RATE_LIMIT },
    schema: {
      params: {
        type: 'object',
        required: ['token'],
        properties: { token: INVITE_TOKEN_SCHEMA }
      }
    },
    handler: async (request, reply) => {
      try {
        const invite = await invitesDb.getInviteByToken(
          request.params.token,
          request.log
        )
        if (!invite) {
          return reply
            .status(404)
            .send({ message: 'Invite not found or expired' })
        }

        return {
          orgId: invite.orgId,
          orgName: invite.org?.name ?? '',
          orgRole: invite.orgRole,
          projectId: invite.projectId ?? null,
          projectName: invite.project?.name ?? null,
          projectRole: invite.projectRole ?? null,
          expiresAt: invite.expiresAt
        }
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.invites.get',
            token: request.params.token
          },
          'Failed in route.invites.get'
        )
        throw error
      }
    }
  })

  app.post<{ Params: { token: string } }>('/invites/:token/accept', {
    config: { rateLimit: INVITE_MUTATION_RATE_LIMIT },
    preHandler: requireSession,
    schema: {
      params: {
        type: 'object',
        required: ['token'],
        properties: { token: INVITE_TOKEN_SCHEMA }
      }
    },
    handler: async (request, reply) => {
      try {
        const invite = await invitesDb.getInviteByToken(
          request.params.token,
          request.log
        )
        const result = await invitesDb.acceptInvite(
          request.params.token,
          request.userId,
          request.userEmail,
          request.log
        )
        if (!result) {
          return reply
            .status(409)
            .send({ message: 'Invite not found, expired or already used' })
        }

        if (invite) {
          await historyDb.insertAuditLog(
            {
              orgId: invite.orgId,
              projectId: invite.projectId,
              resourceType: 'invite',
              resourceId: invite.id,
              resourceName: invite.email,
              action: 'accepted',
              actorEmail: request.userEmail,
              changes: {
                invitedEmail: invite.email,
                acceptedByUserId: request.userId,
                orgRole: invite.orgRole,
                projectRole: invite.projectRole
              }
            },
            request.log
          )
        }

        return { message: 'Invite accepted' }
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.invites.accept',
            token: request.params.token,
            userId: request.userId
          },
          'Failed in route.invites.accept'
        )
        throw error
      }
    }
  })

  app.post<{ Params: { token: string } }>('/invites/:token/decline', {
    config: { rateLimit: INVITE_MUTATION_RATE_LIMIT },
    preHandler: requireSession,
    schema: {
      params: {
        type: 'object',
        required: ['token'],
        properties: { token: INVITE_TOKEN_SCHEMA }
      }
    },
    handler: async (request, reply) => {
      try {
        const result = await invitesDb.declineInvite(
          request.params.token,
          request.userEmail,
          request.log
        )
        if (!result) {
          return reply
            .status(409)
            .send({ message: 'Invite not found or already used' })
        }

        return { message: 'Invite declined' }
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.invites.decline',
            token: request.params.token,
            userId: request.userId
          },
          'Failed in route.invites.decline'
        )
        throw error
      }
    }
  })
}
