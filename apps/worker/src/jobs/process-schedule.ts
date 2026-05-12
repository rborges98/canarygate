import type { Job } from 'bullmq'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { flagEnvironments } from '@canarygate/database/schema'
import type { WorkerLogger } from '@canarygate/logger'
import type { ScheduleJobData } from '@canarygate/messaging-utils'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import {
  getWorkerFlagState,
  insertWorkerHistory,
  matchesDueAt
} from './shared.ts'

export async function processScheduleJob(
  job: Job<ScheduleJobData>,
  log: WorkerLogger
) {
  const state = await getWorkerFlagState(job.data, log)

  if (!state) {
    log.warn(
      {
        scope: 'worker.jobs.processScheduleJob',
        flagEnvironmentId: job.data.flagEnvironmentId,
        flagId: job.data.flagId,
        projectId: job.data.projectId,
        environmentSlug: job.data.environmentSlug
      },
      'Skipping schedule job because the flag state no longer exists'
    )
    return
  }

  const { flag, flagEnvironment, environment } = state

  if (
    !flagEnvironment.scheduleEnabled ||
    !matchesDueAt(flagEnvironment.scheduleDate, job.data.dueAt)
  ) {
    log.info(
      {
        scope: 'worker.jobs.processScheduleJob',
        flagEnvironmentId: job.data.flagEnvironmentId,
        flagKey: flag.key,
        dueAt: job.data.dueAt
      },
      'Skipping stale schedule job'
    )
    return
  }

  const now = new Date()
  const dueAt = new Date(job.data.dueAt)

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
        eq(flagEnvironments.id, job.data.flagEnvironmentId),
        eq(flagEnvironments.environmentId, job.data.environmentId),
        eq(flagEnvironments.scheduleEnabled, true),
        eq(flagEnvironments.scheduleDate, dueAt)
      )
    )
    .returning()

  if (!updatedFlagEnvironment) {
    log.info(
      {
        scope: 'worker.jobs.processScheduleJob',
        flagEnvironmentId: job.data.flagEnvironmentId,
        flagKey: flag.key,
        dueAt: job.data.dueAt
      },
      'Schedule job was already applied or superseded'
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
      scope: 'worker.jobs.processScheduleJob',
      flagEnvironmentId: job.data.flagEnvironmentId,
      flagKey: flag.key,
      projectId: flag.projectId,
      environmentSlug: environment.slug
    },
    'Processed schedule job'
  )
}
