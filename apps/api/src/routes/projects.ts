import type { FastifyInstance } from 'fastify'
import { isIP } from 'node:net'
import { requireSession } from '../plugins/require-session.ts'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { orgMembers } from '@canarygate/database/schema'
import {
  requireOrgMember,
  requireOrgOwner,
  requireProjectAccess,
  requireProjectAdmin
} from '../plugins/require-org-access.ts'
import * as historyDb from '../db/history.ts'
import * as projectsDb from '../db/projects.ts'
import * as environmentsDb from '../db/environments.ts'
import {
  nameSchema,
  orgParamsSchema,
  orgProjectParamsSchema,
  orgSlugParamsSchema,
  slugSchema
} from './validation.ts'

function getWebhookHost(webhookUrl: string | null | undefined) {
  if (!webhookUrl) {
    return null
  }

  try {
    return new URL(webhookUrl).host
  } catch {
    return null
  }
}

function normalizeHostname(hostname: string) {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1)
  }

  return hostname
}

function isPrivateIpv4Address(hostname: string) {
  const octets = hostname.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return false
  }

  const [firstOctet, secondOctet] = octets

  return (
    firstOctet === 0 ||
    firstOctet === 10 ||
    firstOctet === 127 ||
    (firstOctet === 169 && secondOctet === 254) ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168)
  )
}

function isBlockedWebhookHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname).toLowerCase()

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname.endsWith('.localhost') ||
    normalizedHostname === 'host.docker.internal'
  ) {
    return true
  }

  const ipVersion = isIP(normalizedHostname)
  if (ipVersion === 4) {
    return isPrivateIpv4Address(normalizedHostname)
  }

  if (ipVersion === 6) {
    return (
      normalizedHostname === '::1' ||
      normalizedHostname.startsWith('fe80:') ||
      normalizedHostname.startsWith('fc') ||
      normalizedHostname.startsWith('fd')
    )
  }

  return false
}

export default async function projectsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['projects'], ...(route.schema ?? {}) }
  })

  app.get<{ Params: { orgId: string } }>('/orgs/:orgId/projects', {
    preHandler: requireOrgMember,
    schema: {
      params: orgParamsSchema
    },
    handler: async (request) => {
      const { orgId } = request.params
      try {
        if (request.orgRole === 'OWNER') {
          return projectsDb.listProjectsByOrg(orgId, undefined, request.log)
        }

        const membership = await db.query.orgMembers.findFirst({
          where: and(
            eq(orgMembers.orgId, orgId),
            eq(orgMembers.userId, request.userId)
          ),
          columns: { id: true }
        })
        return projectsDb.listProjectsByOrg(orgId, membership?.id, request.log)
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.projects.list',
            orgId,
            userId: request.userId
          },
          'Failed in route.projects.list'
        )
        throw error
      }
    }
  })

  app.post<{ Params: { orgId: string }; Body: { name: string; slug: string } }>(
    '/orgs/:orgId/projects',
    {
      preHandler: requireOrgOwner,
      schema: {
        params: orgParamsSchema,
        body: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: nameSchema,
            slug: slugSchema
          }
        }
      },
      handler: async (request, reply) => {
        try {
          const project = await projectsDb.createProject(
            request.params.orgId,
            request.body,
            request.log
          )
          await environmentsDb.createDefaultEnvironments(
            project.id,
            request.log
          )
          reply.status(201)
          return project
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.create',
              orgId: request.params.orgId,
              slug: request.body.slug
            },
            'Failed in route.projects.create'
          )
          throw error
        }
      }
    }
  )

  app.get<{ Params: { orgId: string; slug: string } }>(
    '/orgs/:orgId/projects/slug/:slug',
    {
      preHandler: requireOrgMember,
      schema: {
        params: orgSlugParamsSchema
      },
      handler: async (request, reply) => {
        try {
          let project = null

          if (request.orgRole === 'OWNER') {
            const ownerProject = await projectsDb.getProjectBySlug(
              request.params.orgId,
              request.params.slug,
              request.log
            )
            if (ownerProject) {
              project = { ...ownerProject, projectRole: 'ADMIN' as const }
            }
          } else {
            const membership = await db.query.orgMembers.findFirst({
              where: and(
                eq(orgMembers.orgId, request.params.orgId),
                eq(orgMembers.userId, request.userId)
              ),
              columns: { id: true }
            })

            if (!membership) {
              return reply.status(403).send({ message: 'Forbidden' })
            }

            project = await projectsDb.getProjectBySlugForOrgMember(
              request.params.orgId,
              request.params.slug,
              membership.id,
              request.log
            )
          }

          if (!project) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          return project
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.getBySlug',
              orgId: request.params.orgId,
              slug: request.params.slug,
              userId: request.userId
            },
            'Failed in route.projects.getBySlug'
          )
          throw error
        }
      }
    }
  )

  app.get<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId',
    {
      preHandler: requireProjectAccess,
      schema: {
        params: orgProjectParamsSchema
      },
      handler: async (request, reply) => {
        try {
          const project = await projectsDb.getProjectById(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (!project) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          return project
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.getById',
              orgId: request.params.orgId,
              projectId: request.params.projectId
            },
            'Failed in route.projects.getById'
          )
          throw error
        }
      }
    }
  )

  app.put<{
    Params: { orgId: string; projectId: string }
    Body: { name: string; slug: string }
  }>('/orgs/:orgId/projects/:projectId', {
    preHandler: requireProjectAdmin,
    schema: {
      params: orgProjectParamsSchema,
      body: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: nameSchema,
          slug: slugSchema
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const project = await projectsDb.updateProject(
          request.params.orgId,
          request.params.projectId,
          request.body,
          request.log
        )
        if (!project) {
          return reply.status(404).send({ message: 'Project not found' })
        }

        return project
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.projects.update',
            orgId: request.params.orgId,
            projectId: request.params.projectId,
            slug: request.body.slug
          },
          'Failed in route.projects.update'
        )
        throw error
      }
    }
  })

  app.delete<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId',
    {
      preHandler: requireProjectAdmin,
      schema: {
        params: orgProjectParamsSchema
      },
      handler: async (request, reply) => {
        try {
          const project = await projectsDb.getProjectById(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (!project) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          const ok = await projectsDb.deleteProject(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (!ok) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          await historyDb.insertAuditLog(
            {
              orgId: request.params.orgId,
              projectId: project.id,
              resourceType: 'project',
              resourceId: project.id,
              resourceName: project.name,
              action: 'deleted',
              actorEmail: request.userEmail,
              changes: {
                slug: project.slug,
                active: project.active
              }
            },
            request.log
          )

          reply.status(204)
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.delete',
              orgId: request.params.orgId,
              projectId: request.params.projectId
            },
            'Failed in route.projects.delete'
          )
          throw error
        }
      }
    }
  )

  app.patch<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/toggle',
    {
      preHandler: requireProjectAdmin,
      schema: {
        params: orgProjectParamsSchema
      },
      handler: async (request, reply) => {
        try {
          const project = await projectsDb.toggleProject(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (!project) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          return project
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.toggle',
              orgId: request.params.orgId,
              projectId: request.params.projectId
            },
            'Failed in route.projects.toggle'
          )
          throw error
        }
      }
    }
  )

  app.get<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/api-key',
    {
      preHandler: requireProjectAdmin,
      schema: {
        params: orgProjectParamsSchema
      },
      handler: async (request, reply) => {
        try {
          const apiKey = await projectsDb.getApiKey(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (apiKey === null) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          return { apiKey: apiKey.slice(0, 12) + '••••••••••••••••••••' }
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.getApiKey',
              orgId: request.params.orgId,
              projectId: request.params.projectId
            },
            'Failed in route.projects.getApiKey'
          )
          throw error
        }
      }
    }
  )

  app.post<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/api-key/regenerate',
    {
      preHandler: requireProjectAdmin,
      schema: {
        params: orgProjectParamsSchema
      },
      handler: async (request, reply) => {
        try {
          const project = await projectsDb.getProjectById(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (!project) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          const newKey = await projectsDb.regenerateApiKey(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (newKey === null) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          await historyDb.insertAuditLog(
            {
              orgId: request.params.orgId,
              projectId: project.id,
              resourceType: 'api_key',
              resourceId: project.id,
              resourceName: project.name,
              action: 'regenerated',
              actorEmail: request.userEmail,
              changes: {
                apiKeyPrefix: newKey.slice(0, 12)
              }
            },
            request.log
          )

          return { apiKey: newKey }
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.regenerateApiKey',
              orgId: request.params.orgId,
              projectId: request.params.projectId
            },
            'Failed in route.projects.regenerateApiKey'
          )
          throw error
        }
      }
    }
  )

  app.get<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/webhook',
    {
      preHandler: requireProjectAccess,
      schema: {
        params: orgProjectParamsSchema
      },
      handler: async (request, reply) => {
        try {
          const webhookUrl = await projectsDb.getWebhook(
            request.params.orgId,
            request.params.projectId,
            request.log
          )
          if (webhookUrl === undefined) {
            return reply.status(404).send({ message: 'Project not found' })
          }

          return { webhookUrl }
        } catch (error) {
          request.log.error(
            {
              err: error,
              scope: 'route.projects.getWebhook',
              orgId: request.params.orgId,
              projectId: request.params.projectId
            },
            'Failed in route.projects.getWebhook'
          )
          throw error
        }
      }
    }
  )

  app.put<{
    Params: { orgId: string; projectId: string }
    Body: { webhookUrl: string | null }
  }>('/orgs/:orgId/projects/:projectId/webhook', {
    preHandler: requireProjectAdmin,
    schema: {
      params: orgProjectParamsSchema,
      body: {
        type: 'object',
        required: ['webhookUrl'],
        properties: {
          webhookUrl: {
            anyOf: [
              {
                type: 'string',
                format: 'uri',
                pattern: '^https://.+'
              },
              { type: 'null' }
            ]
          }
        }
      }
    },
    handler: async (request, reply) => {
      try {
        const previousWebhookUrl = await projectsDb.getWebhook(
          request.params.orgId,
          request.params.projectId,
          request.log
        )
        if (previousWebhookUrl === undefined) {
          return reply.status(404).send({ message: 'Project not found' })
        }

        const { webhookUrl } = request.body
        if (webhookUrl !== null) {
          const parsedWebhookUrl = new URL(webhookUrl)
          if (parsedWebhookUrl.protocol !== 'https:') {
            return reply
              .status(400)
              .send({ message: 'Webhook URL must use HTTPS' })
          }

          if (isBlockedWebhookHostname(parsedWebhookUrl.hostname)) {
            return reply.status(400).send({
              message:
                'Webhook URL cannot target localhost or private network addresses'
            })
          }
        }
        const project = await projectsDb.updateWebhook(
          request.params.orgId,
          request.params.projectId,
          webhookUrl,
          request.log
        )
        if (!project) {
          return reply.status(404).send({ message: 'Project not found' })
        }

        await historyDb.insertAuditLog(
          {
            orgId: request.params.orgId,
            projectId: project.id,
            resourceType: 'webhook',
            resourceId: project.id,
            resourceName: project.name,
            action: 'updated',
            actorEmail: request.userEmail,
            changes: {
              beforeConfigured: previousWebhookUrl !== null,
              afterConfigured: project.webhookUrl !== null,
              beforeHost: getWebhookHost(previousWebhookUrl),
              afterHost: getWebhookHost(project.webhookUrl)
            }
          },
          request.log
        )

        return { webhookUrl: project.webhookUrl }
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.projects.updateWebhook',
            orgId: request.params.orgId,
            projectId: request.params.projectId,
            webhookConfigured: request.body.webhookUrl !== null
          },
          'Failed in route.projects.updateWebhook'
        )
        throw error
      }
    }
  })
}
