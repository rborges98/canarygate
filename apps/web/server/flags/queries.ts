import { apiFetch } from '../api-fetch'

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

export async function getFlags(
  orgId: string,
  projectId: string,
  environmentSlug?: string
): Promise<FlagItem[]> {
  const url = new URL(`${API_BASE}/orgs/${orgId}/projects/${projectId}/flags`)

  if (environmentSlug) {
    url.searchParams.set('environmentSlug', environmentSlug)
  }

  const res = await apiFetch(url.toString())
  if (!res.ok) {
    return []
  }

  const data: RawApiFlag[] = await res.json()

  function getFlagStatus(flag: ApiFlag): FlagItem['status'] {
    if (flag.type === 'rollout') {
      return 'rollout'
    }

    if (flag.enabled) {
      return 'enabled'
    }

    return 'disabled'
  }

  return data.map((f) => ({
    flagId: f.id,
    key: f.key,
    name: f.name,
    description: f.description,
    type: f.type,
    status: getFlagStatus(f),
    rollout: f.type === 'rollout' ? f.rolloutPercent : undefined
  }))
}

async function getFlagById(
  orgId: string,
  projectId: string,
  flagId: string,
  environmentSlug?: string
): Promise<ApiFlag | null> {
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

  const flag: RawApiFlag = await res.json()
  return normalizeFlag(flag)
}

async function getFlagIdByKey(
  orgId: string,
  projectId: string,
  flagKey: string,
  environmentSlug?: string
) {
  const flags = await getFlags(orgId, projectId, environmentSlug)
  return flags.find((flag) => flag.key === flagKey)?.flagId ?? null
}

export async function getFlag(
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
