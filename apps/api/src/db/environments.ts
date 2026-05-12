import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  environments,
  flags,
  flagEnvironments,
  type NewEnvironment
} from '@canarygate/database/schema'
import { randomUUID } from 'crypto'
import type { FastifyBaseLogger } from 'fastify'

const DEFAULT_ENVS: { name: string; slug: string; isDefault: boolean }[] = [
  { name: 'Development', slug: 'development', isDefault: false },
  { name: 'Staging', slug: 'staging', isDefault: false },
  { name: 'Production', slug: 'production', isDefault: true }
]

const SLUG_ORDER: Record<string, number> = {
  development: 0,
  staging: 1,
  production: 2
}

export async function listEnvironments(
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const rows = await db
      .select()
      .from(environments)
      .where(eq(environments.projectId, projectId))
    return rows.sort(
      (a, b) => (SLUG_ORDER[a.slug] ?? 99) - (SLUG_ORDER[b.slug] ?? 99)
    )
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.environments.listEnvironments', projectId },
      'Failed in db.environments.listEnvironments'
    )
    throw error
  }
}

export async function getEnvironmentBySlug(
  projectId: string,
  slug: string,
  log?: FastifyBaseLogger
) {
  try {
    return await db.query.environments.findFirst({
      where: and(
        eq(environments.projectId, projectId),
        eq(environments.slug, slug)
      )
    })
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.environments.getEnvironmentBySlug',
        projectId,
        slug
      },
      'Failed in db.environments.getEnvironmentBySlug'
    )
    throw error
  }
}

export async function createDefaultEnvironments(
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const rows: NewEnvironment[] = DEFAULT_ENVS.map((env) => ({
      id: randomUUID(),
      projectId,
      name: env.name,
      slug: env.slug,
      isDefault: env.isDefault
    }))
    return await db.insert(environments).values(rows).returning()
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.environments.createDefaultEnvironments',
        projectId
      },
      'Failed in db.environments.createDefaultEnvironments'
    )
    throw error
  }
}

export async function getOrCreateEnvironments(
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const existing = await listEnvironments(projectId, log)
    if (existing.length > 0) {
      return existing
    }

    const created = await createDefaultEnvironments(projectId, log)

    const existingFlags = await db
      .select({ id: flags.id })
      .from(flags)
      .where(eq(flags.projectId, projectId))

    if (existingFlags.length > 0) {
      const feRows = existingFlags.flatMap((flag) =>
        created.map((env) => ({
          id: randomUUID(),
          flagId: flag.id,
          environmentId: env.id,
          enabled: false,
          rolloutPercent: 0
        }))
      )
      await db.insert(flagEnvironments).values(feRows)
    }

    return created
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.environments.getOrCreateEnvironments',
        projectId
      },
      'Failed in db.environments.getOrCreateEnvironments'
    )
    throw error
  }
}
