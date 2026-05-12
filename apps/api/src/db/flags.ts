import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  flags,
  flagEnvironments,
  environments
} from '@canarygate/database/schema'
import { randomUUID } from 'crypto'
import type { FastifyBaseLogger } from 'fastify'
import { calcIntervalMs } from '../utils/time.ts'

type UpdateFlagScheduleData = {
  scheduleEnabled: boolean
  scheduleDate: string | null
  scheduleAction: 'enable' | 'disable' | 'rollout'
  scheduleRolloutPercent: number
  autoRolloutEnabled: boolean
  autoRolloutIncreaseBy: number
  autoRolloutEveryValue: number
  autoRolloutEveryUnit: 'hours' | 'days' | 'weeks'
  autoRolloutUntilMax: number
}

type FlagEnvironmentConfigData = {
  enabled?: boolean
  rolloutPercent?: number
} & Partial<UpdateFlagScheduleData>

function buildFlagEnvironmentConfig(
  data: FlagEnvironmentConfigData
): Partial<typeof flagEnvironments.$inferInsert> {
  const config: Partial<typeof flagEnvironments.$inferInsert> = {
    enabled: data.enabled ?? false,
    rolloutPercent: data.rolloutPercent ?? 0
  }

  if (data.scheduleEnabled !== undefined) {
    config.scheduleEnabled = data.scheduleEnabled
    config.scheduleDate =
      data.scheduleEnabled && data.scheduleDate
        ? new Date(data.scheduleDate)
        : null

    if (data.scheduleAction !== undefined) {
      config.scheduleAction = data.scheduleAction
    }

    if (data.scheduleRolloutPercent !== undefined) {
      config.scheduleRolloutPercent = data.scheduleRolloutPercent
    }
  }

  if (data.autoRolloutEnabled !== undefined) {
    config.autoRolloutEnabled = data.autoRolloutEnabled

    if (data.autoRolloutIncreaseBy !== undefined) {
      config.autoRolloutIncreaseBy = data.autoRolloutIncreaseBy
    }

    if (data.autoRolloutEveryValue !== undefined) {
      config.autoRolloutEveryValue = data.autoRolloutEveryValue
    }

    if (data.autoRolloutEveryUnit !== undefined) {
      config.autoRolloutEveryUnit = data.autoRolloutEveryUnit
    }

    if (data.autoRolloutUntilMax !== undefined) {
      config.autoRolloutUntilMax = data.autoRolloutUntilMax
    }

    config.autoRolloutNextAt = data.autoRolloutEnabled
      ? new Date(
          Date.now() +
            calcIntervalMs(
              data.autoRolloutEveryValue ?? 1,
              data.autoRolloutEveryUnit ?? 'hours'
            )
        )
      : null
  }

  return config
}

function mergeFlag(
  flag: typeof flags.$inferSelect,
  fe: typeof flagEnvironments.$inferSelect
) {
  return {
    id: flag.id,
    projectId: flag.projectId,
    name: flag.name,
    key: flag.key,
    description: flag.description,
    type: flag.type,
    createdAt: flag.createdAt,
    updatedAt: fe.updatedAt,
    environmentId: fe.environmentId,
    enabled: fe.enabled,
    rolloutPercent: fe.rolloutPercent,
    scheduleEnabled: fe.scheduleEnabled,
    scheduleDate: fe.scheduleDate,
    scheduleAction: fe.scheduleAction,
    scheduleRolloutPercent: fe.scheduleRolloutPercent,
    autoRolloutEnabled: fe.autoRolloutEnabled,
    autoRolloutIncreaseBy: fe.autoRolloutIncreaseBy,
    autoRolloutEveryValue: fe.autoRolloutEveryValue,
    autoRolloutEveryUnit: fe.autoRolloutEveryUnit,
    autoRolloutUntilMax: fe.autoRolloutUntilMax,
    autoRolloutNextAt: fe.autoRolloutNextAt
  }
}

export async function listFlags(
  projectId: string,
  environmentId: string,
  log?: FastifyBaseLogger
) {
  try {
    const rows = await db
      .select()
      .from(flags)
      .innerJoin(
        flagEnvironments,
        and(
          eq(flagEnvironments.flagId, flags.id),
          eq(flagEnvironments.environmentId, environmentId)
        )
      )
      .where(eq(flags.projectId, projectId))

    return rows.map((r) => mergeFlag(r.flags, r.flag_environments))
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.listFlags',
        projectId,
        environmentId
      },
      'Failed in db.flags.listFlags'
    )
    throw error
  }
}

export async function listFlagsWithAllEnvs(
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const rows = await db
      .select({
        flag: flags,
        fe: flagEnvironments,
        env: environments
      })
      .from(flags)
      .leftJoin(flagEnvironments, eq(flagEnvironments.flagId, flags.id))
      .leftJoin(
        environments,
        eq(environments.id, flagEnvironments.environmentId)
      )
      .where(eq(flags.projectId, projectId))

    const map = new Map<
      string,
      {
        id: string
        projectId: string
        name: string
        key: string
        description: string
        type: string
        createdAt: Date
        updatedAt: Date
        environments: {
          slug: string
          name: string
          enabled: boolean
          rolloutPercent: number
        }[]
      }
    >()

    for (const row of rows) {
      if (!map.has(row.flag.id)) {
        map.set(row.flag.id, { ...row.flag, environments: [] })
      }
      if (row.fe && row.env) {
        map.get(row.flag.id)!.environments.push({
          slug: row.env.slug,
          name: row.env.name,
          enabled: row.fe.enabled,
          rolloutPercent: row.fe.rolloutPercent
        })
      }
    }

    return [...map.values()]
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.flags.listFlagsWithAllEnvs', projectId },
      'Failed in db.flags.listFlagsWithAllEnvs'
    )
    throw error
  }
}

export async function getFlagById(
  flagId: string,
  projectId: string,
  environmentId: string,
  log?: FastifyBaseLogger
) {
  try {
    const row = await db
      .select()
      .from(flags)
      .innerJoin(
        flagEnvironments,
        and(
          eq(flagEnvironments.flagId, flags.id),
          eq(flagEnvironments.environmentId, environmentId)
        )
      )
      .where(and(eq(flags.id, flagId), eq(flags.projectId, projectId)))
      .limit(1)

    if (!row[0]) {
      return null
    }

    return mergeFlag(row[0].flags, row[0].flag_environments)
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.getFlagById',
        flagId,
        projectId,
        environmentId
      },
      'Failed in db.flags.getFlagById'
    )
    throw error
  }
}

export async function getFlagMetaById(flagId: string, projectId?: string) {
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
    enabled?: boolean
    rolloutPercent?: number
  } & Partial<UpdateFlagScheduleData>,
  environmentIds: string[],
  log?: FastifyBaseLogger
) {
  try {
    const flagId = randomUUID()
    const environmentConfig = buildFlagEnvironmentConfig({
      enabled: data.enabled,
      rolloutPercent:
        data.type === 'rollout' ? (data.rolloutPercent ?? 0) : 0,
      scheduleEnabled: data.scheduleEnabled,
      scheduleDate: data.scheduleDate,
      scheduleAction: data.scheduleAction,
      scheduleRolloutPercent: data.scheduleRolloutPercent,
      autoRolloutEnabled: data.autoRolloutEnabled,
      autoRolloutIncreaseBy: data.autoRolloutIncreaseBy,
      autoRolloutEveryValue: data.autoRolloutEveryValue,
      autoRolloutEveryUnit: data.autoRolloutEveryUnit,
      autoRolloutUntilMax: data.autoRolloutUntilMax
    })

    const [flag] = await db
      .insert(flags)
      .values({
        id: flagId,
        projectId,
        name: data.name,
        key: data.key,
        description: data.description ?? '',
        type: data.type
      })
      .returning()

    if (environmentIds.length > 0) {
      await db.insert(flagEnvironments).values(
        environmentIds.map((envId) => ({
          id: randomUUID(),
          flagId,
          environmentId: envId,
          ...environmentConfig
        }))
      )
    }

    return flag
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.createFlag',
        projectId,
        flagKey: data.key,
        environmentCount: environmentIds.length
      },
      'Failed in db.flags.createFlag'
    )
    throw error
  }
}

export async function updateFlag(
  flagId: string,
  projectId: string,
  environmentId: string,
  data: {
    name: string
    description: string
    type?: 'boolean' | 'rollout'
    enabled: boolean
    rolloutPercent: number
  } & Partial<UpdateFlagScheduleData>,
  log?: FastifyBaseLogger
) {
  try {
    const environmentConfig = buildFlagEnvironmentConfig(data)

    const [updatedFlag] = await db
      .update(flags)
      .set({
        name: data.name,
        description: data.description,
        ...(data.type ? { type: data.type } : {}),
        updatedAt: new Date()
      })
      .where(and(eq(flags.id, flagId), eq(flags.projectId, projectId)))
      .returning()

    if (!updatedFlag) {
      return null
    }

    const [updatedFe] = await db
      .update(flagEnvironments)
      .set({
        ...environmentConfig,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(flagEnvironments.flagId, flagId),
          eq(flagEnvironments.environmentId, environmentId)
        )
      )
      .returning()

    if (!updatedFe) {
      return null
    }

    return mergeFlag(updatedFlag, updatedFe)
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.updateFlag',
        flagId,
        projectId,
        environmentId
      },
      'Failed in db.flags.updateFlag'
    )
    throw error
  }
}

export async function deleteFlag(
  flagId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const [deleted] = await db
      .delete(flags)
      .where(and(eq(flags.id, flagId), eq(flags.projectId, projectId)))
      .returning()
    return deleted ?? null
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.flags.deleteFlag', flagId, projectId },
      'Failed in db.flags.deleteFlag'
    )
    throw error
  }
}

export async function toggleFlag(
  flagId: string,
  projectId: string,
  environmentId: string,
  log?: FastifyBaseLogger
) {
  try {
    const fe = await db.query.flagEnvironments.findFirst({
      where: and(
        eq(flagEnvironments.flagId, flagId),
        eq(flagEnvironments.environmentId, environmentId)
      )
    })
    if (!fe) {
      return null
    }

    const flagMeta = await db.query.flags.findFirst({
      where: and(eq(flags.id, flagId), eq(flags.projectId, projectId))
    })
    if (!flagMeta) {
      return null
    }

    const [updatedFe] = await db
      .update(flagEnvironments)
      .set({ enabled: !fe.enabled, updatedAt: new Date() })
      .where(
        and(
          eq(flagEnvironments.flagId, flagId),
          eq(flagEnvironments.environmentId, environmentId)
        )
      )
      .returning()

    if (!updatedFe) {
      return null
    }

    return mergeFlag(flagMeta, updatedFe)
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.toggleFlag',
        flagId,
        projectId,
        environmentId
      },
      'Failed in db.flags.toggleFlag'
    )
    throw error
  }
}

export async function updateRollout(
  flagId: string,
  projectId: string,
  environmentId: string,
  rolloutPercent: number,
  log?: FastifyBaseLogger
) {
  try {
    const flagMeta = await db.query.flags.findFirst({
      where: and(eq(flags.id, flagId), eq(flags.projectId, projectId))
    })
    if (!flagMeta) {
      return null
    }

    const [updatedFe] = await db
      .update(flagEnvironments)
      .set({ rolloutPercent, updatedAt: new Date() })
      .where(
        and(
          eq(flagEnvironments.flagId, flagId),
          eq(flagEnvironments.environmentId, environmentId)
        )
      )
      .returning()

    if (!updatedFe) {
      return null
    }

    return mergeFlag(flagMeta, updatedFe)
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.updateRollout',
        flagId,
        projectId,
        environmentId,
        rolloutPercent
      },
      'Failed in db.flags.updateRollout'
    )
    throw error
  }
}

export async function addFlagToEnvironment(
  flagId: string,
  environmentId: string,
  rolloutPercent = 0,
  log?: FastifyBaseLogger
) {
  try {
    const flagMeta = await db.query.flags.findFirst({
      where: eq(flags.id, flagId)
    })
    if (!flagMeta) {
      return null
    }

    const [fe] = await db
      .insert(flagEnvironments)
      .values({
        id: randomUUID(),
        flagId,
        environmentId,
        enabled: false,
        rolloutPercent: flagMeta.type === 'rollout' ? rolloutPercent : 0
      })
      .onConflictDoNothing()
      .returning()

    if (!fe) {
      return null
    }

    return mergeFlag(flagMeta, fe)
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.flags.addFlagToEnvironment',
        flagId,
        environmentId,
        rolloutPercent
      },
      'Failed in db.flags.addFlagToEnvironment'
    )
    throw error
  }
}
