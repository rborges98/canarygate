'use server'

import { z } from 'zod'
import { Resend } from 'resend'
import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    return res.ok
  } catch (error) {
    console.error('[makeOwner] Failed:', error)
    return false
  }
}

export async function removeMember(orgId: string, userId: string) {
  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE'
    })
    return res.ok
  } catch (error) {
    console.error('[removeMember] Failed:', error)
    return false
  }
}

export async function addProjectAccess(
  orgId: string,
  userId: string,
  data: { projectId: string; role: 'ADMIN' | 'MEMBER' }
) {
  const parsed = projectAccessSchema.safeParse(data)
  if (!parsed.success) return false

  try {
    const res = await apiFetch(
      `${API_BASE}/orgs/${orgId}/members/${userId}/projects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      }
    )
    return res.ok
  } catch (error) {
    console.error('[addProjectAccess] Failed:', error)
    return false
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
    return res.ok
  } catch (error) {
    console.error('[updateProjectAccess] Failed:', error)
    return false
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
    return res.ok
  } catch (error) {
    console.error('[removeProjectAccess] Failed:', error)
    return false
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
  if (!parsed.success) return false

  try {
    const res = await apiFetch(`${API_BASE}/orgs/${orgId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    })

    if (!res.ok) return false

    const invite = (await res.json()) as { token: string }
    const inviteUrl = `${APP_URL}/invite/${invite.token}`

    await resend.emails.send({
      from: 'CanaryGate <onboarding@resend.dev>',
      to: parsed.data.email,
      subject: "You've been invited to CanaryGate",
      text: `You've been invited to join an organization on CanaryGate.\n\nAccept your invite:\n${inviteUrl}\n\nThis invite expires in 7 days.`
    })

    return true
  } catch (error) {
    console.error('[sendInvite] Failed:', error)
    return false
  }
}

export async function acceptInvite(token: string) {
  try {
    const res = await apiFetch(`${API_BASE}/invites/${token}/accept`, {
      method: 'POST'
    })
    return res.ok
  } catch (error) {
    console.error('[acceptInvite] Failed:', error)
    return false
  }
}

export async function declineInvite(token: string) {
  try {
    const res = await apiFetch(`${API_BASE}/invites/${token}/decline`, {
      method: 'POST'
    })
    return res.ok
  } catch (error) {
    console.error('[declineInvite] Failed:', error)
    return false
  }
}
