import type { FastifyInstance } from 'fastify'
import { and, eq, isNotNull, lte } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { flags, flagEnvironments } from '@canarygate/database/schema'
import { emitFlagEvent } from '../sse/flag-emitter.ts'
import { calcIntervalMs } from '../utils/time.ts'

type AppLogger = FastifyInstance['log']

async function processSchedules(logger: AppLogger): Promise<void> {
  const now = new Date()

  let scheduled: (typeof flagEnvironments.$inferSelect & {
    flagKey: string
    projectId: string
  })[]
  try {
    const rows = await db
      .select({
        fe: flagEnvironments,
        flagKey: flags.key,
        projectId: flags.projectId
      })
      .from(flagEnvironments)
      .innerJoin(flags, eq(flags.id, flagEnvironments.flagId))
      .where(
        and(
          eq(flagEnvironments.scheduleEnabled, true),
          isNotNull(flagEnvironments.scheduleDate),
          lte(flagEnvironments.scheduleDate, now)
        )
      )
    scheduled = rows.map((r) => ({
      ...r.fe,
      flagKey: r.flagKey,
      projectId: r.projectId
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

  for (const fe of scheduled) {
    try {
      let newEnabled = fe.enabled
      if (fe.scheduleAction === 'enable') {
        newEnabled = true
      } else if (fe.scheduleAction === 'disable') {
        newEnabled = false
      }

      let newRolloutPercent = fe.rolloutPercent
      if (fe.scheduleAction === 'rollout') {
        newRolloutPercent = fe.scheduleRolloutPercent
      }

      await db
        .update(flagEnvironments)
        .set({
          enabled: newEnabled,
          rolloutPercent: newRolloutPercent,
          scheduleEnabled: false,
          updatedAt: now
        })
        .where(eq(flagEnvironments.id, fe.id))

      emitFlagEvent(`${fe.projectId}:${fe.environmentId}`, 'flag-updated', {
        key: fe.flagKey,
        enabled: newEnabled,
        rolloutPercent: newRolloutPercent
      })
    } catch (err) {
      logger.error(
        {
          err,
          operation: 'schedule-processor',
          step: 'apply-scheduled-flag',
          flagEnvironmentId: fe.id,
          flagKey: fe.flagKey,
          projectId: fe.projectId,
          environmentId: fe.environmentId
        },
        'Schedule processor failed'
      )
    }
  }
}

async function processAutoRollouts(logger: AppLogger): Promise<void> {
  const now = new Date()

  let pending: (typeof flagEnvironments.$inferSelect & {
    flagKey: string
    projectId: string
  })[]
  try {
    const rows = await db
      .select({
        fe: flagEnvironments,
        flagKey: flags.key,
        projectId: flags.projectId
      })
      .from(flagEnvironments)
      .innerJoin(flags, eq(flags.id, flagEnvironments.flagId))
      .where(
        and(
          eq(flagEnvironments.autoRolloutEnabled, true),
          isNotNull(flagEnvironments.autoRolloutNextAt),
          lte(flagEnvironments.autoRolloutNextAt, now)
        )
      )
    pending = rows.map((r) => ({
      ...r.fe,
      flagKey: r.flagKey,
      projectId: r.projectId
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

  for (const fe of pending) {
    try {
      const newPercent = Math.min(
        fe.rolloutPercent + fe.autoRolloutIncreaseBy,
        fe.autoRolloutUntilMax
      )
      const reached = newPercent >= fe.autoRolloutUntilMax
      let nextAt: Date | null = null
      if (!reached) {
        nextAt = new Date(
          now.getTime() +
            calcIntervalMs(fe.autoRolloutEveryValue, fe.autoRolloutEveryUnit)
        )
      }

      await db
        .update(flagEnvironments)
        .set({
          rolloutPercent: newPercent,
          autoRolloutEnabled: !reached,
          autoRolloutNextAt: nextAt,
          updatedAt: now
        })
        .where(eq(flagEnvironments.id, fe.id))

      emitFlagEvent(`${fe.projectId}:${fe.environmentId}`, 'flag-updated', {
        key: fe.flagKey,
        enabled: fe.enabled,
        rolloutPercent: newPercent
      })
    } catch (err) {
      logger.error(
        {
          err,
          operation: 'schedule-processor',
          step: 'apply-auto-rollout',
          flagEnvironmentId: fe.id,
          flagKey: fe.flagKey,
          projectId: fe.projectId,
          environmentId: fe.environmentId
        },
        'Schedule processor failed'
      )
    }
  }
}

export function startScheduleProcessor(logger: AppLogger): void {
  let running = false

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

  run()
  setInterval(run, 60_000)
}
