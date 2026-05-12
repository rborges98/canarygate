'use server'

import { z } from 'zod'
import { logServerError } from '@canarygate/logger'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

const createFlagSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum(['boolean', 'rollout']),
  enabled: z.boolean().default(false),
  rolloutPercent: z.number().min(0).max(100),
  scheduleEnabled: z.boolean().optional(),
  scheduleDate: z.string().nullable().optional(),
  scheduleAction: z.enum(['enable', 'disable', 'rollout']).optional(),
  scheduleRolloutPercent: z.number().min(0).max(100).optional(),
  autoRolloutEnabled: z.boolean().optional(),
  autoRolloutIncreaseBy: z.number().min(1).max(100).optional(),
  autoRolloutEveryValue: z.number().int().min(1).optional(),
  autoRolloutEveryUnit: z.enum(['hours', 'days', 'weeks']).optional(),
  autoRolloutUntilMax: z.number().min(1).max(100).optional(),
  environments: z.array(z.string().min(1)).min(1).optional()
})

const updateFlagSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum(['boolean', 'rollout']).optional(),
  enabled: z.boolean(),
  rolloutPercent: z.number().min(0).max(100),
  scheduleEnabled: z.boolean().optional(),
  scheduleDate: z.string().nullable().optional(),
  scheduleAction: z.enum(['enable', 'disable', 'rollout']).optional(),
  scheduleRolloutPercent: z.number().min(0).max(100).optional(),
  autoRolloutEnabled: z.boolean().optional(),
  autoRolloutIncreaseBy: z.number().min(1).max(100).optional(),
  autoRolloutEveryValue: z.number().int().min(1).optional(),
  autoRolloutEveryUnit: z.enum(['hours', 'days', 'weeks']).optional(),
  autoRolloutUntilMax: z.number().min(1).max(100).optional()
})

export async function createFlag(
  orgId: string,
  projectId: string,
  data: {
    name: string
    key: string
    description: string
    type: 'boolean' | 'rollout'
    enabled?: boolean
    rolloutPercent: number
    scheduleEnabled?: boolean
    scheduleDate?: string | null
    scheduleAction?: 'enable' | 'disable' | 'rollout'
    scheduleRolloutPercent?: number
    autoRolloutEnabled?: boolean
    autoRolloutIncreaseBy?: number
    autoRolloutEveryValue?: number
    autoRolloutEveryUnit?: 'hours' | 'days' | 'weeks'
    autoRolloutUntilMax?: number
    environments?: string[]
  }
) {
  const parsed = createFlagSchema.safeParse(data)
  if (!parsed.success) {
    return null
  }

  try {
    const url = new URL(`${API_BASE}/orgs/${orgId}/projects/${projectId}/flags`)
    const res = await apiFetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    if (!res.ok) {
      return null
    }

    return res.json() as Promise<{ id: string }>
  } catch (error) {
    logServerError('createFlag falhou', error, { orgId, projectId })
    return null
  }
}

export async function updateFlag(
  orgId: string,
  projectId: string,
  flagId: string,
  data: {
    name: string
    description: string
    type?: 'boolean' | 'rollout'
    enabled: boolean
    rolloutPercent: number
    scheduleEnabled?: boolean
    scheduleDate?: string | null
    scheduleAction?: 'enable' | 'disable' | 'rollout'
    scheduleRolloutPercent?: number
    autoRolloutEnabled?: boolean
    autoRolloutIncreaseBy?: number
    autoRolloutEveryValue?: number
    autoRolloutEveryUnit?: 'hours' | 'days' | 'weeks'
    autoRolloutUntilMax?: number
  },
  environmentSlug?: string
) {
  const parsed = updateFlagSchema.safeParse(data)
  if (!parsed.success) {
    return false
  }

  try {
    const url = new URL(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags/${flagId}`
    )
    if (environmentSlug) {
      url.searchParams.set('environmentSlug', environmentSlug)
    }

    const res = await apiFetch(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    return res.ok
  } catch (error) {
    logServerError('updateFlag falhou', error, {
      orgId,
      projectId,
      flagId,
      environmentSlug
    })
    return false
  }
}

export async function deleteFlag(
  orgId: string,
  projectId: string,
  flagId: string
) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags/${flagId}`,
      { method: 'DELETE' }
    )
    return res.ok
  } catch (error) {
    logServerError('deleteFlag falhou', error, { orgId, projectId, flagId })
    return false
  }
}
