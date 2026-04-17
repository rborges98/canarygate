'use server'

import { z } from 'zod'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

const webhookSchema = z.object({
  webhookUrl: z.string().url().startsWith('https://').nullable()
})

export async function createProject(
  orgId: string,
  data: { name: string; slug: string }
) {
  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) return null

  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    if (!res.ok) return null
    return res.json() as Promise<{ id: string; name: string; slug: string }>
  } catch (error) {
    console.error('[createProject] Failed:', error)
    return null
  }
}

export async function updateProject(
  orgId: string,
  projectId: string,
  data: { name: string; slug: string }
) {
  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) return false

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    return res.ok
  } catch (error) {
    console.error('[updateProject] Failed:', error)
    return false
  }
}

export async function deleteProject(orgId: string, projectId: string) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}`,
      { method: 'DELETE' }
    )
    return res.ok
  } catch (error) {
    console.error('[deleteProject] Failed:', error)
    return false
  }
}

export async function regenerateApiKey(orgId: string, projectId: string) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/api-key/regenerate`,
      { method: 'POST' }
    )
    if (!res.ok) return null
    const data: { apiKey: string } = await res.json()
    return data.apiKey
  } catch (error) {
    console.error('[regenerateApiKey] Failed:', error)
    return null
  }
}

export async function updateWebhook(
  orgId: string,
  projectId: string,
  webhookUrl: string | null
) {
  const parsed = webhookSchema.safeParse({ webhookUrl })
  if (!parsed.success) return false

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/webhook`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    return res.ok
  } catch (error) {
    console.error('[updateWebhook] Failed:', error)
    return false
  }
}
