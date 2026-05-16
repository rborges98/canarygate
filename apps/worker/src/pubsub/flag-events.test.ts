import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { WorkerLogger } from '@canarygate/logger'

const { mockPublish, mockQuit, mockOn } = vi.hoisted(() => ({
  mockPublish: vi.fn().mockResolvedValue(1),
  mockQuit: vi.fn().mockResolvedValue('OK'),
  mockOn: vi.fn(),
}))

vi.mock('@canarygate/redis', () => ({
  createRedisConnection: vi.fn(() => ({
    publish: mockPublish,
    quit: mockQuit,
    on: mockOn,
  })),
}))

vi.mock('@canarygate/messaging-utils', () => ({
  buildFlagEventsChannel: vi.fn((projectId: string, envId: string) => `flag-events:${projectId}:${envId}`),
  serializeFlagEventEnvelope: vi.fn((envelope: unknown) => JSON.stringify(envelope)),
}))

import { publishFlagEvent, startFlagEventPublisher, stopFlagEventPublisher } from './flag-events.ts'

const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn().mockReturnThis(),
} as unknown as WorkerLogger

// ─── publishFlagEvent ─────────────────────────────────────────────────────────

describe('publishFlagEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('publishes to the correct channel with serialized payload', async () => {
    await publishFlagEvent(
      'proj-1',
      'env-1',
      'flag-updated',
      { key: 'my-flag', type: 'boolean', enabled: true, rolloutPercent: 0, updatedAt: new Date().toISOString() },
      mockLog
    )

    expect(mockPublish).toHaveBeenCalledWith(
      'flag-events:proj-1:env-1',
      expect.any(String)
    )
  })

  it('throws when redis publish fails', async () => {
    mockPublish.mockRejectedValueOnce(new Error('Redis unavailable'))

    await expect(
      publishFlagEvent(
        'proj-1',
        'env-1',
        'flag-updated',
        { key: 'my-flag', type: 'boolean', enabled: true, rolloutPercent: 0, updatedAt: new Date().toISOString() },
        mockLog
      )
    ).rejects.toThrow('Redis unavailable')
  })

  it('publishes flag-deleted event', async () => {
    await publishFlagEvent(
      'proj-1',
      'env-1',
      'flag-deleted',
      { key: 'my-flag', deletedAt: new Date().toISOString() },
      mockLog
    )

    expect(mockPublish).toHaveBeenCalledOnce()
  })
})

// ─── startFlagEventPublisher ──────────────────────────────────────────────────
// Note: listenersAttached is module-level state that persists across tests.
// These tests must run in order: first call registers listeners, second call is a no-op.

describe('startFlagEventPublisher', () => {
  it('attaches event listeners on first call', () => {
    startFlagEventPublisher(mockLog)

    expect(mockOn).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('end', expect.any(Function))
  })

  it('does not attach listeners twice if called again', () => {
    // listenersAttached is true from previous test — subsequent calls are no-ops
    startFlagEventPublisher(mockLog)
    const callCountAfterFirst = mockOn.mock.calls.length
    startFlagEventPublisher(mockLog)
    expect(mockOn.mock.calls.length).toBe(callCountAfterFirst)
  })
})

// ─── stopFlagEventPublisher ───────────────────────────────────────────────────

describe('stopFlagEventPublisher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls quit on the publisher', async () => {
    await stopFlagEventPublisher()
    expect(mockQuit).toHaveBeenCalledOnce()
  })
})
