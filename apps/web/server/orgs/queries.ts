import { apiFetch } from '../api-fetch'
import { logServerError } from '@canarygate/logger'
import { getSessionOrRedirect } from '@/shared/auth'

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

export async function getOrgs(): Promise<OrgItem[]> {
  try {
    await getSessionOrRedirect()

    const res = await apiFetch(`${API_BASE}/orgs`, { cache: 'no-store' })
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
    if (isNextRedirectError(err)) {
      throw err
    }

    logServerError('getOrgs falhou', err)
    return []
  }
}

export async function getOrgBySlug(orgSlug: string): Promise<OrgDetail | null> {
  await getSessionOrRedirect()

  const res = await apiFetch(`${API_BASE}/orgs/slug/${orgSlug}`, {
    cache: 'no-store'
  })
  if (!res.ok) {
    if (res.status === 404) {
      return null
    }

    const payload = (await res.json().catch(() => null)) as ApiErrorPayload | null
    throw new Error(payload?.message ?? `Failed to load org ${orgSlug}`)
  }

  const data: ApiOrg = await res.json()
  return { id: data.id, name: data.name, slug: data.slug }
}

export async function getOrgBySlugOrName(
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
