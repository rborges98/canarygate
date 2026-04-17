import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import { requireOrgMember } from '../plugins/require-org-access.ts'
import * as flagsDb from '../db/flags.ts'
import * as historyDb from '../db/history.ts'

const BASE = '/orgs/:orgId/projects/:projectId/flags'

export default async function flagsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('preHandler', requireOrgMember)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['flags'], ...(route.schema ?? {}) }
  })

  app.get<{ Params: { orgId: string; projectId: string } }>(BASE, {
    handler: async (request) => flagsDb.listFlags(request.params.projectId)
  })

  app.post<{
    Params: { orgId: string; projectId: string }
    Body: {
      name: string
      key: string
      description?: string
      type: 'boolean' | 'rollout'
      rolloutPercent?: number
    }
  }>(BASE, {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'key', 'type'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          key: { type: 'string', maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          type: { type: 'string', enum: ['boolean', 'rollout'] },
          rolloutPercent: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    },
    handler: async (request, reply) => {
      const { projectId } = request.params
      const flag = await flagsDb.createFlag(projectId, request.body)
      await historyDb.insertHistory({
        projectId,
        flagId: flag.id,
        flagKey: flag.key,
        flagName: flag.name,
        action: 'created',
        actorEmail: request.userEmail
      })
      reply.status(201)
      return flag
    }
  })

  app.get<{ Params: { orgId: string; projectId: string; flagId: string } }>(
    `${BASE}/:flagId`,
    {
      handler: async (request, reply) => {
        const flag = await flagsDb.getFlagById(
          request.params.flagId,
          request.params.projectId
        )
        if (!flag) return reply.status(404).send({ message: 'Flag not found' })
        return flag
      }
    }
  )

  app.put<{
    Params: { orgId: string; projectId: string; flagId: string }
    Body: {
      name: string
      description: string
      enabled: boolean
      rolloutPercent: number
    }
  }>(`${BASE}/:flagId`, {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'description', 'enabled', 'rolloutPercent'],
        properties: {
          name: { type: 'string', maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          enabled: { type: 'boolean' },
          rolloutPercent: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params
      const before = await flagsDb.getFlagById(flagId, projectId)
      if (!before) return reply.status(404).send({ message: 'Flag not found' })
      const flag = await flagsDb.updateFlag(flagId, projectId, request.body)
      if (!flag) return reply.status(404).send({ message: 'Flag not found' })
      await historyDb.insertHistory({
        projectId,
        flagId: flag.id,
        flagKey: flag.key,
        flagName: flag.name,
        action: 'updated',
        actorEmail: request.userEmail,
        changes: {
          before: {
            name: before.name,
            description: before.description,
            enabled: before.enabled,
            rolloutPercent: before.rolloutPercent
          },
          after: request.body
        }
      })
      return flag
    }
  })

  app.delete<{ Params: { orgId: string; projectId: string; flagId: string } }>(
    `${BASE}/:flagId`,
    {
      handler: async (request, reply) => {
        const { projectId, flagId } = request.params
        const flag = await flagsDb.deleteFlag(flagId, projectId)
        if (!flag) return reply.status(404).send({ message: 'Flag not found' })
        await historyDb.insertHistory({
          projectId,
          flagId: null,
          flagKey: flag.key,
          flagName: flag.name,
          action: 'deleted',
          actorEmail: request.userEmail
        })
        reply.status(204)
      }
    }
  )

  app.patch<{ Params: { orgId: string; projectId: string; flagId: string } }>(
    `${BASE}/:flagId/toggle`,
    {
      handler: async (request, reply) => {
        const { projectId, flagId } = request.params
        const flag = await flagsDb.toggleFlag(flagId, projectId)
        if (!flag) return reply.status(404).send({ message: 'Flag not found' })
        await historyDb.insertHistory({
          projectId,
          flagId: flag.id,
          flagKey: flag.key,
          flagName: flag.name,
          action: 'toggled',
          actorEmail: request.userEmail,
          changes: {
            before: { enabled: !flag.enabled },
            after: { enabled: flag.enabled }
          }
        })
        return flag
      }
    }
  )

  app.patch<{
    Params: { orgId: string; projectId: string; flagId: string }
    Body: { rolloutPercent: number }
  }>(`${BASE}/:flagId/rollout`, {
    schema: {
      body: {
        type: 'object',
        required: ['rolloutPercent'],
        properties: {
          rolloutPercent: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params
      const before = await flagsDb.getFlagById(flagId, projectId)
      if (!before) return reply.status(404).send({ message: 'Flag not found' })
      const flag = await flagsDb.updateRollout(
        flagId,
        projectId,
        request.body.rolloutPercent
      )
      if (!flag) return reply.status(404).send({ message: 'Flag not found' })
      await historyDb.insertHistory({
        projectId,
        flagId: flag.id,
        flagKey: flag.key,
        flagName: flag.name,
        action: 'rollout_updated',
        actorEmail: request.userEmail,
        changes: {
          before: { rolloutPercent: before.rolloutPercent },
          after: { rolloutPercent: flag.rolloutPercent }
        }
      })
      return flag
    }
  })
}
