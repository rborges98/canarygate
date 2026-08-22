import type { FastifyInstance } from 'fastify'
import { Receiver } from '@upstash/qstash'
import { and, eq, inArray, lt } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { flagEnvironments, history } from '@canarygate/database/schema'
import {
  calcIntervalMs,
  type AutoRolloutJobData,
  type ScheduleJobData
} from '@canarygate/messaging-utils'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import { getProjectWebhookConfig } from '../db/projects.ts'
import { deliverFlagWebhook } from '../services/webhook-delivery.ts'
import { getRequiredEnv } from '../utils/env.ts'
import {
  getQStashClient,
  getQStashWebhookUrl,
  getWorkerFlagState,
  insertWorkerHistory,
  matchesDueAt,
  scheduleNextAutoRollout
} from '../utils/webhook' // Ajuste o caminho dos seus helpers compartidos

type QStashWebhookBody =
  | { type: 'schedule'; jobData: ScheduleJobData }
  | { type: 'auto-rollout'; jobData: AutoRolloutJobData }
  | { type: 'history-retention' }

export async function webhookRoutes(app: FastifyInstance) {
  const receiver = new Receiver({
    currentSigningKey: getRequiredEnv(
      'QSTASH_CURRENT_SIGNING_KEY',
      'api webhook'
    ),
    nextSigningKey: getRequiredEnv('QSTASH_NEXT_SIGNING_KEY', 'api webhook')
  })

  try {
    await getQStashClient().schedules.create({
      scheduleId: 'flag-history-retention',
      cron: '0 3 * * *',
      destination: getQStashWebhookUrl('/webhook'),
      body: JSON.stringify({ type: 'history-retention' }),
      headers: { 'content-type': 'application/json' }
    })
  } catch (error) {
    app.log.warn(
      { err: error, scope: 'webhook.cron.historyRetention' },
      'Failed to upsert history retention cron in QStash'
    )
  }

  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_request, body, done) => {
      done(null, body)
    }
  )

  app.post<{ Body: string }>('/webhook', async (request, reply) => {
    const signature = request.headers['upstash-signature'] as string

    if (!signature) {
      request.log.error(
        { scope: 'webhook.qstash.auth' },
        'Missing QStash signature'
      )
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const isValid = await receiver
      .verify({
        signature,
        body: request.body
      })
      .catch(() => false)

    if (!isValid) {
      request.log.error(
        { scope: 'webhook.qstash.auth' },
        'Unauthorized QStash signature'
      )
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    let payload: QStashWebhookBody
    try {
      payload = JSON.parse(request.body) as QStashWebhookBody
    } catch (error) {
      request.log.error(
        { err: error, scope: 'webhook.qstash.parse' },
        'Invalid JSON body in QStash webhook'
      )
      return reply.status(400).send({ error: 'Invalid JSON body' })
    }

    const { type } = payload
    const log = request.log

    if (type === 'schedule') {
      const { jobData } = payload
      const state = await getWorkerFlagState(jobData, log)

      if (!state) {
        log.warn(
          {
            scope: 'webhook.jobs.processScheduleJob',
            flagId: jobData.flagId,
            projectId: jobData.projectId,
            environmentSlug: jobData.environmentSlug
          },
          'Skipping schedule job because the flag state no longer exists'
        )
        return reply.status(200).send({ message: 'State missing' })
      }

      const { flag, flagEnvironment, environment } = state

      if (
        !flagEnvironment.scheduleEnabled ||
        !matchesDueAt(flagEnvironment.scheduleDate, jobData.dueAt)
      ) {
        log.info(
          {
            scope: 'webhook.jobs.processScheduleJob',
            flagKey: flag.key,
            environmentSlug: environment.slug,
            dueAt: jobData.dueAt
          },
          'Skipping stale schedule job'
        )
        return reply.status(200).send({ message: 'Stale job skipped' })
      }

      const now = new Date()
      const dueAt = new Date(jobData.dueAt)

      let nextEnabled = flagEnvironment.enabled
      if (flagEnvironment.scheduleAction === 'enable') {
        nextEnabled = true
      } else if (flagEnvironment.scheduleAction === 'disable') {
        nextEnabled = false
      }

      let nextRolloutPercent = flagEnvironment.rolloutPercent
      if (flagEnvironment.scheduleAction === 'rollout') {
        nextRolloutPercent = flagEnvironment.scheduleRolloutPercent
      }

      const [updatedFlagEnvironment] = await db
        .update(flagEnvironments)
        .set({
          enabled: nextEnabled,
          rolloutPercent: nextRolloutPercent,
          scheduleEnabled: false,
          updatedAt: now
        })
        .where(
          and(
            eq(flagEnvironments.environmentId, jobData.environmentId),
            eq(flagEnvironments.scheduleEnabled, true),
            eq(flagEnvironments.scheduleDate, dueAt)
          )
        )
        .returning()

      if (!updatedFlagEnvironment) {
        log.info(
          {
            scope: 'webhook.jobs.processScheduleJob',
            flagKey: flag.key,
            environmentSlug: environment.slug,
            dueAt: jobData.dueAt
          },
          'Schedule job was already applied or superseded'
        )
        return reply.status(200).send({ message: 'Already applied' })
      }

      await insertWorkerHistory(
        {
          projectId: flag.projectId,
          environmentId: environment.id,
          environmentSlug: environment.slug,
          flagId: flag.id,
          flagKey: flag.key,
          flagName: flag.name,
          action:
            flagEnvironment.scheduleAction === 'rollout'
              ? 'rollout_updated'
              : 'updated',
          changes: {
            before: {
              enabled: flagEnvironment.enabled,
              rolloutPercent: flagEnvironment.rolloutPercent,
              scheduleEnabled: true,
              scheduleDate: flagEnvironment.scheduleDate?.toISOString() ?? null
            },
            after: {
              enabled: nextEnabled,
              rolloutPercent: nextRolloutPercent,
              scheduleEnabled: false,
              scheduleDate: flagEnvironment.scheduleDate?.toISOString() ?? null
            }
          }
        },
        log
      )

      await publishFlagEvent(
        flag.projectId,
        environment.id,
        'flag-updated',
        {
          key: flag.key,
          type: flag.type,
          enabled: nextEnabled,
          rolloutPercent: nextRolloutPercent,
          updatedAt: updatedFlagEnvironment.updatedAt.toISOString()
        },
        log
      )

      const webhookProject = await getProjectWebhookConfig(
        flag.projectId,
        log
      )
      await deliverFlagWebhook(
        'flag.updated',
        webhookProject,
        {
          key: flag.key,
          name: flag.name,
          type: flag.type,
          enabled: nextEnabled,
          rolloutPercent: nextRolloutPercent,
          updatedAt: updatedFlagEnvironment.updatedAt
        },
        { slug: environment.slug },
        log
      )

      log.info(
        {
          scope: 'webhook.jobs.processScheduleJob',
          flagKey: flag.key,
          projectId: flag.projectId,
          environmentSlug: environment.slug,
          dueAt: jobData.dueAt
        },
        'Processed schedule job'
      )

      return reply.status(200).send({ success: true })
    }

    if (type === 'auto-rollout') {
      const { jobData } = payload
      const state = await getWorkerFlagState(jobData, log)

      if (!state) {
        log.warn(
          {
            scope: 'webhook.jobs.processAutoRolloutJob',
            flagId: jobData.flagId,
            projectId: jobData.projectId,
            environmentSlug: jobData.environmentSlug
          },
          'Skipping auto-rollout job because the flag state no longer exists'
        )
        return reply.status(200).send({ message: 'State missing' })
      }

      const { flag, flagEnvironment, environment } = state

      if (
        !flagEnvironment.autoRolloutEnabled ||
        !matchesDueAt(flagEnvironment.autoRolloutNextAt, jobData.dueAt)
      ) {
        log.info(
          {
            scope: 'webhook.jobs.processAutoRolloutJob',
            flagKey: flag.key,
            environmentSlug: environment.slug,
            dueAt: jobData.dueAt
          },
          'Skipping stale auto-rollout job'
        )
        return reply.status(200).send({ message: 'Stale job skipped' })
      }

      const now = new Date()
      const dueAt = new Date(jobData.dueAt)
      const nextRolloutPercent = Math.min(
        flagEnvironment.rolloutPercent + flagEnvironment.autoRolloutIncreaseBy,
        flagEnvironment.autoRolloutUntilMax
      )
      const reachedMax =
        nextRolloutPercent >= flagEnvironment.autoRolloutUntilMax
      const nextAutoRolloutAt = reachedMax
        ? null
        : new Date(
            now.getTime() +
              calcIntervalMs(
                flagEnvironment.autoRolloutEveryValue,
                flagEnvironment.autoRolloutEveryUnit
              )
          )

      const [updatedFlagEnvironment] = await db
        .update(flagEnvironments)
        .set({
          rolloutPercent: nextRolloutPercent,
          autoRolloutEnabled: !reachedMax,
          autoRolloutNextAt: nextAutoRolloutAt,
          updatedAt: now
        })
        .where(
          and(
            eq(flagEnvironments.id, jobData.flagEnvironmentId),
            eq(flagEnvironments.environmentId, jobData.environmentId),
            eq(flagEnvironments.autoRolloutEnabled, true),
            eq(flagEnvironments.autoRolloutNextAt, dueAt)
          )
        )
        .returning()

      if (!updatedFlagEnvironment) {
        log.info(
          {
            scope: 'webhook.jobs.processAutoRolloutJob',
            flagKey: flag.key,
            environmentSlug: environment.slug,
            dueAt: jobData.dueAt
          },
          'Auto-rollout job was already applied or superseded'
        )
        return reply.status(200).send({ message: 'Already applied' })
      }

      await insertWorkerHistory(
        {
          projectId: flag.projectId,
          environmentId: environment.id,
          environmentSlug: environment.slug,
          flagId: flag.id,
          flagKey: flag.key,
          flagName: flag.name,
          action: 'rollout_updated',
          changes: {
            before: {
              rolloutPercent: flagEnvironment.rolloutPercent,
              autoRolloutEnabled: true,
              autoRolloutNextAt:
                flagEnvironment.autoRolloutNextAt?.toISOString() ?? null
            },
            after: {
              rolloutPercent: nextRolloutPercent,
              autoRolloutEnabled: !reachedMax,
              autoRolloutNextAt: nextAutoRolloutAt?.toISOString() ?? null
            }
          }
        },
        log
      )

      await publishFlagEvent(
        flag.projectId,
        environment.id,
        'flag-updated',
        {
          key: flag.key,
          type: flag.type,
          enabled: flagEnvironment.enabled,
          rolloutPercent: nextRolloutPercent,
          updatedAt: updatedFlagEnvironment.updatedAt.toISOString()
        },
        log
      )

      const autoRolloutWebhookProject = await getProjectWebhookConfig(
        flag.projectId,
        log
      )
      await deliverFlagWebhook(
        'flag.rollout_updated',
        autoRolloutWebhookProject,
        {
          key: flag.key,
          name: flag.name,
          type: flag.type,
          enabled: flagEnvironment.enabled,
          rolloutPercent: nextRolloutPercent,
          updatedAt: updatedFlagEnvironment.updatedAt
        },
        { slug: environment.slug },
        log
      )

      log.info(
        {
          scope: 'webhook.jobs.processAutoRolloutJob',
          flagKey: flag.key,
          projectId: flag.projectId,
          environmentSlug: environment.slug,
          reachedMax
        },
        'Processed auto-rollout job'
      )

      if (!reachedMax && nextAutoRolloutAt) {
        await scheduleNextAutoRollout(nextAutoRolloutAt, jobData, log)
      }

      return reply.status(200).send({ success: true })
    }

    if (type === 'history-retention') {
      const retentionDaysValue = Number(
        process.env.HISTORY_RETENTION_DAYS ?? 90
      )
      const retentionDays =
        Number.isFinite(retentionDaysValue) && retentionDaysValue > 0
          ? retentionDaysValue
          : 90
      const cutoff = new Date(Date.now() - retentionDays * 86400000)
      const batchSize = 5000
      const maxBatches = 20
      let deleted = 0

      try {
        for (let batch = 0; batch < maxBatches; batch++) {
          const rows = await db
            .select({ id: history.id })
            .from(history)
            .where(lt(history.createdAt, cutoff))
            .limit(batchSize)

          if (rows.length === 0) {
            break
          }

          const deletedRows = await db
            .delete(history)
            .where(inArray(history.id, rows.map((row) => row.id)))
            .returning()

          deleted += deletedRows.length

          if (rows.length < batchSize) {
            break
          }
        }

        log.info(
          {
            scope: 'webhook.jobs.processHistoryRetentionJob',
            deleted,
            retentionDays,
            cutoff: cutoff.toISOString()
          },
          'Processed history retention job'
        )

        return reply.status(200).send({ success: true, deleted })
      } catch (error) {
        log.error(
          {
            err: error,
            scope: 'webhook.jobs.processHistoryRetentionJob',
            retentionDays,
            cutoff: cutoff.toISOString()
          },
          'Failed to process history retention job'
        )
        throw error
      }
    }

    return reply.status(400).send({ error: 'Unknown job type' })
  })
}
