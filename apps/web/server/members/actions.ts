'use server'

import { z } from 'zod'
import { Resend } from 'resend'
import { logServerError } from '@canarygate/logger'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const resend = new Resend(process.env.RESEND_API_KEY)

async function getErrorMessage(res: Response) {
  try {
    const body = (await res.json()) as { message?: string }
    return body.message
  } catch {
    return undefined
  }
}

const inviteSchema = z.object({
  email: z.string().email().max(255),
  orgRole: z.enum(['OWNER', 'MEMBER']),
  projectId: z.string().optional(),
  projectRole: z.enum(['ADMIN', 'MEMBER']).optional()
})

const projectAccessSchema = z.object({
  projectId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER'])
})

export async function makeOwner(orgId: string, userId: string) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/members/${userId}/make-owner`,
      { method: 'PUT' }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('makeOwner falhou', error, { orgId, userId })
    return { ok: false }
  }
}

export async function removeMember(orgId: string, userId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE'
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('removeMember falhou', error, { orgId, userId })
    return { ok: false }
  }
}

export async function addProjectAccess(
  orgId: string,
  userId: string,
  data: { projectId: string; role: 'ADMIN' | 'MEMBER' }
) {
  const parsed = projectAccessSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/members/${userId}/projects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('addProjectAccess falhou', error, { orgId, userId })
    return { ok: false }
  }
}

export async function updateProjectAccess(
  orgId: string,
  userId: string,
  projectId: string,
  role: 'ADMIN' | 'MEMBER'
) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/members/${userId}/projects/${projectId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('updateProjectAccess falhou', error, {
      orgId,
      userId,
      projectId
    })
    return { ok: false }
  }
}

export async function removeProjectAccess(
  orgId: string,
  userId: string,
  projectId: string
) {
  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/members/${userId}/projects/${projectId}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('removeProjectAccess falhou', error, {
      orgId,
      userId,
      projectId
    })
    return { ok: false }
  }
}

export async function sendInvite(
  orgId: string,
  data: {
    email: string
    orgRole: 'OWNER' | 'MEMBER'
    projectId?: string
    projectRole?: 'ADMIN' | 'MEMBER'
  }
) {
  const parsed = inviteSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false }
  }

  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })

    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }

    const invite = (await res.json()) as { token: string }
    const inviteUrl = `${APP_URL}/invite/${invite.token}`

    await resend.emails.send({
      from: 'CanaryGate <onboarding@resend.dev>',
      to: parsed.data.email,
      subject: "You've been invited to CanaryGate",
      text: `You've been invited to join an organization on CanaryGate.\n\nAccept your invite:\n${inviteUrl}\n\nThis invite expires in 7 days.`
    })

    return { ok: true }
  } catch (error) {
    logServerError('sendInvite falhou', error, {
      orgId,
      email: parsed.data.email
    })
    return { ok: false }
  }
}

export async function acceptInvite(token: string) {
  try {
    const res = await apiFetch(`${API_BASE}/invites/${token}/accept`, {
      method: 'POST'
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('acceptInvite falhou', error, { tokenPresent: true })
    return { ok: false }
  }
}

export async function declineInvite(token: string) {
  try {
    const res = await apiFetch(`${API_BASE}/invites/${token}/decline`, {
      method: 'POST'
    })
    if (!res.ok) {
      return { ok: false, message: await getErrorMessage(res) }
    }
    return { ok: true }
  } catch (error) {
    logServerError('declineInvite falhou', error, { tokenPresent: true })
    return { ok: false }
  }
}
