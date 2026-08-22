import type { FastifyInstance } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { orgMembers } from '@canarygate/database/schema'
import { requireSession } from '../plugins/require-session.ts'
import {
  requireOrgMember,
  requireOrgOwner
} from '../plugins/require-org-access.ts'
import * as historyDb from '../db/history.ts'
import * as orgsDb from '../db/orgs.ts'
import {
  nameSchema,
  orgParamsSchema,
  paginationQuerySchema,
  slugParamsSchema,
  slugSchema
} from './validation.ts'

export default async function orgsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['orgs'], ...(route.schema ?? {}) }
  })

  app.get<{ Querystring: { page?: number; pageSize?: number } }>('/orgs', {
    schema: {
      querystring: paginationQuerySchema
    },
    handler: async (request) => {
      try {
        const page = request.query.page ?? 1
        const pageSize = request.query.pageSize ?? 50
        const { items, total } = await orgsDb.listOrgsForUser(
          request.userId,
          { page, pageSize },
          request.log
        )
        return { items, total, page, pageSize }
      } catch (error) {
        request.log.error(
          { err: error, scope: 'route.orgs.list', userId: request.userId },
          'Failed in route.orgs.list'
        )
        throw error
      }
    }
  })

  app.post<{ Body: { name: string; slug: string } }>('/orgs', {
    schema: {
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
        const org = await orgsDb.createOrg(
          request.body,
          request.userId,
          request.log
        )
        request.log.info(
          {
            scope: 'route.orgs.create',
            orgId: org.id,
            slug: org.slug,
            userId: request.userId
          },
          'Org created'
        )
        reply.status(201)
        return org
      } catch (error) {
        const dbError = error as { code?: string }
        if (dbError.code === '23505') {
          return reply
            .status(409)
            .send({ message: 'An org with this slug already exists' })
        }

        request.log.error(
          {
            err: error,
            scope: 'route.orgs.create',
            userId: request.userId,
            slug: request.body.slug
          },
          'Failed in route.orgs.create'
        )
        throw error
      }
    }
  })

  app.get<{ Params: { slug: string } }>('/orgs/slug/:slug', {
    schema: {
      params: slugParamsSchema
    },
    handler: async (request, reply) => {
      try {
        const org = await orgsDb.getOrgBySlug(request.params.slug, request.log)
        if (!org) {
          return reply.status(404).send({ message: 'Org not found' })
        }

        const membership = await db.query.orgMembers.findFirst({
          where: and(
            eq(orgMembers.orgId, org.id),
            eq(orgMembers.userId, request.userId)
          ),
          columns: { id: true }
        })

        if (!membership) {
          return reply.status(404).send({ message: 'Org not found' })
        }

        return org
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.orgs.getBySlug',
            slug: request.params.slug,
            userId: request.userId
          },
          'Failed in route.orgs.getBySlug'
        )
        throw error
      }
    }
  })

  app.get<{ Params: { orgId: string } }>('/orgs/:orgId', {
    preHandler: requireOrgMember,
    schema: {
      params: orgParamsSchema
    },
    handler: async (request, reply) => {
      try {
        const org = await orgsDb.getOrgById(request.params.orgId, request.log)
        if (!org) {
          return reply.status(404).send({ message: 'Org not found' })
        }

        return org
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.orgs.getById',
            orgId: request.params.orgId
          },
          'Failed in route.orgs.getById'
        )
        throw error
      }
    }
  })

  app.put<{ Params: { orgId: string }; Body: { name: string; slug: string } }>(
    '/orgs/:orgId',
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
          const org = await orgsDb.updateOrg(
            request.params.orgId,
            request.body,
            request.log
          )
          if (!org) {
            return reply.status(404).send({ message: 'Org not found' })
          }

          return org
        } catch (error) {
          const dbError = error as { code?: string }
          if (dbError.code === '23505') {
            return reply
              .status(409)
              .send({ message: 'An org with this slug already exists' })
          }

          request.log.error(
            {
              err: error,
              scope: 'route.orgs.update',
              orgId: request.params.orgId,
              slug: request.body.slug
            },
            'Failed in route.orgs.update'
          )
          throw error
        }
      }
    }
  )

  app.delete<{ Params: { orgId: string } }>('/orgs/:orgId', {
    preHandler: requireOrgOwner,
    schema: {
      params: orgParamsSchema
    },
    handler: async (request, reply) => {
      try {
        const org = await orgsDb.getOrgById(request.params.orgId, request.log)
        if (!org) {
          return reply.status(404).send({ message: 'Org not found' })
        }

        const ok = await orgsDb.deleteOrg(request.params.orgId, request.log)
        if (!ok) {
          return reply.status(404).send({ message: 'Org not found' })
        }

        await historyDb.insertAuditLog(
          {
            orgId: org.id,
            resourceType: 'org',
            resourceId: org.id,
            resourceName: org.name,
            action: 'deleted',
            actorEmail: request.userEmail,
            changes: { slug: org.slug }
          },
          request.log
        )

        request.log.info(
          {
            scope: 'route.orgs.delete',
            orgId: org.id,
            slug: org.slug,
            userId: request.userId
          },
          'Org deleted'
        )

        reply.status(204)
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.orgs.delete',
            orgId: request.params.orgId,
            userId: request.userId
          },
          'Failed in route.orgs.delete'
        )
        throw error
      }
    }
  })
}
