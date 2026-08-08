'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
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

const orgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
})

type OrgResult =
  | { ok: true; data: { id: string; name: string; slug: string } }
  | { ok: false; message?: string }

export async function createOrg(data: {
  name: string
  slug: string
}): Promise<OrgResult> {
  const parsed = orgSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(`${API_BASE}/orgs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }

    const data = (await res.json()) as { id: string; name: string; slug: string }
    revalidatePath('/orgs')
    return { ok: true, data }
  } catch (error) {
    logServerError('createOrg falhou', error)
    return { ok: false }
  }
}

export async function updateOrg(
  orgId: string,
  data: { name: string; slug: string }
): Promise<OrgResult> {
  const parsed = orgSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }

    const data = (await res.json()) as { id: string; name: string; slug: string }
    revalidatePath('/orgs')
    return { ok: true, data }
  } catch (error) {
    logServerError('updateOrg falhou', error, { orgId })
    return { ok: false }
  }
}

export async function deleteOrg(orgId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    revalidatePath('/orgs')
    return { ok: true }
  } catch (error) {
    logServerError('deleteOrg falhou', error, { orgId })
    return { ok: false }
  }
}
