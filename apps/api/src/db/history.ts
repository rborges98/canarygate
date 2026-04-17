import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { history } from '@canarygate/database/schema'
import type { SQL } from 'drizzle-orm'

type InsertHistoryData = {
  projectId: string
  flagId: string | null
  flagKey: string
  flagName: string
  action: 'created' | 'updated' | 'toggled' | 'rollout_updated' | 'deleted'
  actorEmail: string
  changes?: Record<string, unknown> | null
}

export async function insertHistory(data: InsertHistoryData) {
  await db.insert(history).values({
    id: crypto.randomUUID(),
    projectId: data.projectId,
    flagId: data.flagId,
    flagKey: data.flagKey,
    flagName: data.flagName,
    action: data.action,
    actorEmail: data.actorEmail,
    changes: data.changes ?? null
  })
}

export async function listHistory(
  projectId: string,
  options: { flagId?: string; limit?: number; offset?: number }
) {
  const { flagId, limit = 20, offset = 0 } = options

  const where: SQL = flagId
    ? and(eq(history.projectId, projectId), eq(history.flagId, flagId))!
    : eq(history.projectId, projectId)

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
