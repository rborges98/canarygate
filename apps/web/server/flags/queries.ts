import { cache } from 'react'
import { apiFetch } from '../api-fetch'
import { createTtlCache } from '../cache/ttl-cache'
import { getProjectFlagVersion } from '../cache/flag-invalidation'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

type RawApiFlag = {
  id: string
  name: string
  key: string
  description: string
  type: 'boolean' | 'rollout'
  enabled: boolean
  rolloutPercent: number
  scheduleEnabled?: boolean
  scheduleDate?: string
  scheduleAction?: 'enable' | 'disable' | 'rollout'
  autoRolloutEnabled?: boolean
  autoRolloutIncreaseBy?: number
  autoRolloutEveryValue?: number
  autoRolloutEveryUnit?: 'hours' | 'days' | 'weeks'
  autoRolloutUntilMax?: number
  autoRolloutNextAt?: string
  scheduleRolloutPercent?: number
}

type ApiFlag = {
  id: string
  name: string
  key: string
  description: string
  type: 'boolean' | 'rollout'
  enabled: boolean
  rolloutPercent: number
  scheduleEnabled?: boolean
  scheduleDate?: string
  scheduleAction?: 'enable' | 'disable' | 'rollout'
  autoRolloutEnabled?: boolean
  increaseBy?: number
  everyValue?: number
  everyUnit?: 'hours' | 'days' | 'weeks'
  untilMax?: number
  autoRolloutNextAt?: string
  scheduleRolloutPercent?: number
}

function normalizeFlag(flag: RawApiFlag): ApiFlag {
  return {
    id: flag.id,
    name: flag.name,
    key: flag.key,
    description: flag.description,
    type: flag.type,
    enabled: flag.enabled,
    rolloutPercent: flag.rolloutPercent,
    scheduleEnabled: flag.scheduleEnabled,
    scheduleDate: flag.scheduleDate,
    scheduleAction: flag.scheduleAction,
    autoRolloutEnabled: flag.autoRolloutEnabled,
    increaseBy: flag.autoRolloutIncreaseBy,
    everyValue: flag.autoRolloutEveryValue,
    everyUnit: flag.autoRolloutEveryUnit,
    untilMax: flag.autoRolloutUntilMax,
    autoRolloutNextAt: flag.autoRolloutNextAt,
    scheduleRolloutPercent: flag.scheduleRolloutPercent
  }
}

export type FlagItem = {
  flagId: string
  key: string
  name: string
  description: string
  type: 'boolean' | 'rollout'
  status: 'enabled' | 'disabled' | 'rollout'
  rollout?: number
}

type CachedFlagList = {
  flags: FlagItem[]
  total: number
  page: number
  pageSize: number
  version: number
}

type CachedFlagDetail = {
  flag: ApiFlag | null
  version: number
}

const flagListCache = createTtlCache<CachedFlagList>({
  ttlMs: 30_000,
  maxEntries: 200
})

const flagDetailCache = createTtlCache<CachedFlagDetail>({
  ttlMs: 30_000,
  maxEntries: 300
})

export type FlagList = {
  items: FlagItem[]
  total: number
  page: number
  pageSize: number
}

export const getFlags = cache(
  async function getFlags(
    orgId: string,
    projectId: string,
    environmentSlug?: string,
    page = 1,
    pageSize = 50
  ): Promise<FlagList> {
    const key = `flags:${projectId}:${environmentSlug ?? 'default'}:${page}:${pageSize}`
    const version = getProjectFlagVersion(projectId)
    const cached = flagListCache.get(key)

    if (cached && version <= cached.version) {
      return {
        items: cached.flags,
        total: cached.total,
        page: cached.page,
        pageSize: cached.pageSize
      }
    }

    flagListCache.delete(key)

    const url = new URL(`${API_BASE}/orgs/${orgId}/projects/${projectId}/flags`)
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))

    if (environmentSlug) {
      url.searchParams.set('environmentSlug', environmentSlug)
    }

    const res = await apiFetch(url.toString())
    if (!res.ok) {
      return { items: [], total: 0, page, pageSize }
    }

    const data: {
      items: RawApiFlag[]
      total: number
      page: number
      pageSize: number
    } = await res.json()

    function getFlagStatus(flag: ApiFlag): FlagItem['status'] {
      if (flag.type === 'rollout') {
        return 'rollout'
      }

      if (flag.enabled) {
        return 'enabled'
      }

      return 'disabled'
    }

    const flags = data.items.map((f) => ({
      flagId: f.id,
      key: f.key,
      name: f.name,
      description: f.description,
      type: f.type,
      status: getFlagStatus(f),
      rollout: f.type === 'rollout' ? f.rolloutPercent : undefined
    }))

    flagListCache.set(key, {
      flags,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
      version
    })

    return {
      items: flags,
      total: data.total,
      page: data.page,
      pageSize: data.pageSize
    }
  }
)

const getFlagById = cache(
  async function getFlagById(
    orgId: string,
    projectId: string,
    flagId: string,
    environmentSlug?: string
  ): Promise<ApiFlag | null> {
    const key = `flag:${flagId}:${environmentSlug ?? 'default'}`
    const version = getProjectFlagVersion(projectId)
    const cached = flagDetailCache.get(key)

    if (cached && version <= cached.version) {
      return cached.flag
    }

    flagDetailCache.delete(key)

    const url = new URL(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags/${flagId}`
    )

    if (environmentSlug) {
      url.searchParams.set('environmentSlug', environmentSlug)
    }

    const res = await apiFetch(url.toString())
    if (!res.ok) {
      return null
    }

    const data: RawApiFlag = await res.json()
    const flag = normalizeFlag(data)

    flagDetailCache.set(key, { flag, version })

    return flag
  }
)

const getFlagIdByKey = cache(
  async function getFlagIdByKey(
    orgId: string,
    projectId: string,
    flagKey: string,
    environmentSlug?: string
  ) {
    const pageSize = 100
    let page = 1

    while (true) {
      const { items, total } = await getFlags(
        orgId,
        projectId,
        environmentSlug,
        page,
        pageSize
      )
      const found = items.find((flag) => flag.key === flagKey)
      if (found) {
        return found.flagId
      }
      if (page * pageSize >= total) {
        return null
      }
      page++
    }
  }
)

export const getFlag = cache(
  async function getFlag(
    orgId: string,
    projectId: string,
    flagKey: string,
    environmentSlug?: string
  ): Promise<ApiFlag | null> {
    const flagId = await getFlagIdByKey(
      orgId,
      projectId,
      flagKey,
      environmentSlug
    )
    if (!flagId) {
      return null
    }

    return getFlagById(orgId, projectId, flagId, environmentSlug)
  }
)
