import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

type ApiMemberProject = {
  projectId: string
  name: string
  role: 'ADMIN' | 'MEMBER'
}

type ApiMember = {
  id: string
  userId: string
  name: string
  email: string
  role: 'OWNER' | 'MEMBER'
  projects: ApiMemberProject[]
}

export type MemberItem = {
  id: string
  userId: string
  initial: string
  email: string
  isOwner: boolean
  projects: ApiMemberProject[]
}

export async function getMembers(orgId: string): Promise<MemberItem[]> {
  const res = await apiFetch(`${API_BASE}/orgs/${orgId}/members`)
  if (!res.ok) {
    return []
  }

  const data: ApiMember[] = await res.json()
  return data.map((m) => ({
    id: m.userId,
    userId: m.userId,
    initial: (m.email[0] ?? '?').toUpperCase(),
    email: m.email,
    isOwner: m.role === 'OWNER',
    projects: m.projects
  }))
}
