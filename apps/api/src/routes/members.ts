import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import {
  requireOrgMember,
  requireOrgOwner
} from '../plugins/require-org-access.ts'
import * as membersDb from '../db/members.ts'
import * as invitesDb from '../db/invites.ts'

export default async function membersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['members'], ...(route.schema ?? {}) }
  })

  app.get<{ Params: { orgId: string } }>('/orgs/:orgId/members', {
    preHandler: requireOrgMember,
    handler: async (request) => membersDb.listMembers(request.params.orgId)
  })

  app.delete<{ Params: { orgId: string; userId: string } }>(
    '/orgs/:orgId/members/:userId',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const { orgId, userId } = request.params
        const ok = await membersDb.removeMember(orgId, userId)
        if (!ok) return reply.status(404).send({ message: 'Member not found' })
        reply.status(204)
      }
    }
  )

  app.put<{ Params: { orgId: string; userId: string } }>(
    '/orgs/:orgId/members/:userId/make-owner',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const { orgId, userId } = request.params
        const member = await membersDb.makeOwner(orgId, userId)
        if (!member)
          return reply.status(404).send({ message: 'Member not found' })
        return member
      }
    }
  )

  app.get<{ Params: { orgId: string; userId: string } }>(
    '/orgs/:orgId/members/:userId/projects',
    {
      preHandler: requireOrgMember,
      handler: async (request, reply) => {
        const { orgId, userId } = request.params
        const projects = await membersDb.getMemberProjectAccess(orgId, userId)
        if (!projects)
          return reply.status(404).send({ message: 'Member not found' })
        return projects
      }
    }
  )

  app.post<{
    Params: { orgId: string; userId: string }
    Body: { projectId: string; role: 'ADMIN' | 'MEMBER' }
  }>('/orgs/:orgId/members/:userId/projects', {
    preHandler: requireOrgOwner,
    schema: {
      body: {
        type: 'object',
        required: ['projectId', 'role'],
        properties: {
          projectId: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MEMBER'] }
        }
      }
    },
    handler: async (request, reply) => {
      const { orgId, userId } = request.params
      const projects = await membersDb.addProjectAccess(
        orgId,
        userId,
        request.body
      )
      if (!projects)
        return reply.status(404).send({ message: 'Member not found' })
      reply.status(201)
      return projects
    }
  })

  app.put<{
    Params: { orgId: string; userId: string; projectId: string }
    Body: { role: 'ADMIN' | 'MEMBER' }
  }>('/orgs/:orgId/members/:userId/projects/:projectId', {
    preHandler: requireOrgOwner,
    schema: {
      body: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['ADMIN', 'MEMBER'] } }
      }
    },
    handler: async (request, reply) => {
      const { orgId, userId, projectId } = request.params
      const updated = await membersDb.updateProjectAccess(
        orgId,
        userId,
        projectId,
        request.body.role
      )
      if (!updated)
        return reply.status(404).send({ message: 'Project access not found' })
      return updated
    }
  })

  app.delete<{ Params: { orgId: string; userId: string; projectId: string } }>(
    '/orgs/:orgId/members/:userId/projects/:projectId',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const { orgId, userId, projectId } = request.params
        const ok = await membersDb.removeProjectAccess(orgId, userId, projectId)
        if (!ok)
          return reply.status(404).send({ message: 'Project access not found' })
        reply.status(204)
      }
    }
  )

  app.post<{
    Params: { orgId: string }
    Body: {
      email: string
      orgRole: 'OWNER' | 'MEMBER'
      projectId?: string
      projectRole?: 'ADMIN' | 'MEMBER'
    }
  }>('/orgs/:orgId/invites', {
    preHandler: requireOrgOwner,
    schema: {
      body: {
        type: 'object',
        required: ['email', 'orgRole'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          orgRole: { type: 'string', enum: ['OWNER', 'MEMBER'] },
          projectId: { type: 'string' },
          projectRole: { type: 'string', enum: ['ADMIN', 'MEMBER'] }
        }
      }
    },
    handler: async (request, reply) => {
      const invite = await invitesDb.createInvite(
        request.params.orgId,
        request.body
      )
      reply.status(201)
      return invite
    }
  })
}
