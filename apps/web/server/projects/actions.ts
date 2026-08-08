'use server'

import { z } from 'zod'
import { logServerError } from '@canarygate/logger'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

async function getErrorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: string }
    return body.message
  } catch {
    return undefined
  }
}

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

type ProjectResult =
  | { ok: true; data: { id: string; name: string; slug: string } }
  | { ok: false; message?: string }

type ToggleProjectResult =
  | { ok: true; data: { active: boolean } }
  | { ok: false; message?: string }

type RegenerateKeyResult =
  | { ok: true; data: string }
  | { ok: false; message?: string }

export async function createProject(
  orgId: string,
  data: { name: string; slug: string }
): Promise<ProjectResult> {
  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }

    const data = (await res.json()) as { id: string; name: string; slug: string }
    return { ok: true, data }
  } catch (error) {
    logServerError('createProject falhou', error, { orgId })
    return { ok: false }
  }
}

export async function updateProject(
  orgId: string,
  projectId: string,
  data: { name: string; slug: string }
) {
  const parsed = projectSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('updateProject falhou', error, { orgId, projectId })
    return { ok: false }
  }
}

export async function deleteProject(orgId: string, projectId: string) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('deleteProject falhou', error, { orgId, projectId })
    return { ok: false }
  }
}

export async function toggleProjectActive(
  orgId: string,
  projectId: string
): Promise<ToggleProjectResult> {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/toggle`,
      { method: 'PATCH' }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }

    const data = (await res.json()) as { active: boolean }
    return { ok: true, data }
  } catch (error) {
    logServerError('toggleProjectActive falhou', error, { orgId, projectId })
    return { ok: false }
  }
}

export async function regenerateApiKey(
  orgId: string,
  projectId: string
): Promise<RegenerateKeyResult> {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/api-key/regenerate`,
      { method: 'POST' }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }

    const data = (await res.json()) as { apiKey: string }
    return { ok: true, data: data.apiKey }
  } catch (error) {
    logServerError('regenerateApiKey falhou', error, { orgId, projectId })
    return { ok: false }
  }
}

export async function updateWebhook(
  orgId: string,
  projectId: string,
  webhookUrl: string | null
) {
  const parsed = webhookSchema.safeParse({ webhookUrl })
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/projects/${projectId}/webhook`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('updateWebhook falhou', error, { orgId, projectId })
    return { ok: false }
  }
}
