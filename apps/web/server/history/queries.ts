import { apiFetch } from '../api-fetch'

const API_BASE = process.env.API_URL ?? 'http://localhost:3001'

type ApiHistoryEntry = {
  id: string
  flagId: string | null
  flagKey: string
  flagName: string
  action: 'created' | 'updated' | 'toggled' | 'rollout_updated' | 'deleted'
  actorEmail: string
  changes: Record<string, unknown> | null
  createdAt: string
}

export type HistoryItem = {
  id: string
  flagKey: string
  flagName: string
  action: ApiHistoryEntry['action']
  actorEmail: string
  actorInitial: string
  changes: Record<string, unknown> | null
  createdAt: string
}

export async function getHistory(
  orgId: string,
  projectId: string
): Promise<HistoryItem[]> {
  const res = await apiFetch(
    `${API_BASE}/orgs/${orgId}/projects/${projectId}/history`
  )
  if (!res.ok) return []
  const data: { total: number; data: ApiHistoryEntry[] } = await res.json()
  return data.data.map((e) => ({
    id: e.id,
    flagKey: e.flagKey,
    flagName: e.flagName,
    action: e.action,
    actorEmail: e.actorEmail,
    actorInitial: e.actorEmail[0].toUpperCase(),
    changes: e.changes,
    createdAt: e.createdAt
  }))
}
