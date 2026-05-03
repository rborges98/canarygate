import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

type ApiHistoryEntry = {
  id: string
  flagId: string | null
  flagKey: string
  flagName: string
  environmentSlug: string | null
  action: 'created' | 'updated' | 'toggled' | 'rollout_updated' | 'deleted'
  actorEmail: string
  changes: Record<string, unknown> | null
  createdAt: string
}

export type HistoryItem = {
  id: string
  flagKey: string
  flagName: string
  environmentSlug: string | null
  action: ApiHistoryEntry['action']
  actorEmail: string
  actorInitial: string
  changes: Record<string, unknown> | null
  createdAt: string
}

function mapEntry(e: ApiHistoryEntry): HistoryItem {
  return {
    id: e.id,
    flagKey: e.flagKey,
    flagName: e.flagName,
    environmentSlug: e.environmentSlug ?? null,
    action: e.action,
    actorEmail: e.actorEmail,
    actorInitial: e.actorEmail[0].toUpperCase(),
    changes: e.changes,
    createdAt: e.createdAt
  }
}

export async function getHistory(
  orgId: string,
  projectId: string,
  options?: {
    limit?: number
    offset?: number
    action?: string
    environmentSlug?: string
  }
): Promise<{ items: HistoryItem[]; total: number }> {
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  const action = options?.action
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  })

  if (action) {
    params.set('action', action)
  }

  if (options?.environmentSlug) {
    params.set('environmentSlug', options.environmentSlug)
  }

  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/${projectId}/history?${params.toString()}`
  )
  if (!res.ok) {
    return { items: [], total: 0 }
  }

  const data: { total: number; data: ApiHistoryEntry[] } = await res.json()
  return { items: data.data.map(mapEntry), total: data.total }
}
