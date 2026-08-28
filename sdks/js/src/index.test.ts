import { CanaryGate } from './client'
import { CanaryGate as ServerCanaryGate } from './server'
import { hashString } from './hash'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSseStream(events: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(events))
      controller.close()
    }
  })
}

function mockFetch(flagsResponse?: object, streamBody?: ReadableStream<Uint8Array>) {
  const fetchMock = vi.fn()

  fetchMock.mockImplementationOnce(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          flagsResponse ?? { projectId: 'p1', environment: 'prod', flags: [] }
        )
    })
  )

  if (streamBody !== undefined) {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        body: streamBody
      })
    )
  }

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function simulateServerEnvironment() {
  vi.stubGlobal('window', undefined)
  vi.stubGlobal('document', undefined)
}

async function flushMicrotasks(cycles = 20) {
  for (let i = 0; i < cycles; i++) {
    await Promise.resolve()
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('hashString', () => {
  it('hash of "feature-rollout-a:user-42" matches the contract', () => {
    expect(hashString('feature-rollout-a:user-42')).toBe(59)
  })

  it('hash of "new-checkout:vitor-1" matches the contract', () => {
    expect(hashString('new-checkout:vitor-1')).toBe(20)
  })

  it('hash of "dark-mode:anon-999" matches the contract', () => {
    expect(hashString('dark-mode:anon-999')).toBe(71)
  })

  it('hash of "flag-x:" matches the contract', () => {
    expect(hashString('flag-x:')).toBe(94)
  })
})

describe('CanaryGate (client)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  describe('Boolean flags', () => {
    it('returns an enabled boolean flag after init', async () => {
      mockFetch({
        projectId: 'p1',
        environment: 'prod',
        flags: [
          {
            key: 'my-flag',
            type: 'boolean',
            enabled: true,
            rolloutPercent: 0,
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.getFlag('my-flag')).toEqual({
        key: 'my-flag',
        type: 'boolean',
        enabled: true
      })
    })

    it('returns a disabled boolean flag after init', async () => {
      mockFetch({
        projectId: 'p1',
        environment: 'prod',
        flags: [
          {
            key: 'my-flag',
            type: 'boolean',
            enabled: false,
            rolloutPercent: 0,
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.getFlag('my-flag')).toEqual({
        key: 'my-flag',
        type: 'boolean',
        enabled: false
      })
    })
  })

  // -------------------------------------------------------------------------
  describe('Rollout flags', () => {
    it('includes the user in a 100% rollout when the flag is enabled', async () => {
      localStorage.setItem('__cg_anon_id__', 'known-id')
      mockFetch({
        projectId: 'p1',
        environment: 'prod',
        flags: [
          {
            key: 'rollout-flag',
            type: 'rollout',
            enabled: true,
            rolloutPercent: 100,
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      const flag = gate.getFlag('rollout-flag')
      expect(flag?.type).toBe('rollout')
      expect(flag?.enabled).toBe(true)
    })

    it('excludes the user from a 0% rollout even when the flag is enabled', async () => {
      localStorage.setItem('__cg_anon_id__', 'known-id')
      mockFetch({
        projectId: 'p1',
        environment: 'prod',
        flags: [
          {
            key: 'rollout-flag',
            type: 'rollout',
            enabled: true,
            rolloutPercent: 0,
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      const flag = gate.getFlag('rollout-flag')
      expect(flag?.type).toBe('rollout')
      expect(flag?.enabled).toBe(false)
    })

    it('returns disabled rollout when flag.enabled is false regardless of percent', async () => {
      localStorage.setItem('__cg_anon_id__', 'known-id')
      mockFetch({
        projectId: 'p1',
        environment: 'prod',
        flags: [
          {
            key: 'rollout-flag',
            type: 'rollout',
            enabled: false,
            rolloutPercent: 100,
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      const flag = gate.getFlag('rollout-flag')
      expect(flag?.type).toBe('rollout')
      expect(flag?.enabled).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  describe('localStorage / anonId', () => {
    it('generates and persists an anonId when none exists', () => {
      new CanaryGate('test-key', { baseUrl: 'http://localhost:3001' })

      const stored = localStorage.getItem('__cg_anon_id__')
      expect(stored).not.toBeNull()
      expect(stored).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      )
    })

    it('reuses an existing anonId across multiple instances', () => {
      localStorage.setItem('__cg_anon_id__', 'existing-id')

      new CanaryGate('test-key', { baseUrl: 'http://localhost:3001' })
      new CanaryGate('test-key', { baseUrl: 'http://localhost:3001' })

      expect(localStorage.getItem('__cg_anon_id__')).toBe('existing-id')
    })
  })

  // -------------------------------------------------------------------------
  describe('fetch behavior', () => {
    it('sends X-Api-Key and X-Environment headers', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ projectId: 'p1', environment: 'staging', flags: [] })
      })
      vi.stubGlobal('fetch', fetchMock)

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        environment: 'staging'
      })
      await gate.init()

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/sdk/flags',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Api-Key': 'test-key',
            'X-Environment': 'staging'
          })
        })
      )
    })

    it('marks the SDK as stale when fetch returns a non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized'
        })
      )

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.isStale()).toBe(true)
    })

    it('marks the SDK as stale when fetch throws a network error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValueOnce(new Error('Network error'))
      )

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.isStale()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  describe('getFlag / getFlags', () => {
    it('returns undefined for a flag that does not exist', async () => {
      mockFetch({ projectId: 'p1', environment: 'prod', flags: [] })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.getFlag('nao-existe')).toBeUndefined()
    })

    it('returns all flags via getFlags()', async () => {
      mockFetch({
        projectId: 'p1',
        environment: 'prod',
        flags: [
          {
            key: 'flag-a',
            type: 'boolean',
            enabled: true,
            rolloutPercent: 0,
            updatedAt: '2025-01-01T00:00:00.000Z'
          },
          {
            key: 'flag-b',
            type: 'boolean',
            enabled: false,
            rolloutPercent: 0,
            updatedAt: '2025-01-01T00:00:00.000Z'
          }
        ]
      })

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.getFlags()).toHaveLength(2)
    })
  })

  // -------------------------------------------------------------------------
  describe('getLastSyncAt', () => {
    it('returns null before init is called', () => {
      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })

      expect(gate.getLastSyncAt()).toBeNull()
    })

    it('returns a valid ISO string after a successful init', async () => {
      mockFetch()

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      const syncAt = gate.getLastSyncAt()
      expect(syncAt).not.toBeNull()
      expect(() => new Date(syncAt!).toISOString()).not.toThrow()
    })

    it('returns null after a failed fetch', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValueOnce(new Error('Network error'))
      )

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(gate.getLastSyncAt()).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  describe('Entry point guards', () => {
    it('throws when the client entry is used outside a browser', () => {
      simulateServerEnvironment()

      expect(
        () =>
          new CanaryGate('test-key', {
            baseUrl: 'http://localhost:3001'
          })
      ).toThrow('@canarygate/sdk/client is browser-only')
    })
  })

  // -------------------------------------------------------------------------
  describe('Polling', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('refreshes flags via polling when pollIntervalMs is set', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ projectId: 'p1', environment: 'prod', flags: [] })
      })
      vi.stubGlobal('fetch', fetchMock)

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        pollIntervalMs: 3000
      })
      await gate.init()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(7500)
      expect(fetchMock).toHaveBeenCalledTimes(3)
      gate.disconnect()
    })

    it('does not poll when pollIntervalMs is 0', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ projectId: 'p1', environment: 'prod', flags: [] })
      })
      vi.stubGlobal('fetch', fetchMock)

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        pollIntervalMs: 0
      })
      await gate.init()

      await vi.advanceTimersByTimeAsync(3000)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      gate.disconnect()
    })

    it('clamps pollIntervalMs values below the minimum floor', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ projectId: 'p1', environment: 'prod', flags: [] })
      })
      vi.stubGlobal('fetch', fetchMock)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        const gate = new CanaryGate('test-key', {
          baseUrl: 'http://localhost:3001',
          pollIntervalMs: 1
        })
        await gate.init()
        await vi.advanceTimersByTimeAsync(3500)

        expect(warnSpy).toHaveBeenCalledWith(
          '[canarygate] pollIntervalMs must be at least 3000ms; clamped to 3000.'
        )
        expect(fetchMock).toHaveBeenCalledTimes(2)
        gate.disconnect()
      } finally {
        warnSpy.mockRestore()
      }
    })

    it('disconnect() stops polling', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ projectId: 'p1', environment: 'prod', flags: [] })
      })
      vi.stubGlobal('fetch', fetchMock)

      const gate = new CanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        pollIntervalMs: 3000
      })
      await gate.init()
      gate.disconnect()

      await vi.advanceTimersByTimeAsync(9000)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})

describe('CanaryGate (server)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  describe('Stream (SSE)', () => {
    beforeEach(() => {
      simulateServerEnvironment()
    })

    it('applies a flag-updated event to the flag cache', async () => {
      const sseData =
        'event: flag-updated\ndata: {"key":"feature-x","type":"boolean","enabled":true,"rolloutPercent":0,"updatedAt":"2025-01-01T00:00:00.000Z"}\n\n'
      const stream = createSseStream(sseData)
      mockFetch(undefined, stream)

      const gate = new ServerCanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        reconnectDelay: 300_000,
        maxReconnectDelay: 300_000,
        heartbeatTimeoutMs: 300_000
      })

      await gate.init()
      await flushMicrotasks(30)

      try {
        const flag = gate.getFlag('feature-x')
        expect(flag).toBeDefined()
        expect(flag?.type).toBe('boolean')
        expect(flag?.enabled).toBe(true)
      } finally {
        gate.disconnect()
      }
    })

    it('disconnect() does not throw and does not alter stale state', async () => {
      const stream = createSseStream('event: connected\ndata: {}\n\n')
      mockFetch(undefined, stream)

      const gate = new ServerCanaryGate('test-key', {
        baseUrl: 'http://localhost:3001'
      })
      await gate.init()

      expect(() => gate.disconnect()).not.toThrow()
      expect(gate.isStale()).toBe(false)
    })

    it('processes a retry field in an SSE block without throwing', async () => {
      const stream = createSseStream('retry: 10000\n\n')
      mockFetch(undefined, stream)

      const gate = new ServerCanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        reconnectDelay: 300_000,
        maxReconnectDelay: 300_000
      })

      await gate.init()
      await flushMicrotasks(20)

      expect(gate.getFlags()).toHaveLength(0)
      gate.disconnect()
    })
  })

  // -------------------------------------------------------------------------
  describe('Server stream behavior', () => {
    beforeEach(() => {
      simulateServerEnvironment()
    })

    it('always opens the SSE stream after the snapshot, without any option', async () => {
      const fetchMock = vi.fn()
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ projectId: 'p1', environment: 'prod', flags: [] })
        })
      )
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          body: createSseStream('event: connected\ndata: {}\n\n')
        })
      )
      vi.stubGlobal('fetch', fetchMock)

      const gate = new ServerCanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        reconnectDelay: 300_000,
        maxReconnectDelay: 300_000,
        heartbeatTimeoutMs: 300_000
      })
      await gate.init()
      await flushMicrotasks(20)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3001/sdk/stream',
        expect.anything()
      )
      gate.disconnect()
    })

    it('does not use polling on the server even with pollIntervalMs set', async () => {
      vi.useFakeTimers()
      const fetchMock = vi.fn()
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ projectId: 'p1', environment: 'prod', flags: [] })
        })
      )
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          body: createSseStream('event: connected\ndata: {}\n\n')
        })
      )
      vi.stubGlobal('fetch', fetchMock)

      const gate = new ServerCanaryGate('test-key', {
        baseUrl: 'http://localhost:3001',
        pollIntervalMs: 1000,
        reconnectDelay: 300_000,
        maxReconnectDelay: 300_000,
        heartbeatTimeoutMs: 300_000
      })
      await gate.init()
      await vi.advanceTimersByTimeAsync(3000)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      gate.disconnect()
      vi.useRealTimers()
    })
  })

  describe('Entry point guards', () => {
    it('throws when the server entry is used in a browser', () => {
      expect(
        () =>
          new ServerCanaryGate('test-key', {
            baseUrl: 'http://localhost:3001'
          })
      ).toThrow('@canarygate/sdk/server is server-only')
    })
  })
})
