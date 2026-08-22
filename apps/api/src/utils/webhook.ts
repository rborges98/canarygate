import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  environments,
  flagEnvironments,
  flags,
  history
} from '@canarygate/database/schema'
import type { FastifyBaseLogger } from 'fastify'
import { Client } from '@upstash/qstash'
import type { AutoRolloutJobData } from '@canarygate/messaging-utils'
import { getRequiredEnv, IS_PRODUCTION } from './env.ts'

export const DUE_AT_TOLERANCE_MS = 5000
export const MAX_QSTASH_DELAY_SECONDS = 30 * 24 * 60 * 60

let qstashClient: Client | null = null

export function getQStashClient() {
  if (!qstashClient) {
    qstashClient = new Client({
      token: getRequiredEnv('QSTASH_TOKEN', 'api qstash')
    })
  }

  return qstashClient
}

export function getQStashWebhookUrl(path = '') {
  const baseUrl = IS_PRODUCTION
    ? process.env.API_URL
    : (process.env.NGROK_URL ?? process.env.API_URL)

  return `${baseUrl?.replace(/\/$/, '') ?? ''}${path}`
}

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
  log: FastifyBaseLogger
) {
  try {
    const [row] = await db
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
          // Apenas a combinação de Flag + Ambiente já é o suficiente para achar a linha
          eq(flagEnvironments.flagId, identifiers.flagId),
          eq(flagEnvironments.environmentId, identifiers.environmentId),
          // Mantemos isso por segurança, para garantir que a flag pertence a este projeto
          eq(flags.projectId, identifiers.projectId)
        )
      )
      .limit(1)

    if (!row) {
      return null
    }

    return row as WorkerFlagState
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
  if (!value) {
    return false
  }

  const target = new Date(dueAt)
  if (Number.isNaN(target.getTime())) {
    return false
  }

  return Math.abs(value.getTime() - target.getTime()) <= DUE_AT_TOLERANCE_MS
}

export async function insertWorkerHistory(
  data: InsertWorkerHistoryData,
  log: FastifyBaseLogger
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

export async function scheduleNextAutoRollout(
  targetDate: Date,
  jobData: AutoRolloutJobData,
  log: FastifyBaseLogger
) {
  const delayInSeconds = Math.floor((targetDate.getTime() - Date.now()) / 1000)
  if (delayInSeconds <= 0) return

  const dueAt = targetDate.toISOString()

  try {
    await getQStashClient().publishJSON({
      url: `${getQStashWebhookUrl()}/webhook`,
      body: {
        type: 'auto-rollout',
        jobData: {
          ...jobData,
          dueAt // Atualiza o dueAt esperado para o próximo step
        }
      },
      delay: delayInSeconds,
      deduplicationId: `auto-rollout:${jobData.flagId}:${jobData.environmentId}:${dueAt}`
    })
  } catch (error) {
    log.error(
      { err: error, jobData },
      'Failed to schedule next auto-rollout step in QStash'
    )
  }
}
