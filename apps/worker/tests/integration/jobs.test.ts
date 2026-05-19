import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  ScheduleJobData,
  AutoRolloutJobData
} from '@canarygate/messaging-utils'
import { db } from '@canarygate/database/client'

const { mockRedisPublish } = vi.hoisted(() => ({
  mockRedisPublish: vi.fn().mockResolvedValue(1)
}))

vi.mock('@canarygate/redis', () => ({
  createRedisConnection: vi.fn(() => ({
    publish: mockRedisPublish,
    quit: vi.fn().mockResolvedValue('OK'),
    on: vi.fn()
  }))
}))

vi.mock('@canarygate/database/client', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn()
  }
}))

vi.mock('@canarygate/database/schema', () => ({
  flags: {},
  flagEnvironments: {},
  environments: {},
  history: {}
}))

vi.mock('@canarygate/messaging-utils', () => ({
  buildFlagEventsChannel: vi.fn(
    (p: string, e: string) => `flag-events:${p}:${e}`
  ),
  serializeFlagEventEnvelope: vi.fn((env: unknown) => JSON.stringify(env)),
  calcIntervalMs: vi.fn(() => 3_600_000)
}))

import { processScheduleJob } from '../../src/jobs/process-schedule.ts'
import { processAutoRolloutJob } from '../../src/jobs/process-auto-rollout.ts'

// ─── Constants ────────────────────────────────────────────────────────────────

const TEST_FLAG_ENV_ID = 'fe-test-id'
const TEST_FLAG_ID = 'flag-test-id'
const TEST_PROJECT_ID = 'proj-test-id'
const TEST_ENV_ID = 'env-test-id'
const TEST_DUE_AT = new Date('2025-01-01T12:00:00.000Z')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis()
} as any

function createScheduleJob(overrides: Partial<ScheduleJobData> = {}): any {
  return {
    data: {
      flagEnvironmentId: TEST_FLAG_ENV_ID,
      flagId: TEST_FLAG_ID,
      projectId: TEST_PROJECT_ID,
      environmentId: TEST_ENV_ID,
      environmentSlug: 'production',
      flagKey: 'my-flag',
      dueAt: TEST_DUE_AT.toISOString(),
      ...overrides
    }
  }
}

function createAutoRolloutJob(
  overrides: Partial<AutoRolloutJobData> = {}
): any {
  return {
    data: {
      flagEnvironmentId: TEST_FLAG_ENV_ID,
      flagId: TEST_FLAG_ID,
      projectId: TEST_PROJECT_ID,
      environmentId: TEST_ENV_ID,
      environmentSlug: 'production',
      flagKey: 'my-flag',
      dueAt: TEST_DUE_AT.toISOString(),
      ...overrides
    }
  }
}

function setupSelectChain(result: unknown[]) {
  const mockLimit = vi.fn().mockResolvedValue(result)
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere })
  const mockInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin2 })
  const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 })
  vi.mocked(db.select).mockReturnValue({ from: mockFrom } as any)
}

function setupUpdateChain(result: unknown[]) {
  const mockReturning = vi.fn().mockResolvedValue(result)
  const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning })
  const mockSet = vi.fn().mockReturnValue({ where: mockWhere })
  vi.mocked(db.update).mockReturnValue({ set: mockSet } as any)
}

function setupInsertChain() {
  const mockValues = vi.fn().mockResolvedValue(undefined)
  vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any)
}

function createScheduleFlagState(overrides: Record<string, unknown> = {}) {
  return {
    flag: {
      id: TEST_FLAG_ID,
      key: 'my-flag',
      name: 'My Flag',
      projectId: TEST_PROJECT_ID,
      type: 'boolean'
    },
    flagEnvironment: {
      id: TEST_FLAG_ENV_ID,
      flagId: TEST_FLAG_ID,
      environmentId: TEST_ENV_ID,
      enabled: false,
      rolloutPercent: 0,
      scheduleEnabled: true,
      scheduleDate: TEST_DUE_AT,
      scheduleAction: 'enable' as const,
      scheduleRolloutPercent: null,
      autoRolloutEnabled: false,
      autoRolloutIncreaseBy: 0,
      autoRolloutEveryValue: null,
      autoRolloutEveryUnit: null,
      autoRolloutUntilMax: 0,
      autoRolloutNextAt: null,
      updatedAt: new Date(),
      ...overrides
    },
    environment: { id: TEST_ENV_ID, slug: 'production', name: 'Production' }
  }
}

function createAutoRolloutFlagState(overrides: Record<string, unknown> = {}) {
  return {
    flag: {
      id: TEST_FLAG_ID,
      key: 'my-flag',
      name: 'My Flag',
      projectId: TEST_PROJECT_ID,
      type: 'boolean'
    },
    flagEnvironment: {
      id: TEST_FLAG_ENV_ID,
      flagId: TEST_FLAG_ID,
      environmentId: TEST_ENV_ID,
      enabled: true,
      rolloutPercent: 0,
      scheduleEnabled: false,
      scheduleDate: null,
      scheduleAction: null,
      scheduleRolloutPercent: null,
      autoRolloutEnabled: true,
      autoRolloutIncreaseBy: 10,
      autoRolloutEveryValue: 1,
      autoRolloutEveryUnit: 'hours',
      autoRolloutUntilMax: 100,
      autoRolloutNextAt: TEST_DUE_AT,
      updatedAt: new Date(),
      ...overrides
    },
    environment: { id: TEST_ENV_ID, slug: 'production', name: 'Production' }
  }
}

// ─── Schedule Job Integration Tests ──────────────────────────────────────────

describe('processScheduleJob integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enables a flag when processing a schedule job with enable action', async () => {
    setupSelectChain([createScheduleFlagState()])
    setupUpdateChain([
      {
        id: TEST_FLAG_ENV_ID,
        enabled: true,
        rolloutPercent: 0,
        updatedAt: new Date()
      }
    ])
    setupInsertChain()

    const job = createScheduleJob()
    await processScheduleJob(job, mockLog)

    expect(db.update).toHaveBeenCalled()
    expect(db.insert).toHaveBeenCalled()
    expect(mockRedisPublish).toHaveBeenCalledWith(
      expect.stringContaining(TEST_PROJECT_ID),
      expect.any(String)
    )
  })

  it('skips processing when flag state is not found (flag deleted)', async () => {
    setupSelectChain([])

    const job = createScheduleJob()
    await processScheduleJob(job, mockLog)

    expect(db.update).not.toHaveBeenCalled()
    expect(mockRedisPublish).not.toHaveBeenCalled()
    expect(mockLog.warn).toHaveBeenCalled()
  })

  it('propagates db error from getWorkerFlagState and can succeed on retry', async () => {
    // First call: db.select chain rejects
    const mockLimit = vi
      .fn()
      .mockRejectedValueOnce(new Error('DB connection failed'))
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockInnerJoin2 = vi.fn().mockReturnValue({ where: mockWhere })
    const mockInnerJoin1 = vi
      .fn()
      .mockReturnValue({ innerJoin: mockInnerJoin2 })
    const mockFrom = vi.fn().mockReturnValue({ innerJoin: mockInnerJoin1 })
    vi.mocked(db.select).mockReturnValueOnce({ from: mockFrom } as any)

    const job = createScheduleJob()
    await expect(processScheduleJob(job, mockLog)).rejects.toThrow(
      'DB connection failed'
    )

    // Second call: succeeds
    setupSelectChain([createScheduleFlagState()])
    setupUpdateChain([
      {
        id: TEST_FLAG_ENV_ID,
        enabled: true,
        rolloutPercent: 0,
        updatedAt: new Date()
      }
    ])
    setupInsertChain()

    await expect(processScheduleJob(job, mockLog)).resolves.not.toThrow()
    expect(db.update).toHaveBeenCalled()
  })

  it('skips history and event when update returns no rows (job already applied)', async () => {
    setupSelectChain([createScheduleFlagState()])
    // Update returns empty array — row was already modified by another worker
    setupUpdateChain([])

    const job = createScheduleJob()
    await processScheduleJob(job, mockLog)

    expect(db.update).toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
    expect(mockRedisPublish).not.toHaveBeenCalled()
  })
})

// ─── Auto-Rollout Job Integration Tests ──────────────────────────────────────

describe('processAutoRolloutJob integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('increments rollout percent when processing an auto-rollout job', async () => {
    setupSelectChain([createAutoRolloutFlagState()])
    setupUpdateChain([
      {
        id: TEST_FLAG_ENV_ID,
        rolloutPercent: 10,
        autoRolloutEnabled: true,
        autoRolloutNextAt: new Date(),
        updatedAt: new Date()
      }
    ])
    setupInsertChain()

    const job = createAutoRolloutJob()
    await processAutoRolloutJob(job, mockLog)

    expect(db.update).toHaveBeenCalled()
    expect(db.insert).toHaveBeenCalled()
    expect(mockRedisPublish).toHaveBeenCalledWith(
      expect.stringContaining(TEST_PROJECT_ID),
      expect.any(String)
    )
  })

  it('skips processing when flag state is not found (flag deleted)', async () => {
    setupSelectChain([])

    const job = createAutoRolloutJob()
    await processAutoRolloutJob(job, mockLog)

    expect(db.update).not.toHaveBeenCalled()
    expect(mockRedisPublish).not.toHaveBeenCalled()
    expect(mockLog.warn).toHaveBeenCalled()
  })
})
