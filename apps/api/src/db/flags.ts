import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { flags } from '@canarygate/database/schema'

export async function listFlags(projectId: string) {
  return db.query.flags.findMany({ where: eq(flags.projectId, projectId) })
}

export async function getFlagById(flagId: string, projectId?: string) {
  if (projectId) {
    return db.query.flags.findFirst({
      where: and(eq(flags.id, flagId), eq(flags.projectId, projectId))
    })
  }
  return db.query.flags.findFirst({ where: eq(flags.id, flagId) })
}

export async function createFlag(
  projectId: string,
  data: {
    name: string
    key: string
    description?: string
    type: 'boolean' | 'rollout'
    rolloutPercent?: number
  }
) {
  const [flag] = await db
    .insert(flags)
    .values({
      id: crypto.randomUUID(),
      projectId,
      name: data.name,
      key: data.key,
      description: data.description ?? '',
      type: data.type,
      enabled: false,
      rolloutPercent: data.type === 'rollout' ? (data.rolloutPercent ?? 0) : 0
    })
    .returning()
  return flag
}

export async function updateFlag(
  flagId: string,
  projectId: string,
  data: {
    name: string
    description: string
    enabled: boolean
    rolloutPercent: number
  }
) {
  const [updated] = await db
    .update(flags)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(flags.id, flagId), eq(flags.projectId, projectId)))
    .returning()
  return updated ?? null
}

export async function deleteFlag(flagId: string, projectId: string) {
  const [deleted] = await db
    .delete(flags)
    .where(and(eq(flags.id, flagId), eq(flags.projectId, projectId)))
    .returning()
  return deleted ?? null
}

export async function toggleFlag(flagId: string, projectId: string) {
  const flag = await db.query.flags.findFirst({
    where: and(eq(flags.id, flagId), eq(flags.projectId, projectId))
  })
  if (!flag) return null
  const [updated] = await db
    .update(flags)
    .set({ enabled: !flag.enabled, updatedAt: new Date() })
    .where(eq(flags.id, flagId))
    .returning()
  return updated ?? null
}

export async function updateRollout(
  flagId: string,
  projectId: string,
  rolloutPercent: number
) {
  const [updated] = await db
    .update(flags)
    .set({ rolloutPercent, updatedAt: new Date() })
    .where(and(eq(flags.id, flagId), eq(flags.projectId, projectId)))
    .returning()
  return updated ?? null
}
