import { cache } from 'react'
import { apiFetch } from '../api-fetch'
import { getSessionOrRedirect } from '@/shared/auth'
import { createTtlCache } from '../cache/ttl-cache'
import { getCached } from '../cache/two-tier'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

const projectsCache = createTtlCache<ProjectItem[]>({
  ttlMs: 60_000,
  maxEntries: 200
})

const projectSlugCache = createTtlCache<ProjectDetail | null>({
  ttlMs: 60_000,
  maxEntries: 200
})

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

export const getProjects = cache(
  async function getProjects(orgId: string): Promise<ProjectItem[]> {
    const session = await getSessionOrRedirect()
    const key = `projects:${session.user.id}:${orgId}`

    const result = await getCached<ProjectItem[]>({
      key,
      ttlMs: 60_000,
      memory: projectsCache,
      redisTtlSeconds: 60,
      fetcher: async () => {
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
    })

    return result.value
  }
)

export const getProjectBySlug = cache(
  async function getProjectBySlug(
    orgId: string,
    projectSlug: string
  ): Promise<ProjectDetail | null> {
    const session = await getSessionOrRedirect()
    const key = `project-slug:${session.user.id}:${orgId}:${projectSlug}`

    const result = await getCached<ProjectDetail | null>({
      key,
      ttlMs: 60_000,
      memory: projectSlugCache,
      redisTtlSeconds: 60,
      fetcher: async () => {
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
    })

    return result.value
  }
)

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
