'use server'

import { z } from 'zod'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

const createFlagSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum(['boolean', 'rollout']),
  rolloutPercent: z.number().min(0).max(100)
})

const updateFlagSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  enabled: z.boolean(),
  rolloutPercent: z.number().min(0).max(100)
})

export async function createFlag(
  orgId: string,
  projectId: string,
  data: {
    name: string
    key: string
    description: string
    type: 'boolean' | 'rollout'
    rolloutPercent: number
  }
) {
  const parsed = createFlagSchema.safeParse(data)
  if (!parsed.success) return null

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    if (!res.ok) return null
    return res.json() as Promise<{ id: string }>
  } catch (error) {
    console.error('[createFlag] Failed:', error)
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
    enabled: boolean
    rolloutPercent: number
  }
) {
  const parsed = updateFlagSchema.safeParse(data)
  if (!parsed.success) return false

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/flags/${flagId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    return res.ok
  } catch (error) {
    console.error('[updateFlag] Failed:', error)
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
    console.error('[deleteFlag] Failed:', error)
    return false
  }
}
