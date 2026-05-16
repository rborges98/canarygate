import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processAutoRolloutJob } from './process-auto-rollout'
import { getWorkerFlagState, matchesDueAt, insertWorkerHistory } from './shared.ts'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import { db } from '@canarygate/database/client'
import type { AutoRolloutJobData } from '@canarygate/messaging-utils'

vi.mock('@canarygate/database/client', () => ({
  db: {
    update: vi.fn(),
  },
}))

vi.mock('@canarygate/database/schema', () => ({
  flagEnvironments: {},
}))

vi.mock('../pubsub/flag-events.ts', () => ({
  publishFlagEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./shared.ts', () => ({
  getWorkerFlagState: vi.fn(),
  insertWorkerHistory: vi.fn().mockResolvedValue(undefined),
  matchesDueAt: vi.fn(),
}))

vi.mock('@canarygate/messaging-utils', () => ({
  calcIntervalMs: vi.fn().mockReturnValue(3_600_000),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockJob(data: Partial<AutoRolloutJobData> = {}): any {
  return {
    data: {
      flagEnvironmentId: 'fe-id',
      flagId: 'flag-id',
      projectId: 'project-id',
      environmentId: 'env-id',
      environmentSlug: 'production',
      flagKey: 'my-flag',
      dueAt: '2025-01-01T12:00:00.000Z',
      ...data,
    },
  }
}

type FlagEnvironmentOverrides = Record<string, unknown>

function createMockState(flagEnvOverrides: FlagEnvironmentOverrides = {}) {
  return {
    flag: {
      id: 'flag-id',
      key: 'my-flag',
      name: 'My Flag',
      projectId: 'project-id',
      type: 'boolean',
    },
    flagEnvironment: {
      id: 'fe-id',
      flagId: 'flag-id',
      environmentId: 'env-id',
      enabled: true,
      rolloutPercent: 20,
      scheduleEnabled: false,
      scheduleDate: null,
      scheduleAction: null,
      scheduleRolloutPercent: null,
      autoRolloutEnabled: true,
      autoRolloutIncreaseBy: 10,
      autoRolloutEveryValue: 1,
      autoRolloutEveryUnit: 'hours',
      autoRolloutUntilMax: 100,
      autoRolloutNextAt: new Date('2025-01-01T12:00:00.000Z'),
      updatedAt: new Date(),
      ...flagEnvOverrides,
    },
    environment: { id: 'env-id', slug: 'production', name: 'Production' },
  }
}

const baseUpdatedRow = {
  id: 'fe-id',
  rolloutPercent: 30,
  autoRolloutEnabled: true,
  autoRolloutNextAt: new Date(),
  updatedAt: new Date(),
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('processAutoRolloutJob', () => {
  const mockLog = { warn: vi.fn(), info: vi.fn(), error: vi.fn() } as any

  let mockSet: ReturnType<typeof vi.fn>
  let mockReturning: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning = vi.fn().mockResolvedValue([baseUpdatedRow])
    const mockWhere = vi.fn(() => ({ returning: mockReturning }))
    mockSet = vi.fn(() => ({ where: mockWhere }))
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)
  })

  it('returns early and warns when flag state not found', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(null)

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(mockLog.warn).toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('returns early when autoRolloutEnabled is false', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(
      createMockState({ autoRolloutEnabled: false }) as any,
    )

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(db.update).not.toHaveBeenCalled()
    expect(publishFlagEvent).not.toHaveBeenCalled()
  })

  it('returns early when matchesDueAt returns false (stale job)', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(false)

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(db.update).not.toHaveBeenCalled()
    expect(publishFlagEvent).not.toHaveBeenCalled()
  })

  it('increments rolloutPercent by autoRolloutIncreaseBy', async () => {
    // rolloutPercent=20, increaseBy=10, max=100 → next=30
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(true)

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ rolloutPercent: 30 }),
    )
  })

  it('caps rolloutPercent at autoRolloutUntilMax and disables auto-rollout when max is reached', async () => {
    // rolloutPercent=95, increaseBy=10, max=100 → Math.min(105, 100)=100, reachedMax=true
    vi.mocked(getWorkerFlagState).mockResolvedValue(
      createMockState({ rolloutPercent: 95 }) as any,
    )
    vi.mocked(matchesDueAt).mockReturnValue(true)
    mockReturning.mockResolvedValue([{ ...baseUpdatedRow, rolloutPercent: 100, autoRolloutEnabled: false }])

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        rolloutPercent: 100,
        autoRolloutEnabled: false,
        autoRolloutNextAt: null,
      }),
    )
  })

  it('sets autoRolloutNextAt to a future date when max is not yet reached', async () => {
    // rolloutPercent=20, increaseBy=10, max=100 → next=30, not reached
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(true)

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        autoRolloutEnabled: true,
        autoRolloutNextAt: expect.any(Date),
      }),
    )
    const setArgs = mockSet.mock.calls[0][0]
    expect(setArgs.autoRolloutNextAt).not.toBeNull()
  })

  it('does not publish event when update returns no rows (already applied)', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(true)
    mockReturning.mockResolvedValue([])

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(db.update).toHaveBeenCalled()
    expect(insertWorkerHistory).not.toHaveBeenCalled()
    expect(publishFlagEvent).not.toHaveBeenCalled()
  })

  it('calls insertWorkerHistory with rollout_updated action after successful update', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(true)

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(insertWorkerHistory).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'rollout_updated' }),
      mockLog,
    )
  })

  it('calls publishFlagEvent after successful update', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(true)

    await processAutoRolloutJob(createMockJob(), mockLog)

    expect(publishFlagEvent).toHaveBeenCalledWith(
      'project-id',
      'env-id',
      'flag-updated',
      expect.objectContaining({ key: 'my-flag', rolloutPercent: 30 }),
      mockLog,
    )
  })
})
