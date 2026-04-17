import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import {
  requireOrgMember,
  requireOrgOwner
} from '../plugins/require-org-access.ts'
import * as projectsDb from '../db/projects.ts'

export default async function projectsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['projects'], ...(route.schema ?? {}) }
  })

  app.get<{ Params: { orgId: string } }>('/orgs/:orgId/projects', {
    preHandler: requireOrgMember,
    handler: async (request) =>
      projectsDb.listProjectsByOrg(request.params.orgId)
  })

  app.post<{ Params: { orgId: string }; Body: { name: string; slug: string } }>(
    '/orgs/:orgId/projects',
    {
      preHandler: requireOrgMember,
      schema: {
        body: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', maxLength: 100 },
            slug: {
              type: 'string',
              maxLength: 50,
              pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
            }
          }
        }
      },
      handler: async (request, reply) => {
        const project = await projectsDb.createProject(
          request.params.orgId,
          request.body
        )
        reply.status(201)
        return project
      }
    }
  )

  app.get<{ Params: { orgId: string; slug: string } }>(
    '/orgs/:orgId/projects/slug/:slug',
    {
      preHandler: requireOrgMember,
      handler: async (request, reply) => {
        const project = await projectsDb.getProjectBySlug(
          request.params.orgId,
          request.params.slug
        )
        if (!project)
          return reply.status(404).send({ message: 'Project not found' })
        return project
      }
    }
  )

  app.get<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId',
    {
      preHandler: requireOrgMember,
      handler: async (request, reply) => {
        const project = await projectsDb.getProjectById(
          request.params.orgId,
          request.params.projectId
        )
        if (!project)
          return reply.status(404).send({ message: 'Project not found' })
        return project
      }
    }
  )

  app.put<{
    Params: { orgId: string; projectId: string }
    Body: { name: string; slug: string }
  }>('/orgs/:orgId/projects/:projectId', {
    preHandler: requireOrgOwner,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          slug: {
            type: 'string',
            maxLength: 50,
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
          }
        }
      }
    },
    handler: async (request, reply) => {
      const project = await projectsDb.updateProject(
        request.params.orgId,
        request.params.projectId,
        request.body
      )
      if (!project)
        return reply.status(404).send({ message: 'Project not found' })
      return project
    }
  })

  app.delete<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const ok = await projectsDb.deleteProject(
          request.params.orgId,
          request.params.projectId
        )
        if (!ok) return reply.status(404).send({ message: 'Project not found' })
        reply.status(204)
      }
    }
  )

  app.patch<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/toggle',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const project = await projectsDb.toggleProject(
          request.params.orgId,
          request.params.projectId
        )
        if (!project)
          return reply.status(404).send({ message: 'Project not found' })
        return project
      }
    }
  )

  app.get<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/api-key',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const apiKey = await projectsDb.getApiKey(
          request.params.orgId,
          request.params.projectId
        )
        if (apiKey === null)
          return reply.status(404).send({ message: 'Project not found' })
        return { apiKey: apiKey.slice(0, 12) + '••••••••••••••••••••' }
      }
    }
  )

  app.post<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/api-key/regenerate',
    {
      preHandler: requireOrgOwner,
      handler: async (request, reply) => {
        const newKey = await projectsDb.regenerateApiKey(
          request.params.orgId,
          request.params.projectId
        )
        if (newKey === null)
          return reply.status(404).send({ message: 'Project not found' })
        return { apiKey: newKey }
      }
    }
  )

  app.get<{ Params: { orgId: string; projectId: string } }>(
    '/orgs/:orgId/projects/:projectId/webhook',
    {
      preHandler: requireOrgMember,
      handler: async (request, reply) => {
        const webhookUrl = await projectsDb.getWebhook(
          request.params.orgId,
          request.params.projectId
        )
        if (webhookUrl === undefined)
          return reply.status(404).send({ message: 'Project not found' })
        return { webhookUrl }
      }
    }
  )

  app.put<{
    Params: { orgId: string; projectId: string }
    Body: { webhookUrl: string | null }
  }>('/orgs/:orgId/projects/:projectId/webhook', {
    preHandler: requireOrgOwner,
    schema: {
      body: {
        type: 'object',
        required: ['webhookUrl'],
        properties: { webhookUrl: { type: 'string', nullable: true } }
      }
    },
    handler: async (request, reply) => {
      const { webhookUrl } = request.body
      if (webhookUrl !== null && !/^https:\/\/.+/.test(webhookUrl)) {
        return reply.status(400).send({ message: 'Webhook URL must use HTTPS' })
      }
      const project = await projectsDb.updateWebhook(
        request.params.orgId,
        request.params.projectId,
        webhookUrl
      )
      if (!project)
        return reply.status(404).send({ message: 'Project not found' })
      return { webhookUrl: project.webhookUrl }
    }
  })
}
