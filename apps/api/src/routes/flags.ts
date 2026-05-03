import type { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import {
  requireProjectAccess,
  requireProjectAdmin
} from '../plugins/require-org-access.ts'
import {
  getFlagPermissionRequirement,
  type FlagMutation
} from '../authz/project-permissions.ts'
import * as flagsDb from '../db/flags.ts'
import * as historyDb from '../db/history.ts'
import * as environmentsDb from '../db/environments.ts'
import { emitFlagEvent } from '../sse/flag-emitter.ts'
import {
  environmentSlugQuerySchema,
  nameSchema,
  orgProjectFlagParamsSchema,
  orgProjectParamsSchema,
  slugSchema
} from './validation.ts'

const BASE = '/orgs/:orgId/projects/:projectId/flags'

function getFlagMutationPreHandler(mutation: FlagMutation) {
  return getFlagPermissionRequirement(mutation) === 'project-admin'
    ? requireProjectAdmin
    : requireProjectAccess
}

function validateFlagConfigPayload(body: {
  scheduleEnabled?: boolean
  scheduleDate?: string | null
  scheduleAction?: 'enable' | 'disable' | 'rollout'
  scheduleRolloutPercent?: number
  autoRolloutEnabled?: boolean
  autoRolloutIncreaseBy?: number
  autoRolloutEveryValue?: number
  autoRolloutEveryUnit?: 'hours' | 'days' | 'weeks'
  autoRolloutUntilMax?: number
}) {
  if (body.scheduleEnabled) {
    if (!body.scheduleDate || !body.scheduleAction) {
      return 'scheduleDate and scheduleAction are required when scheduleEnabled is true'
    }

    if (
      body.scheduleAction === 'rollout' &&
      typeof body.scheduleRolloutPercent !== 'number'
    ) {
      return 'scheduleRolloutPercent is required when scheduling a rollout'
    }
  }

  if (body.autoRolloutEnabled) {
    if (
      typeof body.autoRolloutIncreaseBy !== 'number' ||
      typeof body.autoRolloutEveryValue !== 'number' ||
      !body.autoRolloutEveryUnit ||
      typeof body.autoRolloutUntilMax !== 'number'
    ) {
      return 'Auto-rollout fields are required when autoRolloutEnabled is true'
    }
  }

  return null
}

async function resolveEnvironmentWithLog(
  projectId: string,
  slug?: string,
  log?: FastifyBaseLogger
) {
  if (slug) {
    return environmentsDb.getEnvironmentBySlug(projectId, slug, log)
  }

  const envs = await environmentsDb.getOrCreateEnvironments(projectId, log)
  return envs.find((e) => e.isDefault) ?? envs[0] ?? null
}

export default async function flagsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['flags'], ...(route.schema ?? {}) }
  })

  app.get<{
    Params: { orgId: string; projectId: string }
    Querystring: { environmentSlug?: string }
  }>(BASE, {
    preHandler: requireProjectAccess,
    schema: {
      params: orgProjectParamsSchema,
      querystring: environmentSlugQuerySchema
    },
    handler: async (request, reply) => {
      const { projectId } = request.params

      try {
        if (!request.query.environmentSlug) {
          await environmentsDb.getOrCreateEnvironments(projectId, request.log)
          return flagsDb.listFlagsWithAllEnvs(projectId, request.log)
        }

        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )
        if (!env) {
          return reply.status(404).send({ message: 'Environment not found' })
        }

        return flagsDb.listFlags(projectId, env.id, request.log)
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.list',
            projectId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.list'
        )
        throw error
      }
    }
  })

  app.post<{
    Params: { orgId: string; projectId: string }
    Querystring: { environmentSlug?: string }
    Body: {
      name: string
      key: string
      description?: string
      type: 'boolean' | 'rollout'
      enabled?: boolean
      rolloutPercent?: number
      scheduleEnabled?: boolean
      scheduleDate?: string | null
      scheduleAction?: 'enable' | 'disable' | 'rollout'
      scheduleRolloutPercent?: number
      autoRolloutEnabled?: boolean
      autoRolloutIncreaseBy?: number
      autoRolloutEveryValue?: number
      autoRolloutEveryUnit?: 'hours' | 'days' | 'weeks'
      autoRolloutUntilMax?: number
      environments?: string[]
    }
  }>(BASE, {
    preHandler: getFlagMutationPreHandler('create'),
    schema: {
      params: orgProjectParamsSchema,
      querystring: environmentSlugQuerySchema,
      body: {
        type: 'object',
        required: ['name', 'key', 'type'],
        properties: {
          name: nameSchema,
          key: nameSchema,
          description: { type: 'string', maxLength: 500 },
          type: { type: 'string', enum: ['boolean', 'rollout'] },
          enabled: { type: 'boolean' },
          rolloutPercent: { type: 'number', minimum: 0, maximum: 100 },
          scheduleEnabled: { type: 'boolean' },
          scheduleDate: { type: 'string', nullable: true },
          scheduleAction: {
            type: 'string',
            enum: ['enable', 'disable', 'rollout']
          },
          scheduleRolloutPercent: { type: 'number', minimum: 0, maximum: 100 },
          autoRolloutEnabled: { type: 'boolean' },
          autoRolloutIncreaseBy: { type: 'number', minimum: 1, maximum: 100 },
          autoRolloutEveryValue: { type: 'integer', minimum: 1 },
          autoRolloutEveryUnit: {
            type: 'string',
            enum: ['hours', 'days', 'weeks']
          },
          autoRolloutUntilMax: { type: 'number', minimum: 1, maximum: 100 },
          environments: { type: 'array', minItems: 1, items: slugSchema }
        }
      }
    },
    handler: async (request, reply) => {
      const { projectId } = request.params
      const { environments: envSlugs, ...flagData } = request.body
      const validationError = validateFlagConfigPayload(request.body)
      if (validationError) {
        return reply.status(400).send({ message: validationError })
      }

      try {
        let environmentIds: string[] = []
        if (envSlugs) {
          const uniqueEnvSlugs = [...new Set(envSlugs)]
          const resolved = await Promise.all(
            uniqueEnvSlugs.map((slug) =>
              environmentsDb.getEnvironmentBySlug(projectId, slug, request.log)
            )
          )

          if (resolved.some((environment) => !environment)) {
            return reply.status(400).send({
              message: 'One or more environments are invalid for this project'
            })
          }

          environmentIds = resolved.map((environment) => environment.id)
        } else {
          const allEnvs = await environmentsDb.getOrCreateEnvironments(
            projectId,
            request.log
          )
          environmentIds = allEnvs.map((e) => e.id)
        }

        const flag = await flagsDb.createFlag(
          projectId,
          flagData,
          environmentIds,
          request.log
        )
        const allEnvs = await environmentsDb.listEnvironments(
          projectId,
          request.log
        )
        for (const env of allEnvs) {
          if (!environmentIds.includes(env.id)) {
            continue
          }

          await historyDb.insertHistory(
            {
              projectId,
              environmentId: env.id,
              environmentSlug: env.slug,
              flagId: flag.id,
              flagKey: flag.key,
              flagName: flag.name,
              action: 'created',
              actorEmail: request.userEmail
            },
            request.log
          )

          emitFlagEvent(`${projectId}:${env.id}`, 'flag-created', {
            key: flag.key,
            enabled: flagData.enabled ?? false,
            rolloutPercent:
              flagData.type === 'rollout' ? (flagData.rolloutPercent ?? 0) : 0
          })
        }

        reply.status(201)
        return flag
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.create',
            projectId,
            flagKey: flagData.key
          },
          'Failed in route.flags.create'
        )
        throw error
      }
    }
  })

  app.get<{
    Params: { orgId: string; projectId: string; flagId: string }
    Querystring: { environmentSlug?: string }
  }>(`${BASE}/:flagId`, {
    preHandler: requireProjectAccess,
    schema: {
      params: orgProjectFlagParamsSchema,
      querystring: environmentSlugQuerySchema
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params

      try {
        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )
        if (!env) {
          return reply.status(404).send({ message: 'Environment not found' })
        }

        const flag = await flagsDb.getFlagById(
          flagId,
          projectId,
          env.id,
          request.log
        )
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        return flag
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.get',
            projectId,
            flagId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.get'
        )
        throw error
      }
    }
  })

  app.put<{
    Params: { orgId: string; projectId: string; flagId: string }
    Querystring: { environmentSlug?: string }
    Body: {
      name: string
      description: string
      enabled: boolean
      rolloutPercent: number
      scheduleEnabled?: boolean
      scheduleDate?: string | null
      scheduleAction?: 'enable' | 'disable' | 'rollout'
      scheduleRolloutPercent?: number
      autoRolloutEnabled?: boolean
      autoRolloutIncreaseBy?: number
      autoRolloutEveryValue?: number
      autoRolloutEveryUnit?: 'hours' | 'days' | 'weeks'
      autoRolloutUntilMax?: number
    }
  }>(`${BASE}/:flagId`, {
    preHandler: getFlagMutationPreHandler('update'),
    schema: {
      params: orgProjectFlagParamsSchema,
      querystring: environmentSlugQuerySchema,
      body: {
        type: 'object',
        required: ['name', 'description', 'enabled', 'rolloutPercent'],
        properties: {
          name: nameSchema,
          description: { type: 'string', maxLength: 500 },
          enabled: { type: 'boolean' },
          rolloutPercent: { type: 'number', minimum: 0, maximum: 100 },
          scheduleEnabled: { type: 'boolean' },
          scheduleDate: { type: 'string', nullable: true },
          scheduleAction: {
            type: 'string',
            enum: ['enable', 'disable', 'rollout']
          },
          scheduleRolloutPercent: { type: 'number', minimum: 0, maximum: 100 },
          autoRolloutEnabled: { type: 'boolean' },
          autoRolloutIncreaseBy: { type: 'number', minimum: 1, maximum: 100 },
          autoRolloutEveryValue: { type: 'integer', minimum: 1 },
          autoRolloutEveryUnit: {
            type: 'string',
            enum: ['hours', 'days', 'weeks']
          },
          autoRolloutUntilMax: { type: 'number', minimum: 1, maximum: 100 }
        }
      }
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params
      const validationError = validateFlagConfigPayload(request.body)
      if (validationError) {
        return reply.status(400).send({ message: validationError })
      }

      try {
        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )
        if (!env) {
          return reply.status(404).send({ message: 'Environment not found' })
        }

        const before = await flagsDb.getFlagById(
          flagId,
          projectId,
          env.id,
          request.log
        )
        if (!before) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        const flag = await flagsDb.updateFlag(
          flagId,
          projectId,
          env.id,
          request.body,
          request.log
        )
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        await historyDb.insertHistory(
          {
            projectId,
            environmentId: env.id,
            environmentSlug: env.slug,
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
          },
          request.log
        )
        emitFlagEvent(`${projectId}:${env.id}`, 'flag-updated', {
          key: flag.key,
          enabled: flag.enabled,
          rolloutPercent: flag.rolloutPercent
        })
        return flag
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.update',
            projectId,
            flagId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.update'
        )
        throw error
      }
    }
  })

  app.delete<{
    Params: { orgId: string; projectId: string; flagId: string }
    Querystring: { environmentSlug?: string }
  }>(`${BASE}/:flagId`, {
    preHandler: getFlagMutationPreHandler('delete'),
    schema: {
      params: orgProjectFlagParamsSchema,
      querystring: environmentSlugQuerySchema
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params

      try {
        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )

        const flag = await flagsDb.deleteFlag(flagId, projectId, request.log)
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        await historyDb.insertHistory(
          {
            projectId,
            environmentId: env?.id ?? null,
            environmentSlug: env?.slug ?? null,
            flagId: null,
            flagKey: flag.key,
            flagName: flag.name,
            action: 'deleted',
            actorEmail: request.userEmail
          },
          request.log
        )
        emitFlagEvent(`${projectId}:${env?.id ?? ''}`, 'flag-deleted', {
          key: flag.key
        })
        reply.status(204)
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.delete',
            projectId,
            flagId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.delete'
        )
        throw error
      }
    }
  })

  app.patch<{
    Params: { orgId: string; projectId: string; flagId: string }
    Querystring: { environmentSlug?: string }
  }>(`${BASE}/:flagId/toggle`, {
    preHandler: getFlagMutationPreHandler('toggle'),
    schema: {
      params: orgProjectFlagParamsSchema,
      querystring: environmentSlugQuerySchema
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params

      try {
        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )
        if (!env) {
          return reply.status(404).send({ message: 'Environment not found' })
        }

        const flag = await flagsDb.toggleFlag(
          flagId,
          projectId,
          env.id,
          request.log
        )
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        await historyDb.insertHistory(
          {
            projectId,
            environmentId: env.id,
            environmentSlug: env.slug,
            flagId: flag.id,
            flagKey: flag.key,
            flagName: flag.name,
            action: 'toggled',
            actorEmail: request.userEmail,
            changes: {
              before: { enabled: !flag.enabled },
              after: { enabled: flag.enabled }
            }
          },
          request.log
        )
        emitFlagEvent(`${projectId}:${env.id}`, 'flag-updated', {
          key: flag.key,
          enabled: flag.enabled,
          rolloutPercent: flag.rolloutPercent
        })
        return flag
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.toggle',
            projectId,
            flagId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.toggle'
        )
        throw error
      }
    }
  })

  app.patch<{
    Params: { orgId: string; projectId: string; flagId: string }
    Querystring: { environmentSlug?: string }
    Body: { rolloutPercent: number }
  }>(`${BASE}/:flagId/rollout`, {
    preHandler: getFlagMutationPreHandler('update-rollout'),
    schema: {
      params: orgProjectFlagParamsSchema,
      querystring: environmentSlugQuerySchema,
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

      try {
        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )
        if (!env) {
          return reply.status(404).send({ message: 'Environment not found' })
        }

        const before = await flagsDb.getFlagById(
          flagId,
          projectId,
          env.id,
          request.log
        )
        if (!before) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        const flag = await flagsDb.updateRollout(
          flagId,
          projectId,
          env.id,
          request.body.rolloutPercent,
          request.log
        )
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        await historyDb.insertHistory(
          {
            projectId,
            environmentId: env.id,
            environmentSlug: env.slug,
            flagId: flag.id,
            flagKey: flag.key,
            flagName: flag.name,
            action: 'rollout_updated',
            actorEmail: request.userEmail,
            changes: {
              before: { rolloutPercent: before.rolloutPercent },
              after: { rolloutPercent: flag.rolloutPercent }
            }
          },
          request.log
        )
        emitFlagEvent(`${projectId}:${env.id}`, 'flag-updated', {
          key: flag.key,
          enabled: flag.enabled,
          rolloutPercent: flag.rolloutPercent
        })
        return flag
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.updateRollout',
            projectId,
            flagId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.updateRollout'
        )
        throw error
      }
    }
  })

  app.post<{
    Params: { orgId: string; projectId: string; flagId: string }
    Querystring: { environmentSlug?: string }
  }>(`${BASE}/:flagId/add-environment`, {
    preHandler: getFlagMutationPreHandler('add-environment'),
    schema: {
      params: orgProjectFlagParamsSchema,
      querystring: environmentSlugQuerySchema
    },
    handler: async (request, reply) => {
      const { projectId, flagId } = request.params

      try {
        const env = await resolveEnvironmentWithLog(
          projectId,
          request.query.environmentSlug,
          request.log
        )
        if (!env) {
          return reply.status(404).send({ message: 'Environment not found' })
        }

        const flag = await flagsDb.addFlagToEnvironment(
          flagId,
          env.id,
          0,
          request.log
        )
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        await historyDb.insertHistory(
          {
            projectId,
            environmentId: env.id,
            environmentSlug: env.slug,
            flagId: flag.id,
            flagKey: flag.key,
            flagName: flag.name,
            action: 'created',
            actorEmail: request.userEmail
          },
          request.log
        )
        emitFlagEvent(`${projectId}:${env.id}`, 'flag-created', {
          key: flag.key,
          enabled: flag.enabled,
          rolloutPercent: flag.rolloutPercent
        })
        reply.status(201)
        return flag
      } catch (error) {
        request.log.error(
          {
            err: error,
            scope: 'route.flags.addEnvironment',
            projectId,
            flagId,
            environmentSlug: request.query.environmentSlug ?? null
          },
          'Failed in route.flags.addEnvironment'
        )
        throw error
      }
    }
  })
}
