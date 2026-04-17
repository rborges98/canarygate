import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

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
  scheduleRolloutPercent?: number
}

export type FlagItem = {
  flagId: string
  key: string
  name: string
  description: string
  status: 'enabled' | 'disabled' | 'rollout'
  rollout?: number
}

export async function getFlags(
  orgId: string,
  projectId: string
): Promise<FlagItem[]> {
  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags`
  )
  if (!res.ok) return []
  const data: ApiFlag[] = await res.json()
  return data.map((f) => ({
    flagId: f.id,
    key: f.key,
    name: f.name,
    description: f.description,
    status:
      f.type === 'rollout' ? 'rollout' : f.enabled ? 'enabled' : 'disabled',
    rollout: f.type === 'rollout' ? f.rolloutPercent : undefined
  }))
}

export async function getFlag(
  orgId: string,
  projectId: string,
  flagId: string
): Promise<ApiFlag | null> {
  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags/${flagId}`
  )
  if (!res.ok) return null
  return res.json()
}
