import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import {
  requireOrgMember,
  requireOrgOwner
} from '../plugins/require-org-access.ts'
import * as historyDb from '../db/history.ts'
import * as membersDb from '../db/members.ts'
import * as invitesDb from '../db/invites.ts'
import {
  orgParamsSchema,
  orgUserParamsSchema,
  orgUserProjectParamsSchema,
  uuidSchema
} from './validation.ts'

export default async function membersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['members'], ...(route.schema ?? {}) }
  })

  app.get<{ Params: { orgId: string } }>('/orgs/:orgId/members', {
    preHandler: requireOrgMember,
    schema: {
      params: orgParamsSchema
    },
    handler: async (request) => {
      try {
        return await membersDb.listMembers(request.params.orgId, request.log)
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.members.list',
            orgId: request.params.orgId,
            userId: request.userId
          },
          'Failed in route.members.list'
        )
        throw error
      }
    }
  })

  app.delete<{ Params: { orgId: string; userId: string } }>(
    '/orgs/:orgId/members/:userId',
    {
      preHandler: requireOrgOwner,
      schema: {
        params: orgUserParamsSchema
      },
      handler: async (request, reply) => {
        const { orgId, userId } = request.params
        try {
          const member = await membersDb.getMemberSummary(
            orgId,
            userId,
            request.log
          )
          if (!member) {
            return reply.status(404).send({ message: 'Member not found' })
          }

          const ok = await membersDb.removeMember(orgId, userId, request.log)
          if (!ok) {
            return reply.status(404).send({ message: 'Member not found' })
          }

          await historyDb.insertAuditLog(
            {
              orgId,
              resourceType: 'member',
              resourceId: userId,
              resourceName: member.email || userId,
              action: 'deleted',
              actorEmail: request.userEmail,
              changes: {
                targetUserId: userId,
                targetEmail: member.email || null,
                previousOrgRole: member.role
              }
            },
            request.log
          )

          reply.status(204)
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.members.remove',
              orgId,
              userId
            },
            'Failed in route.members.remove'
          )
          throw error
        }
      }
    }
  )

  app.put<{ Params: { orgId: string; userId: string } }>(
    '/orgs/:orgId/members/:userId/make-owner',
    {
      preHandler: requireOrgOwner,
      schema: {
        params: orgUserParamsSchema
      },
      handler: async (request, reply) => {
        const { orgId, userId } = request.params
        try {
          const memberBeforeUpdate = await membersDb.getMemberSummary(
            orgId,
            userId,
            request.log
          )
          if (!memberBeforeUpdate) {
            return reply.status(404).send({ message: 'Member not found' })
          }

          const member = await membersDb.makeOwner(orgId, userId, request.log)
          if (!member) {
            return reply.status(404).send({ message: 'Member not found' })
          }

          await historyDb.insertAuditLog(
            {
              orgId,
              resourceType: 'member',
              resourceId: userId,
              resourceName: memberBeforeUpdate.email || userId,
              action: 'role_changed',
              actorEmail: request.userEmail,
              changes: {
                scope: 'org',
                targetUserId: userId,
                targetEmail: memberBeforeUpdate.email || null,
                before: memberBeforeUpdate.role,
                after: member.role
              }
            },
            request.log
          )

          return member
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.members.makeOwner',
              orgId,
              userId
            },
            'Failed in route.members.makeOwner'
          )
          throw error
        }
      }
    }
  )

  app.get<{ Params: { orgId: string; userId: string } }>(
    '/orgs/:orgId/members/:userId/projects',
    {
      preHandler: requireOrgMember,
      schema: {
        params: orgUserParamsSchema
      },
      handler: async (request, reply) => {
        const { orgId, userId } = request.params
        try {
          const projects = await membersDb.getMemberProjectAccess(
            orgId,
            userId,
            request.log
          )
          if (!projects) {
            return reply.status(404).send({ message: 'Member not found' })
          }

          return projects
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.members.getProjectAccess',
              orgId,
              userId
            },
            'Failed in route.members.getProjectAccess'
          )
          throw error
        }
      }
    }
  )

  app.post<{
    Params: { orgId: string; userId: string }
    Body: { projectId: string; role: 'ADMIN' | 'MEMBER' }
  }>('/orgs/:orgId/members/:userId/projects', {
    preHandler: requireOrgOwner,
    schema: {
      params: orgUserParamsSchema,
      body: {
        type: 'object',
        required: ['projectId', 'role'],
        properties: {
          projectId: uuidSchema,
          role: { type: 'string', enum: ['ADMIN', 'MEMBER'] }
        }
      }
    },
    handler: async (request, reply) => {
      const { orgId, userId } = request.params
      try {
        const memberProjectsBeforeChange =
          await membersDb.getMemberProjectAccess(orgId, userId, request.log)
        const projects = await membersDb.addProjectAccess(
          orgId,
          userId,
          request.body,
          request.log
        )
        if (!projects) {
          return reply
            .status(404)
            .send({ message: 'Member or project not found' })
        }

        const projectAccess = projects.find(
          (project) => project.projectId === request.body.projectId
        )

        await historyDb.insertAuditLog(
          {
            orgId,
            projectId: request.body.projectId,
            resourceType: 'project_member',
            resourceId: `${userId}:${request.body.projectId}`,
            resourceName: projectAccess?.name ?? request.body.projectId,
            action: 'created',
            actorEmail: request.userEmail,
            changes: {
              targetUserId: userId,
              before:
                memberProjectsBeforeChange?.find(
                  (project) => project.projectId === request.body.projectId
                )?.role ?? null,
              after: request.body.role
            }
          },
          request.log
        )

        reply.status(201)
        return projects
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.members.addProjectAccess',
            orgId,
            userId,
            projectId: request.body.projectId
          },
          'Failed in route.members.addProjectAccess'
        )
        throw error
      }
    }
  })

  app.put<{
    Params: { orgId: string; userId: string; projectId: string }
    Body: { role: 'ADMIN' | 'MEMBER' }
  }>('/orgs/:orgId/members/:userId/projects/:projectId', {
    preHandler: requireOrgOwner,
    schema: {
      params: orgUserProjectParamsSchema,
      body: {
        type: 'object',
        required: ['role'],
        properties: { role: { type: 'string', enum: ['ADMIN', 'MEMBER'] } }
      }
    },
    handler: async (request, reply) => {
      const { orgId, userId, projectId } = request.params
      try {
        const memberProjectsBeforeChange =
          await membersDb.getMemberProjectAccess(orgId, userId, request.log)
        const projectAccessBeforeUpdate = memberProjectsBeforeChange?.find(
          (project) => project.projectId === projectId
        )
        const updated = await membersDb.updateProjectAccess(
          orgId,
          userId,
          projectId,
          request.body.role,
          request.log
        )
        if (!updated) {
          return reply.status(404).send({ message: 'Project access not found' })
        }

        await historyDb.insertAuditLog(
          {
            orgId,
            projectId,
            resourceType: 'project_member',
            resourceId: `${userId}:${projectId}`,
            resourceName: projectAccessBeforeUpdate?.name ?? projectId,
            action: 'role_changed',
            actorEmail: request.userEmail,
            changes: {
              targetUserId: userId,
              before: projectAccessBeforeUpdate?.role ?? null,
              after: updated.role
            }
          },
          request.log
        )

        return updated
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.members.updateProjectAccess',
            orgId,
            userId,
            projectId
          },
          'Failed in route.members.updateProjectAccess'
        )
        throw error
      }
    }
  })

  app.delete<{ Params: { orgId: string; userId: string; projectId: string } }>(
    '/orgs/:orgId/members/:userId/projects/:projectId',
    {
      preHandler: requireOrgOwner,
      schema: {
        params: orgUserProjectParamsSchema
      },
      handler: async (request, reply) => {
        const { orgId, userId, projectId } = request.params
        try {
          const memberProjectsBeforeChange =
            await membersDb.getMemberProjectAccess(orgId, userId, request.log)
          const projectAccessBeforeDelete = memberProjectsBeforeChange?.find(
            (project) => project.projectId === projectId
          )
          const ok = await membersDb.removeProjectAccess(
            orgId,
            userId,
            projectId,
            request.log
          )
          if (!ok) {
            return reply
              .status(404)
              .send({ message: 'Project access not found' })
          }

          await historyDb.insertAuditLog(
            {
              orgId,
              projectId,
              resourceType: 'project_member',
              resourceId: `${userId}:${projectId}`,
              resourceName: projectAccessBeforeDelete?.name ?? projectId,
              action: 'deleted',
              actorEmail: request.userEmail,
              changes: {
                targetUserId: userId,
                previousRole: projectAccessBeforeDelete?.role ?? null
              }
            },
            request.log
          )

          reply.status(204)
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.members.removeProjectAccess',
              orgId,
              userId,
              projectId
            },
            'Failed in route.members.removeProjectAccess'
          )
          throw error
        }
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
      params: orgParamsSchema,
      body: {
        type: 'object',
        required: ['email', 'orgRole'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          orgRole: { type: 'string', enum: ['OWNER', 'MEMBER'] },
          projectId: uuidSchema,
          projectRole: { type: 'string', enum: ['ADMIN', 'MEMBER'] }
        }
      }
    },
    handler: async (request, reply) => {
      const { projectId, projectRole } = request.body
      if ((projectId && !projectRole) || (!projectId && projectRole)) {
        return reply.status(400).send({
          message: 'projectId and projectRole must be provided together'
        })
      }

      try {
        const invite = await invitesDb.createInvite(
          request.params.orgId,
          request.body,
          request.log
        )
        if (!invite) {
          return reply.status(404).send({ message: 'Project not found' })
        }

        await historyDb.insertAuditLog(
          {
            orgId: request.params.orgId,
            projectId: invite.projectId,
            resourceType: 'invite',
            resourceId: invite.id,
            resourceName: invite.email,
            action: 'created',
            actorEmail: request.userEmail,
            changes: {
              orgRole: invite.orgRole,
              projectRole: invite.projectRole,
              expiresAt: invite.expiresAt.toISOString()
            }
          },
          request.log
        )

        reply.status(201)
        return invite
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.members.createInvite',
            orgId: request.params.orgId,
            projectId: projectId ?? null,
            email: request.body.email
          },
          'Failed in route.members.createInvite'
        )
        throw error
      }
    }
  })
}
