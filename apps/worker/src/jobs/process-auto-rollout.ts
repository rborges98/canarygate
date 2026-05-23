import type { Job } from 'bullmq'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { flagEnvironments } from '@canarygate/database/schema'
import type { WorkerLogger } from '@canarygate/logger'
import {
  calcIntervalMs,
  type AutoRolloutJobData
} from '@canarygate/messaging-utils'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import {
  getWorkerFlagState,
  insertWorkerHistory,
  matchesDueAt
} from './shared.ts'

export async function processAutoRolloutJob(
  job: Job<AutoRolloutJobData>,
  log: WorkerLogger
) {
  const state = await getWorkerFlagState(job.data, log)

  if (!state) {
    log.warn(
      {
        scope: 'worker.jobs.processAutoRolloutJob',
        flagId: job.data.flagId,
        projectId: job.data.projectId,
        environmentSlug: job.data.environmentSlug
      },
      'Skipping auto-rollout job because the flag state no longer exists'
    )
    return
  }

  const { flag, flagEnvironment, environment } = state

  if (
    !flagEnvironment.autoRolloutEnabled ||
    !matchesDueAt(flagEnvironment.autoRolloutNextAt, job.data.dueAt)
  ) {
    log.info(
      {
        scope: 'worker.jobs.processAutoRolloutJob',
        flagKey: flag.key,
        environmentSlug: environment.slug,
        dueAt: job.data.dueAt
      },
      'Skipping stale auto-rollout job'
    )
    return
  }

  const now = new Date()
  const dueAt = new Date(job.data.dueAt)
  const nextRolloutPercent = Math.min(
    flagEnvironment.rolloutPercent + flagEnvironment.autoRolloutIncreaseBy,
    flagEnvironment.autoRolloutUntilMax
  )
  const reachedMax = nextRolloutPercent >= flagEnvironment.autoRolloutUntilMax
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
        eq(flagEnvironments.id, job.data.flagEnvironmentId),
        eq(flagEnvironments.environmentId, job.data.environmentId),
        eq(flagEnvironments.autoRolloutEnabled, true),
        eq(flagEnvironments.autoRolloutNextAt, dueAt)
      )
    )
    .returning()

  if (!updatedFlagEnvironment) {
    log.info(
      {
        scope: 'worker.jobs.processAutoRolloutJob',
        flagKey: flag.key,
        environmentSlug: environment.slug,
        dueAt: job.data.dueAt
      },
      'Auto-rollout job was already applied or superseded'
    )
    return
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
      scope: 'worker.jobs.processAutoRolloutJob',
      flagKey: flag.key,
      projectId: flag.projectId,
      environmentSlug: environment.slug,
      reachedMax
    },
    'Processed auto-rollout job'
  )
}
