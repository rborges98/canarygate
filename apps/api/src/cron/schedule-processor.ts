import type { FastifyInstance } from 'fastify'
import { and, eq, isNotNull, lte } from 'drizzle-orm'
import { Client } from '@upstash/qstash'
import { db } from '@canarygate/database/client'
import {
  environments,
  flags,
  flagEnvironments
} from '@canarygate/database/schema'
import {
  SCHEDULE_SCAN_INTERVAL_MS,
  type AutoRolloutJobData,
  type ScheduleJobData
} from '@canarygate/messaging-utils'
import { getRequiredUrl } from '../utils/env.ts'

type AppLogger = FastifyInstance['log']

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

async function publishJobToQStash(
  type: 'schedule' | 'auto-rollout',
  jobData: ScheduleJobData | AutoRolloutJobData
): Promise<void> {
  const dueAt = new Date(jobData.dueAt)
  const delayInSeconds = Math.floor((dueAt.getTime() - Date.now()) / 1000)
  const apiUrl = getRequiredUrl('API_URL', 'http://localhost:3001', 'schedule-processor')

  await qstash.publishJSON({
    url: `${apiUrl}/webhook`,
    body: { type, jobData },
    ...(delayInSeconds > 0 ? { delay: delayInSeconds } : {})
  })
}

async function processSchedules(logger: AppLogger): Promise<void> {
  const now = new Date()

  let scheduled: (typeof flagEnvironments.$inferSelect & {
    flagId: string
    flagKey: string
    projectId: string
    environmentSlug: string
  })[]
  try {
    const rows = await db
      .select({
        fe: flagEnvironments,
        flagId: flags.id,
        flagKey: flags.key,
        projectId: flags.projectId,
        environmentSlug: environments.slug
      })
      .from(flagEnvironments)
      .innerJoin(flags, eq(flags.id, flagEnvironments.flagId))
      .innerJoin(environments, eq(environments.id, flagEnvironments.environmentId))
      .where(
        and(
          eq(flagEnvironments.scheduleEnabled, true),
          isNotNull(flagEnvironments.scheduleDate),
          lte(flagEnvironments.scheduleDate, now)
        )
      )
    scheduled = rows.map((r) => ({
      ...r.fe,
      flagId: r.flagId,
      flagKey: r.flagKey,
      projectId: r.projectId,
      environmentSlug: r.environmentSlug
    }))
  } catch (err) {
    logger.error(
      {
        err,
        operation: 'schedule-processor',
        step: 'query-scheduled-flags'
      },
      'Schedule processor failed'
    )
    return
  }

  let enqueuedCount = 0

  for (const fe of scheduled) {
    if (!fe.scheduleDate) {
      continue
    }

    const jobData: ScheduleJobData = {
      flagEnvironmentId: fe.id,
      flagId: fe.flagId,
      projectId: fe.projectId,
      environmentId: fe.environmentId,
      environmentSlug: fe.environmentSlug,
      flagKey: fe.flagKey,
      dueAt: fe.scheduleDate.toISOString()
    }

    try {
      await publishJobToQStash('schedule', jobData)
      enqueuedCount += 1
    } catch (err) {
      logger.error(
        {
          err,
          operation: 'schedule-processor',
          step: 'enqueue-scheduled-flag',
          flagEnvironmentId: fe.id,
          flagKey: fe.flagKey,
          projectId: fe.projectId,
          environmentSlug: fe.environmentSlug,
          dueAt: jobData.dueAt
        },
        'Schedule processor failed'
      )
    }
  }

  if (enqueuedCount > 0) {
    logger.info(
      {
        operation: 'schedule-processor',
        step: 'enqueue-scheduled-flags',
        count: enqueuedCount
      },
      'Enqueued due schedule jobs'
    )
  }
}

async function processAutoRollouts(logger: AppLogger): Promise<void> {
  const now = new Date()

  let pending: (typeof flagEnvironments.$inferSelect & {
    flagId: string
    flagKey: string
    projectId: string
    environmentSlug: string
  })[]
  try {
    const rows = await db
      .select({
        fe: flagEnvironments,
        flagId: flags.id,
        flagKey: flags.key,
        projectId: flags.projectId,
        environmentSlug: environments.slug
      })
      .from(flagEnvironments)
      .innerJoin(flags, eq(flags.id, flagEnvironments.flagId))
      .innerJoin(environments, eq(environments.id, flagEnvironments.environmentId))
      .where(
        and(
          eq(flagEnvironments.autoRolloutEnabled, true),
          isNotNull(flagEnvironments.autoRolloutNextAt),
          lte(flagEnvironments.autoRolloutNextAt, now)
        )
      )
    pending = rows.map((r) => ({
      ...r.fe,
      flagId: r.flagId,
      flagKey: r.flagKey,
      projectId: r.projectId,
      environmentSlug: r.environmentSlug
    }))
  } catch (err) {
    logger.error(
      {
        err,
        operation: 'schedule-processor',
        step: 'query-auto-rollout-flags'
      },
      'Schedule processor failed'
    )
    return
  }

  let enqueuedCount = 0

  for (const fe of pending) {
    if (!fe.autoRolloutNextAt) {
      continue
    }

    const jobData: AutoRolloutJobData = {
      flagEnvironmentId: fe.id,
      flagId: fe.flagId,
      projectId: fe.projectId,
      environmentId: fe.environmentId,
      environmentSlug: fe.environmentSlug,
      flagKey: fe.flagKey,
      dueAt: fe.autoRolloutNextAt.toISOString()
    }

    try {
      await publishJobToQStash('auto-rollout', jobData)
      enqueuedCount += 1
    } catch (err) {
      logger.error(
        {
          err,
          operation: 'schedule-processor',
          step: 'enqueue-auto-rollout',
          flagEnvironmentId: fe.id,
          flagKey: fe.flagKey,
          projectId: fe.projectId,
          environmentSlug: fe.environmentSlug,
          dueAt: jobData.dueAt
        },
        'Schedule processor failed'
      )
    }
  }

  if (enqueuedCount > 0) {
    logger.info(
      {
        operation: 'schedule-processor',
        step: 'enqueue-auto-rollouts',
        count: enqueuedCount
      },
      'Enqueued due auto-rollout jobs'
    )
  }
}

export function startScheduleProcessor(logger: AppLogger) {
  let running = false
  let intervalHandle: ReturnType<typeof setInterval> | null = null

  const run = async () => {
    if (running) {
      return
    }

    running = true
    try {
      await Promise.all([processSchedules(logger), processAutoRollouts(logger)])
    } catch (err) {
      logger.error(
        {
          err,
          operation: 'schedule-processor',
          step: 'run'
        },
        'Schedule processor failed'
      )
    } finally {
      running = false
    }
  }

  void run()
  intervalHandle = setInterval(run, SCHEDULE_SCAN_INTERVAL_MS)

  return () => {
    if (intervalHandle) {
      clearInterval(intervalHandle)
      intervalHandle = null
    }
  }
}
