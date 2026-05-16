import { describe, it, expect, vi, beforeEach } from 'vitest'
import { matchesDueAt, getWorkerFlagState, insertWorkerHistory } from './shared'
import { db } from '@canarygate/database/client'

vi.mock('@canarygate/database/client', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('@canarygate/database/schema', () => ({
  flagEnvironments: {},
  flags: {},
  environments: {},
  history: {},
}))

// ─── matchesDueAt ────────────────────────────────────────────────────────────

describe('matchesDueAt', () => {
  it('returns true when Date.toISOString() equals dueAt string', () => {
    const date = new Date('2025-01-01T12:00:00.000Z')
    expect(matchesDueAt(date, '2025-01-01T12:00:00.000Z')).toBe(true)
  })

  it('returns false when Date.toISOString() differs from dueAt string', () => {
    const date = new Date('2025-01-01T12:00:00.000Z')
    expect(matchesDueAt(date, '2025-01-01T13:00:00.000Z')).toBe(false)
  })

  it('returns false when value is null', () => {
    expect(matchesDueAt(null, '2025-01-01T12:00:00.000Z')).toBe(false)
  })
})

// ─── getWorkerFlagState ──────────────────────────────────────────────────────

describe('getWorkerFlagState', () => {
  const mockLog = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any

  const identifiers = {
    flagEnvironmentId: 'fe-id',
    flagId: 'flag-id',
    projectId: 'project-id',
    environmentId: 'env-id',
    environmentSlug: 'production',
  }

  function setupSelectChain(result: unknown[]) {
    const mockLimit = vi.fn().mockResolvedValue(result)
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }))
    const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }))
    const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }))
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)
    return { mockLimit, mockWhere, mockInnerJoin1, mockInnerJoin2, mockFrom }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no rows found', async () => {
    setupSelectChain([])
    const result = await getWorkerFlagState(identifiers, mockLog)
    expect(result).toBeNull()
  })

  it('returns WorkerFlagState when row exists', async () => {
    const row = {
      flag: { id: 'flag-id', key: 'my-flag', name: 'My Flag', projectId: 'project-id', type: 'boolean' },
      flagEnvironment: { id: 'fe-id', flagId: 'flag-id', environmentId: 'env-id' },
      environment: { id: 'env-id', slug: 'production', name: 'Production' },
    }
    setupSelectChain([row])
    const result = await getWorkerFlagState(identifiers, mockLog)
    expect(result).toEqual(row)
  })

  it('throws and logs error when DB fails', async () => {
    const error = new Error('DB connection failed')
    const mockLimit = vi.fn().mockRejectedValue(error)
    const mockWhere = vi.fn(() => ({ limit: mockLimit }))
    const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }))
    const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }))
    const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }))
    vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)

    await expect(getWorkerFlagState(identifiers, mockLog)).rejects.toThrow('DB connection failed')
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, scope: 'worker.jobs.getWorkerFlagState' }),
      'Failed to load flag state for a worker job',
    )
  })
})

// ─── insertWorkerHistory ─────────────────────────────────────────────────────

describe('insertWorkerHistory', () => {
  const mockLog = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as any

  const historyData = {
    projectId: 'project-id',
    environmentId: 'env-id',
    environmentSlug: 'production',
    flagId: 'flag-id',
    flagKey: 'my-flag',
    flagName: 'My Flag',
    action: 'updated' as const,
    changes: { before: { enabled: false }, after: { enabled: true } },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls db.insert with correct data including actorEmail "system-worker"', async () => {
    const mockValues = vi.fn().mockResolvedValue(undefined)
    vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)

    await insertWorkerHistory(historyData, mockLog)

    expect(db.insert).toHaveBeenCalled()
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'project-id',
        environmentId: 'env-id',
        environmentSlug: 'production',
        flagId: 'flag-id',
        flagKey: 'my-flag',
        flagName: 'My Flag',
        action: 'updated',
        actorEmail: 'system-worker',
        changes: historyData.changes,
      }),
    )
  })

  it('logs error and throws when DB fails', async () => {
    const error = new Error('Insert failed')
    vi.mocked(db.insert).mockReturnValue({ values: vi.fn().mockRejectedValue(error) } as any)

    await expect(insertWorkerHistory(historyData, mockLog)).rejects.toThrow('Insert failed')
    expect(mockLog.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, scope: 'worker.jobs.insertWorkerHistory' }),
      'Failed to record worker history',
    )
  })
})
