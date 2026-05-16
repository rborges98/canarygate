import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processScheduleJob } from './process-schedule'
import { getWorkerFlagState, matchesDueAt, insertWorkerHistory } from './shared.ts'
import { publishFlagEvent } from '../pubsub/flag-events.ts'
import { db } from '@canarygate/database/client'
import type { ScheduleJobData } from '@canarygate/messaging-utils'

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockJob(data: Partial<ScheduleJobData> = {}): any {
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
      enabled: false,
      rolloutPercent: 0,
      scheduleEnabled: true,
      scheduleDate: new Date('2025-01-01T12:00:00.000Z'),
      scheduleAction: 'enable',
      scheduleRolloutPercent: null,
      autoRolloutEnabled: false,
      autoRolloutIncreaseBy: 0,
      autoRolloutEveryValue: 1,
      autoRolloutEveryUnit: 'hours',
      autoRolloutUntilMax: 100,
      autoRolloutNextAt: null,
      updatedAt: new Date(),
      ...flagEnvOverrides,
    },
    environment: { id: 'env-id', slug: 'production', name: 'Production' },
  }
}

const updatedRow = { id: 'fe-id', enabled: true, rolloutPercent: 0, updatedAt: new Date() }

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('processScheduleJob', () => {
  const mockLog = { warn: vi.fn(), info: vi.fn(), error: vi.fn() } as any

  let mockSet: ReturnType<typeof vi.fn>
  let mockReturning: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockReturning = vi.fn().mockResolvedValue([updatedRow])
    const mockWhere = vi.fn(() => ({ returning: mockReturning }))
    mockSet = vi.fn(() => ({ where: mockWhere }))
    vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)
  })

  it('returns early and warns when flag state not found', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(null)

    await processScheduleJob(createMockJob(), mockLog)

    expect(mockLog.warn).toHaveBeenCalled()
    expect(db.update).not.toHaveBeenCalled()
  })

  it('returns early when scheduleEnabled is false', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(
      createMockState({ scheduleEnabled: false }) as any,
    )

    await processScheduleJob(createMockJob(), mockLog)

    expect(db.update).not.toHaveBeenCalled()
    expect(publishFlagEvent).not.toHaveBeenCalled()
  })

  it('returns early when matchesDueAt returns false (stale job)', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(false)

    await processScheduleJob(createMockJob(), mockLog)

    expect(db.update).not.toHaveBeenCalled()
    expect(publishFlagEvent).not.toHaveBeenCalled()
  })

  it('sets enabled=true for action "enable"', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(
      createMockState({ scheduleAction: 'enable', enabled: false }) as any,
    )
    vi.mocked(matchesDueAt).mockReturnValue(true)

    await processScheduleJob(createMockJob(), mockLog)

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, scheduleEnabled: false }),
    )
    expect(insertWorkerHistory).toHaveBeenCalled()
    expect(publishFlagEvent).toHaveBeenCalled()
  })

  it('sets enabled=false for action "disable"', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(
      createMockState({ scheduleAction: 'disable', enabled: true }) as any,
    )
    vi.mocked(matchesDueAt).mockReturnValue(true)
    mockReturning.mockResolvedValue([{ ...updatedRow, enabled: false }])

    await processScheduleJob(createMockJob(), mockLog)

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, scheduleEnabled: false }),
    )
    expect(publishFlagEvent).toHaveBeenCalled()
  })

  it('sets rolloutPercent for action "rollout"', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(
      createMockState({
        scheduleAction: 'rollout',
        rolloutPercent: 0,
        scheduleRolloutPercent: 50,
      }) as any,
    )
    vi.mocked(matchesDueAt).mockReturnValue(true)
    mockReturning.mockResolvedValue([{ ...updatedRow, rolloutPercent: 50 }])

    await processScheduleJob(createMockJob(), mockLog)

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ rolloutPercent: 50, scheduleEnabled: false }),
    )
    expect(publishFlagEvent).toHaveBeenCalled()
  })

  it('does not publish event when update returns no rows (already applied)', async () => {
    vi.mocked(getWorkerFlagState).mockResolvedValue(createMockState() as any)
    vi.mocked(matchesDueAt).mockReturnValue(true)
    mockReturning.mockResolvedValue([])

    await processScheduleJob(createMockJob(), mockLog)

    expect(db.update).toHaveBeenCalled()
    expect(insertWorkerHistory).not.toHaveBeenCalled()
    expect(publishFlagEvent).not.toHaveBeenCalled()
  })
})
