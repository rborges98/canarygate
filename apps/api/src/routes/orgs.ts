import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import {
  requireOrgMember,
  requireOrgOwner
} from '../plugins/require-org-access.ts'
import * as orgsDb from '../db/orgs.ts'

export default async function orgsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['orgs'], ...(route.schema ?? {}) }
  })

  app.get('/orgs', {
    handler: async (request) => orgsDb.listOrgsForUser(request.userId)
  })

  app.post<{ Body: { name: string; slug: string } }>('/orgs', {
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
      const org = await orgsDb.createOrg(request.body, request.userId)
      reply.status(201)
      return org
    }
  })

  app.get<{ Params: { slug: string } }>('/orgs/slug/:slug', {
    handler: async (request, reply) => {
      const org = await orgsDb.getOrgBySlug(request.params.slug)
      if (!org) return reply.status(404).send({ message: 'Org not found' })
      return org
    }
  })

  app.get<{ Params: { orgId: string } }>('/orgs/:orgId', {
    preHandler: requireOrgMember,
    handler: async (request, reply) => {
      const org = await orgsDb.getOrgById(request.params.orgId)
      if (!org) return reply.status(404).send({ message: 'Org not found' })
      return org
    }
  })

  app.put<{ Params: { orgId: string }; Body: { name: string; slug: string } }>(
    '/orgs/:orgId',
    {
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
        const org = await orgsDb.updateOrg(request.params.orgId, request.body)
        if (!org) return reply.status(404).send({ message: 'Org not found' })
        return org
      }
    }
  )

  app.delete<{ Params: { orgId: string } }>('/orgs/:orgId', {
    preHandler: requireOrgOwner,
    handler: async (request, reply) => {
      const ok = await orgsDb.deleteOrg(request.params.orgId)
      if (!ok) return reply.status(404).send({ message: 'Org not found' })
      reply.status(204)
    }
  })
}
