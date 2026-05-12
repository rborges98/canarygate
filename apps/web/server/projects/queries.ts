import { apiFetch } from '../api-fetch'
import { getSessionOrRedirect } from '@/shared/auth'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

type ApiProject = {
  id: string
  name: string
  slug: string
  flagCount: number
  active: boolean
  projectRole?: 'ADMIN' | 'MEMBER'
}

export type ProjectItem = {
  projectId: string
  name: string
  slug: string
  flags: number
  active: boolean
}

export type ProjectDetail = {
  id: string
  name: string
  slug: string
  active: boolean
  projectRole: 'ADMIN' | 'MEMBER'
}

export async function getProjects(orgId: string): Promise<ProjectItem[]> {
  await getSessionOrRedirect()

  const res = await apiFetch(`${API_BASE}/orgs/${orgId}/projects`)
  if (!res.ok) {
    return []
  }

  const data: ApiProject[] = await res.json()
  return data.map((p) => ({
    projectId: p.id,
    name: p.name,
    slug: p.slug,
    flags: p.flagCount,
    active: p.active
  }))
}

export async function getProjectBySlug(
  orgId: string,
  projectSlug: string
): Promise<ProjectDetail | null> {
  await getSessionOrRedirect()

  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/slug/${projectSlug}`
  )
  if (!res.ok) {
    return null
  }

  const data: ApiProject = await res.json()
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    active: data.active,
    projectRole: data.projectRole ?? 'MEMBER'
  }
}

export async function getApiKey(
  orgId: string,
  projectId: string
): Promise<string | null> {
  await getSessionOrRedirect()

  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/${projectId}/api-key`
  )
  if (!res.ok) {
    return null
  }

  const data: { apiKey: string } = await res.json()
  return data.apiKey
}

export async function getWebhook(
  orgId: string,
  projectId: string
): Promise<string | null> {
  await getSessionOrRedirect()

  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/${projectId}/webhook`
  )
  if (!res.ok) {
    return null
  }

  const data: { webhookUrl: string | null } = await res.json()
  return data.webhookUrl
}
