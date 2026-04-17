'use server'

import { z } from 'zod'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

const orgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

export async function createOrg(data: { name: string; slug: string }) {
  const parsed = orgSchema.safeParse(data)
  if (!parsed.success) return null

  try {
    const res = await apiFetch(`${API_BASE}/orgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    if (!res.ok) return null
    return res.json() as Promise<{ id: string; name: string; slug: string }>
  } catch (error) {
    console.error('[createOrg] Failed:', error)
    return null
  }
}

export async function updateOrg(
  orgId: string,
  data: { name: string; slug: string }
) {
  const parsed = orgSchema.safeParse(data)
  if (!parsed.success) return false

  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    return res.ok
  } catch (error) {
    console.error('[updateOrg] Failed:', error)
    return false
  }
}

export async function deleteOrg(orgId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}`, {
      method: 'DELETE'
    })
    return res.ok
  } catch (error) {
    console.error('[deleteOrg] Failed:', error)
    return false
  }
}
