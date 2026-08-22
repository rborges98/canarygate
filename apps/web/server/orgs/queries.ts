import { cache } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { apiFetch } from '../api-fetch'
import { logServerError } from '@canarygate/logger'
import { getSessionOrRedirect } from '@/shared/auth'
import { createTtlCache } from '../cache/ttl-cache'
import { getCached } from '../cache/two-tier'

function isNextRedirectError(error: unknown): error is { digest: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

const orgsCache = createTtlCache<OrgItem[]>({ ttlMs: 60_000, maxEntries: 100 })

const orgSlugCache = createTtlCache<OrgDetail | null>({
  ttlMs: 60_000,
  maxEntries: 100
})

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

type ApiErrorPayload = {
  message?: string
}

export const getOrgs = cache(
  async function getOrgs(): Promise<OrgItem[]> {
    try {
      const session = await getSessionOrRedirect()
      const key = `orgs:${session.user.id}`

      const result = await getCached<OrgItem[]>({
        key,
        ttlMs: 60_000,
        memory: orgsCache,
        redisTtlSeconds: 60,
        fetcher: async () => {
          const res = await apiFetch(`${API_BASE}/orgs?pageSize=100`, {
            cache: 'no-store'
          })
          if (!res.ok) {
            return []
          }

          const data: { items: ApiOrg[] } = await res.json()
          return data.items.map((org) => ({
            orgId: org.id,
            orgSlug: org.slug,
            initial: org.name[0].toUpperCase(),
            name: org.name,
            role: org.role,
            projects: org.projectCount,
            members: org.memberCount
          }))
        }
      })

      return result.value
    } catch (err) {
      unstable_rethrow(err)

      if (isNextRedirectError(err)) {
        throw err
      }

      logServerError('getOrgs falhou', err)
      return []
    }
  }
)

export const getOrgBySlug = cache(
  async function getOrgBySlug(orgSlug: string): Promise<OrgDetail | null> {
    await getSessionOrRedirect()
    const key = `org-slug:${orgSlug}`

    const result = await getCached<OrgDetail | null>({
      key,
      ttlMs: 60_000,
      memory: orgSlugCache,
      redisTtlSeconds: 60,
      fetcher: async () => {
        const res = await apiFetch(`${API_BASE}/orgs/slug/${orgSlug}`, {
          cache: 'no-store'
        })

        if (!res.ok) {
          if (res.status === 404) {
            return null
          }

          const payload = (await res
            .json()
            .catch(() => null)) as ApiErrorPayload | null
          throw new Error(payload?.message ?? `Failed to load org ${orgSlug}`)
        }

        const data: ApiOrg = await res.json()
        return { id: data.id, name: data.name, slug: data.slug }
      }
    })

    return result.value
  }
)

export const getOrgBySlugOrName = cache(
  async function getOrgBySlugOrName(
    orgSlug: string
  ): Promise<OrgDetail | null> {
    const org = await getOrgBySlug(orgSlug)
    if (org) {
      return org
    }

    const orgs = await getOrgs()
    const fallback = orgs.find(
      (item) => item.orgSlug === orgSlug || item.name === orgSlug
    )
    if (!fallback) {
      return null
    }

    return {
      id: fallback.orgId,
      name: fallback.name,
      slug: fallback.orgSlug
    }
  }
)
