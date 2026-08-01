import type { FastifyInstance } from 'fastify'
import { Receiver } from '@upstash/qstash'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { flagEnvironments } from '@canarygate/database/schema'
import {
  calcIntervalMs,
  type AutoRolloutJobData,
  type ScheduleJobData
} from '@canarygate/messaging-utils'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import {
  getWorkerFlagState,
  insertWorkerHistory,
  matchesDueAt,
  scheduleNextAutoRollout
} from '../utils/webhook' // Ajuste o caminho dos seus helpers compartidos

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!
})

type QStashWebhookBody =
  | { type: 'schedule'; jobData: ScheduleJobData }
  | { type: 'auto-rollout'; jobData: AutoRolloutJobData }

// Helper para encapsular a chamada de agendamento do QStash

export async function webhookRoutes(app: FastifyInstance) {
  app.post<{ Body: QStashWebhookBody }>('/webhook', async (request, reply) => {
    // 1. Validar a assinatura do QStash por segurança
    const signature = request.headers['upstash-signature'] as string
    const isValid = await receiver
      .verify({
        signature,
        body: JSON.stringify(request.body)
      })
      .catch(() => false)

    if (!isValid) {
      request.log.error(
        { scope: 'webhook.qstash.auth' },
        'Unauthorized QStash signature'
      )
      return reply.status(401).send({ error: 'Unauthorized' })
    }

    const { type, jobData } = request.body
    const log = request.log

    // ----------------------------------------------------------------
    // CENÁRIO 1: SCHEDULE JOB
    // ----------------------------------------------------------------
    if (type === 'schedule') {
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

    // ----------------------------------------------------------------
    // CENÁRIO 2: AUTO-ROLLOUT JOB
    // ----------------------------------------------------------------
    if (type === 'auto-rollout') {
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

      // 🔥 Lógica da esteira: Se NÃO chegou no limite máximo, agenda dinamicamente o próximo step
      if (!reachedMax && nextAutoRolloutAt) {
        await scheduleNextAutoRollout(nextAutoRolloutAt, jobData, log)
      }

      return reply.status(200).send({ success: true })
    }

    return reply.status(400).send({ error: 'Unknown job type' })
  })
}
