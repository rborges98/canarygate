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
import { getProjectWebhookConfig } from '../db/projects.ts'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import {
  deliverFlagWebhook
} from '../services/webhook-delivery.ts'
import {
  getQStashClient,
  getQStashWebhookUrl,
  MAX_QSTASH_DELAY_SECONDS
} from '../utils/webhook.ts'
import {
  environmentSlugQuerySchema,
  flagsListQuerySchema,
  nameSchema,
  orgProjectFlagParamsSchema,
  orgProjectParamsSchema,
  slugSchema
} from './validation.ts'

const BASE = '/orgs/:orgId/projects/:projectId/flags'

const MAX_QSTASH_DELAY_MS = MAX_QSTASH_DELAY_SECONDS * 1000
const ISO_DATE_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/

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

    if (!ISO_DATE_WITH_OFFSET.test(body.scheduleDate)) {
      return 'scheduleDate must be ISO-8601 with a timezone offset (e.g. 2026-08-14T10:00:00Z or +02:00)'
    }

    const scheduleDate = new Date(body.scheduleDate)
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
      return 'scheduleDate must be a future date'
    }

    if (scheduleDate.getTime() - Date.now() > MAX_QSTASH_DELAY_MS) {
      return 'scheduleDate must be at most 30 days in the future'
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

    const nextDate = calculateNextRolloutDate(
      body.autoRolloutEveryValue,
      body.autoRolloutEveryUnit
    )
    if (nextDate.getTime() - Date.now() > MAX_QSTASH_DELAY_MS) {
      return 'Auto-rollout interval must target at most 30 days in the future'
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

function calculateNextRolloutDate(
  value: number,
  unit: 'hours' | 'days' | 'weeks'
) {
  const multiplier =
    unit === 'hours' ? 3600000 : unit === 'days' ? 86400000 : 604800000
  return new Date(Date.now() + value * multiplier)
}

async function dispatchQStashJob(
  type: 'schedule' | 'auto-rollout',
  targetDate: string | Date,
  jobData: {
    flagEnvironmentId: string
    flagId: string
    projectId: string
    environmentId: string
    environmentSlug: string
    flagKey: string
  },
  log: FastifyBaseLogger
) {
  const date = new Date(targetDate)
  const delayInSeconds = Math.floor((date.getTime() - Date.now()) / 1000)

  if (delayInSeconds <= 0) return
  if (delayInSeconds > MAX_QSTASH_DELAY_SECONDS) {
    log.warn(
      { scope: 'qstash.publish', flagId: jobData.flagId, type, delayInSeconds },
      'Skipping QStash job because the delay exceeds the 30-day limit'
    )
    return
  }

  const dueAt = date.toISOString()

  try {
    const deduplicationId = `${type}:${jobData.flagId}:${jobData.environmentId}:${dueAt}`.replace(
      /[^a-zA-Z0-9._-]/g,
      '-'
    )
    await getQStashClient().publishJSON({
      url: `${getQStashWebhookUrl()}/webhook`,
      body: {
        type,
        jobData: {
          ...jobData,
          dueAt
        }
      },
      delay: delayInSeconds,
      deduplicationId
    })
  } catch (err) {
    log.error(
      { err, scope: 'qstash.publish', flagId: jobData.flagId, type },
      'Failed to schedule QStash job'
    )
  }
}

export default async function flagsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['flags'], ...(route.schema ?? {}) }
  })

  app.get<{
    Params: { orgId: string; projectId: string }
    Querystring: {
      environmentSlug?: string
      page?: number
      pageSize?: number
    }
  }>(BASE, {
    preHandler: requireProjectAccess,
    schema: {
      params: orgProjectParamsSchema,
      querystring: flagsListQuerySchema
    },
    handler: async (request, reply) => {
      const { projectId } = request.params
      const page = request.query.page ?? 1
      const pageSize = request.query.pageSize ?? 50

      try {
        let result
        if (!request.query.environmentSlug) {
          await environmentsDb.getOrCreateEnvironments(projectId, request.log)
          result = await flagsDb.listFlagsWithAllEnvs(
            projectId,
            { page, pageSize },
            request.log
          )
        } else {
          const env = await resolveEnvironmentWithLog(
            projectId,
            request.query.environmentSlug,
            request.log
          )
          if (!env) {
            return reply.status(404).send({ message: 'Environment not found' })
          }

          result = await flagsDb.listFlags(
            projectId,
            env.id,
            { page, pageSize },
            request.log
          )
        }

        return {
          items: result.items,
          total: result.total,
          page,
          pageSize
        }
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

          environmentIds = resolved
            .filter(
              (environment): environment is NonNullable<typeof environment> =>
                environment !== null
            )
            .map((environment) => environment.id)
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
        const webhookProject = await getProjectWebhookConfig(
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

          await publishFlagEvent(
            projectId,
            env.id,
            'flag-created',
            {
              key: flag.key,
              type: flag.type,
              enabled: flagData.enabled ?? false,
              rolloutPercent:
                flagData.type === 'rollout'
                  ? (flagData.rolloutPercent ?? 0)
                  : 0,
              updatedAt: flag.updatedAt.toISOString()
            },
            request.log
          )

          await deliverFlagWebhook(
            'flag.created',
            webhookProject,
            {
              key: flag.key,
              name: flag.name,
              type: flag.type,
              enabled: flagData.enabled ?? false,
              rolloutPercent:
                flagData.type === 'rollout'
                  ? (flagData.rolloutPercent ?? 0)
                  : 0,
              updatedAt: flag.updatedAt
            },
            { slug: env.slug },
            request.log,
            request.userEmail
          )

          const hasSchedule =
            flagData.scheduleEnabled && Boolean(flagData.scheduleDate)
          const hasAutoRollout =
            flagData.autoRolloutEnabled &&
            Boolean(flagData.autoRolloutEveryValue) &&
            Boolean(flagData.autoRolloutEveryUnit)

          if (!hasSchedule && !hasAutoRollout) {
            continue
          }

          const flagEnvironmentRow = await flagsDb.getFlagEnvironmentRow(
            flag.id,
            env.id,
            request.log
          )
          if (!flagEnvironmentRow) {
            continue
          }

          const jobIdentifiers = {
            flagEnvironmentId: flagEnvironmentRow.id,
            projectId,
            flagId: flag.id,
            environmentId: env.id,
            environmentSlug: env.slug,
            flagKey: flag.key
          }

          if (hasSchedule && flagEnvironmentRow.scheduleDate) {
            await dispatchQStashJob(
              'schedule',
              flagEnvironmentRow.scheduleDate,
              jobIdentifiers,
              request.log
            )
          }

          if (hasAutoRollout && flagEnvironmentRow.autoRolloutNextAt) {
            await dispatchQStashJob(
              'auto-rollout',
              flagEnvironmentRow.autoRolloutNextAt,
              jobIdentifiers,
              request.log
            )
          }
        }

        request.log.info(
          {
            scope: 'route.flags.create',
            projectId,
            flagId: flag.id,
            flagKey: flag.key
          },
          'Flag created'
        )

        reply.status(201)
        return flag
      } catch (error) {
        const dbError = error as { code?: string }
        if (dbError.code === '23505') {
          return reply
            .status(409)
            .send({ message: 'A flag with this key already exists' })
        }

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
      type?: 'boolean' | 'rollout'
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

        const webhookProject = await getProjectWebhookConfig(
          projectId,
          request.log
        )

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

        await publishFlagEvent(
          projectId,
          env.id,
          'flag-updated',
          {
            key: flag.key,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt.toISOString()
          },
          request.log
        )

        await deliverFlagWebhook(
          'flag.updated',
          webhookProject,
          {
            key: flag.key,
            name: flag.name,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt
          },
          { slug: env.slug },
          request.log,
          request.userEmail
        )

        const hasSchedule =
          request.body.scheduleEnabled && Boolean(request.body.scheduleDate)
        const hasAutoRollout =
          request.body.autoRolloutEnabled &&
          Boolean(request.body.autoRolloutEveryValue) &&
          Boolean(request.body.autoRolloutEveryUnit)

        if (hasSchedule || hasAutoRollout) {
          const flagEnvironmentRow = await flagsDb.getFlagEnvironmentRow(
            flag.id,
            env.id,
            request.log
          )
          if (!flagEnvironmentRow) {
            return reply.status(404).send({ message: 'Flag not found' })
          }

          const jobIdentifiers = {
            flagEnvironmentId: flagEnvironmentRow.id,
            projectId,
            flagId: flag.id,
            environmentId: env.id,
            environmentSlug: env.slug,
            flagKey: flag.key
          }

          if (hasSchedule && flagEnvironmentRow.scheduleDate) {
            await dispatchQStashJob(
              'schedule',
              flagEnvironmentRow.scheduleDate,
              jobIdentifiers,
              request.log
            )
          }

          if (hasAutoRollout && flagEnvironmentRow.autoRolloutNextAt) {
            await dispatchQStashJob(
              'auto-rollout',
              flagEnvironmentRow.autoRolloutNextAt,
              jobIdentifiers,
              request.log
            )
          }
        }

        return flag
      } catch (error) {
        const dbError = error as { code?: string }
        if (dbError.code === '23505') {
          return reply
            .status(409)
            .send({ message: 'A flag with this key already exists' })
        }

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
        const environments = await flagsDb.listFlagEnvironmentsForFlag(
          flagId,
          request.log
        )

        const flag = await flagsDb.deleteFlag(flagId, projectId, request.log)
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        const webhookProject = await getProjectWebhookConfig(
          projectId,
          request.log
        )

        for (const environment of environments) {
          await historyDb.insertHistory(
            {
              projectId,
              environmentId: environment.environmentId,
              environmentSlug: environment.environmentSlug,
              flagId: null,
              flagKey: flag.key,
              flagName: flag.name,
              action: 'deleted',
              actorEmail: request.userEmail
            },
            request.log
          )
          await publishFlagEvent(
            projectId,
            environment.environmentId,
            'flag-deleted',
            {
              key: flag.key,
              deletedAt: new Date().toISOString()
            },
            request.log
          )

          await deliverFlagWebhook(
            'flag.deleted',
            webhookProject,
            {
              key: flag.key,
              name: flag.name,
              type: flag.type,
              enabled: false,
              rolloutPercent: null,
              updatedAt: flag.updatedAt
            },
            { slug: environment.environmentSlug },
            request.log,
            request.userEmail
          )
        }

        request.log.info(
          {
            scope: 'route.flags.delete',
            projectId,
            flagId: flag.id,
            flagKey: flag.key,
            environmentCount: environments.length
          },
          'Flag deleted'
        )
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

        const webhookProject = await getProjectWebhookConfig(
          projectId,
          request.log
        )

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
        await publishFlagEvent(
          projectId,
          env.id,
          'flag-updated',
          {
            key: flag.key,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt.toISOString()
          },
          request.log
        )
        await deliverFlagWebhook(
          'flag.toggled',
          webhookProject,
          {
            key: flag.key,
            name: flag.name,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt
          },
          { slug: env.slug },
          request.log,
          request.userEmail
        )
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

        const webhookProject = await getProjectWebhookConfig(
          projectId,
          request.log
        )

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
        await publishFlagEvent(
          projectId,
          env.id,
          'flag-updated',
          {
            key: flag.key,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt.toISOString()
          },
          request.log
        )
        await deliverFlagWebhook(
          'flag.rollout_updated',
          webhookProject,
          {
            key: flag.key,
            name: flag.name,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt
          },
          { slug: env.slug },
          request.log,
          request.userEmail
        )
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
          projectId,
          env.id,
          0,
          request.log
        )
        if (!flag) {
          return reply.status(404).send({ message: 'Flag not found' })
        }

        const webhookProject = await getProjectWebhookConfig(
          projectId,
          request.log
        )

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
        await publishFlagEvent(
          projectId,
          env.id,
          'flag-created',
          {
            key: flag.key,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt.toISOString()
          },
          request.log
        )
        await deliverFlagWebhook(
          'flag.created',
          webhookProject,
          {
            key: flag.key,
            name: flag.name,
            type: flag.type,
            enabled: flag.enabled,
            rolloutPercent: flag.rolloutPercent,
            updatedAt: flag.updatedAt
          },
          { slug: env.slug },
          request.log,
          request.userEmail
        )
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
