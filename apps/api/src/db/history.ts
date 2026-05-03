import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { auditLog, history } from '@canarygate/database/schema'
import type { SQL } from 'drizzle-orm'
import type { FastifyBaseLogger } from 'fastify'

type FlagAction =
  | 'created'
  | 'updated'
  | 'toggled'
  | 'rollout_updated'
  | 'deleted'

type InsertHistoryData = {
  projectId: string
  environmentId?: string | null
  environmentSlug?: string | null
  flagId: string | null
  flagKey: string
  flagName: string
  action: 'created' | 'updated' | 'toggled' | 'rollout_updated' | 'deleted'
  actorEmail: string
  changes?: Record<string, unknown> | null
}

type AuditResource =
  | 'org'
  | 'member'
  | 'project'
  | 'project_member'
  | 'invite'
  | 'api_key'
  | 'webhook'

type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'accepted'
  | 'role_changed'
  | 'regenerated'

type InsertAuditLogData = {
  orgId?: string | null
  projectId?: string | null
  resourceType: AuditResource
  resourceId: string
  resourceName?: string | null
  action: AuditAction
  actorEmail: string
  changes?: Record<string, unknown> | null
}

export async function insertHistory(
  data: InsertHistoryData,
  log?: FastifyBaseLogger
) {
  try {
    await db.insert(history).values({
      id: crypto.randomUUID(),
      projectId: data.projectId,
      environmentId: data.environmentId ?? null,
      environmentSlug: data.environmentSlug ?? null,
      flagId: data.flagId,
      flagKey: data.flagKey,
      flagName: data.flagName,
      action: data.action,
      actorEmail: data.actorEmail,
      changes: data.changes ?? null
    })
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.history.insertHistory',
        projectId: data.projectId,
        environmentId: data.environmentId ?? null,
        flagId: data.flagId,
        action: data.action
      },
      'Failed in db.history.insertHistory'
    )
    throw error
  }
}

export async function insertAuditLog(
  data: InsertAuditLogData,
  log?: FastifyBaseLogger
) {
  try {
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      orgId: data.orgId ?? null,
      projectId: data.projectId ?? null,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceName: data.resourceName ?? null,
      action: data.action,
      actorEmail: data.actorEmail,
      changes: data.changes ?? null
    })
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.history.insertAuditLog',
        orgId: data.orgId ?? null,
        projectId: data.projectId ?? null,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        action: data.action
      },
      'Failed in db.history.insertAuditLog'
    )
    throw error
  }
}

export async function listHistory(
  projectId: string,
  options: {
    flagId?: string
    environmentId?: string
    limit?: number
    offset?: number
    action?: FlagAction
  }
) {
  const { flagId, environmentId, limit = 20, offset = 0, action } = options

  const conditions: ReturnType<typeof eq>[] = [eq(history.projectId, projectId)]
  if (flagId) {
    conditions.push(eq(history.flagId, flagId))
  }

  if (environmentId) {
    conditions.push(eq(history.environmentId, environmentId))
  }

  if (action) {
    conditions.push(eq(history.action, action))
  }

  const where: SQL =
    conditions.length === 1 ? conditions[0] : and(...conditions)!

  const [totalResult, data] = await Promise.all([
    db.select({ total: count() }).from(history).where(where),
    db
      .select()
      .from(history)
      .where(where)
      .orderBy(desc(history.createdAt))
      .limit(limit)
      .offset(offset)
  ])

  return { total: totalResult[0]?.total ?? 0, data }
}
