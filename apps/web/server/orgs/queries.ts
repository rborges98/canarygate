import { apiFetch } from '../api-fetch'
import { logServerError } from '@/lib/server-log'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

type ApiOrg = {
  id: string
  name: string
  slug: string
  role: 'OWNER' | 'MEMBER'
  projectCount: number
  memberCount: number
}

export type OrgItem = {
  orgId: string
  orgSlug: string
  initial: string
  name: string
  role: 'OWNER' | 'MEMBER'
  projects: number
  members: number
}

export type OrgDetail = {
  id: string
  name: string
  slug: string
}

export async function getOrgs(): Promise<OrgItem[]> {
  try {
    const res = await apiFetch(`${API_BASE}/orgs`)
    if (!res.ok) {
      return []
    }

    const data: ApiOrg[] = await res.json()
    return data.map((org) => ({
      orgId: org.id,
      orgSlug: org.slug,
      initial: org.name[0].toUpperCase(),
      name: org.name,
      role: org.role,
      projects: org.projectCount,
      members: org.memberCount
    }))
  } catch (err) {
    logServerError('getOrgs falhou', err)
    return []
  }
}

export async function getOrgBySlug(orgSlug: string): Promise<OrgDetail | null> {
  const res = await apiFetch(`${API_BASE}/orgs/slug/${orgSlug}`)
  if (!res.ok) {
    return null
  }

  const data: ApiOrg = await res.json()
  return { id: data.id, name: data.name, slug: data.slug }
}
