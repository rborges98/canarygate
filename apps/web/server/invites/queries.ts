const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

export type InviteDetail = {
  orgId: string
  orgName: string
  email: string
  orgRole: 'OWNER' | 'MEMBER'
  projectId: string | null
  projectName: string | null
  projectRole: 'ADMIN' | 'MEMBER' | null
  expiresAt: string
}

export async function getInvite(token: string): Promise<InviteDetail | null> {
  const res = await fetch(`${API_BASE}/invites/${token}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}
