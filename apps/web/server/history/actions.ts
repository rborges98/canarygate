'use server'

import { logServerError } from '@/lib/server-log'
import { getHistory } from './queries'
import type { HistoryItem } from './queries'

export async function loadMoreHistory(
  orgId: string,
  projectId: string,
  offset: number,
  action?: string,
  environmentSlug?: string
): Promise<{ items: HistoryItem[]; total: number }> {
  try {
    return await getHistory(orgId, projectId, {
      limit: 20,
      offset,
      action,
      environmentSlug
    })
  } catch (error) {
    logServerError('loadMoreHistory falhou', error, {
      orgId,
      projectId,
      offset,
      action,
      environmentSlug
    })
    return { items: [], total: 0 }
  }
}
