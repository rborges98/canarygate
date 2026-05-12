import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  environments,
  flagEnvironments,
  flags,
  history
} from '@canarygate/database/schema'
import type { WorkerLogger } from '@canarygate/logger'

type JobIdentifiers = {
  flagEnvironmentId: string
  flagId: string
  projectId: string
  environmentId: string
  environmentSlug: string
}

type WorkerFlagState = {
  flag: typeof flags.$inferSelect
  flagEnvironment: typeof flagEnvironments.$inferSelect
  environment: typeof environments.$inferSelect
}

type InsertWorkerHistoryData = {
  projectId: string
  environmentId: string
  environmentSlug: string
  flagId: string
  flagKey: string
  flagName: string
  action: 'updated' | 'rollout_updated'
  changes: Record<string, unknown>
}

export async function getWorkerFlagState(
  identifiers: JobIdentifiers,
  log: WorkerLogger
) {
  try {
    const rows = await db
      .select({
        flag: flags,
        flagEnvironment: flagEnvironments,
        environment: environments
      })
      .from(flagEnvironments)
      .innerJoin(flags, eq(flags.id, flagEnvironments.flagId))
      .innerJoin(
        environments,
        eq(environments.id, flagEnvironments.environmentId)
      )
      .where(
        and(
          eq(flagEnvironments.id, identifiers.flagEnvironmentId),
          eq(flagEnvironments.flagId, identifiers.flagId),
          eq(flagEnvironments.environmentId, identifiers.environmentId),
          eq(flags.projectId, identifiers.projectId)
        )
      )
      .limit(1)

    if (!rows[0]) {
      return null
    }

    return rows[0] as WorkerFlagState
  } catch (error) {
    log.error(
      {
        err: error,
        scope: 'worker.jobs.getWorkerFlagState',
        ...identifiers
      },
      'Failed to load flag state for a worker job'
    )
    throw error
  }
}

export function matchesDueAt(value: Date | null, dueAt: string) {
  return value?.toISOString() === dueAt
}

export async function insertWorkerHistory(
  data: InsertWorkerHistoryData,
  log: WorkerLogger
) {
  try {
    await db.insert(history).values({
      id: randomUUID(),
      projectId: data.projectId,
      environmentId: data.environmentId,
      environmentSlug: data.environmentSlug,
      flagId: data.flagId,
      flagKey: data.flagKey,
      flagName: data.flagName,
      action: data.action,
      actorEmail: 'system-worker',
      changes: data.changes
    })
  } catch (error) {
    log.error(
      {
        err: error,
        scope: 'worker.jobs.insertWorkerHistory',
        projectId: data.projectId,
        environmentSlug: data.environmentSlug,
        flagId: data.flagId,
        action: data.action
      },
      'Failed to record worker history'
    )
    throw error
  }
}
