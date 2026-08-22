import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  subscribe,
  unsubscribe,
  emitFlagEvent,
  disconnectByApiKey
} from './flag-emitter'
import type { ServerResponse } from 'node:http'

type MockResponse = {
  write: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
  removeListener: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
  destroyed: boolean
  writableEnded: boolean
}

function createMockResponse(): MockResponse {
  return {
    write: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    end: vi.fn(),
    destroyed: false,
    writableEnded: false
  }
}

function asResponse(mock: MockResponse): ServerResponse {
  return mock as unknown as ServerResponse
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('subscribe', () => {
  it('returns ok: true when subscription succeeds', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    const result = subscribe(projectId, asResponse(res), {
      ip: '1.2.3.4',
      apiKey: 'key-1'
    })
    expect(result.ok).toBe(true)
    unsubscribe(projectId, asResponse(res))
  })

  it('returns ok: false when IP limit exceeded (10 connections)', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const ip = `10.0.0.${Math.floor(Math.random() * 200)}`
    const responses: MockResponse[] = []

    for (let i = 0; i < 10; i++) {
      const res = createMockResponse()
      responses.push(res)
      const result = subscribe(projectId, asResponse(res), {
        ip,
        apiKey: `key-ip-limit-${i}`
      })
      expect(result.ok).toBe(true)
    }

    const extra = createMockResponse()
    const result = subscribe(projectId, asResponse(extra), {
      ip,
      apiKey: 'key-ip-limit-extra'
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/too many/i)
    }

    for (const res of responses) {
      unsubscribe(projectId, asResponse(res))
    }
  })

  it('returns ok: false when apiKey limit exceeded (25 connections)', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const apiKey = `key-apikey-limit-${crypto.randomUUID()}`
    const responses: MockResponse[] = []

    for (let i = 0; i < 25; i++) {
      const res = createMockResponse()
      responses.push(res)
      const result = subscribe(projectId, asResponse(res), {
        ip: `192.168.${i}.1`,
        apiKey
      })
      expect(result.ok).toBe(true)
    }

    const extra = createMockResponse()
    const result = subscribe(projectId, asResponse(extra), {
      ip: '192.168.99.1',
      apiKey
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/too many/i)
    }

    for (const res of responses) {
      unsubscribe(projectId, asResponse(res))
    }
  })
})

describe('unsubscribe', () => {
  it('removes subscriber from the set', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    subscribe(projectId, asResponse(res), { ip: '1.2.3.4', apiKey: 'key-unsub-1' })
    unsubscribe(projectId, asResponse(res))

    emitFlagEvent(projectId, 'flag-updated', { key: 'my-flag' })
    expect(res.write).not.toHaveBeenCalled()
  })

  it('does nothing when subscriber not found', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    expect(() => unsubscribe(projectId, asResponse(res))).not.toThrow()
  })

  it('cleans up empty Set when last subscriber is removed', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    subscribe(projectId, asResponse(res), { ip: '1.2.3.4', apiKey: 'key-cleanup' })
    unsubscribe(projectId, asResponse(res))

    expect(() => emitFlagEvent(projectId, 'flag-updated', {})).not.toThrow()
    expect(res.write).not.toHaveBeenCalled()
  })
})

describe('emitFlagEvent', () => {
  it('calls response.write for all subscribers of the projectId', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res1 = createMockResponse()
    const res2 = createMockResponse()

    subscribe(projectId, asResponse(res1), { ip: '1.2.3.4', apiKey: 'key-emit-1' })
    subscribe(projectId, asResponse(res2), { ip: '1.2.3.5', apiKey: 'key-emit-2' })

    emitFlagEvent(projectId, 'flag-updated', { key: 'feature-x' })

    expect(res1.write).toHaveBeenCalledOnce()
    expect(res2.write).toHaveBeenCalledOnce()

    unsubscribe(projectId, asResponse(res1))
    unsubscribe(projectId, asResponse(res2))
  })

  it('does not call write for subscribers of other projectIds', () => {
    const projectId1 = `project-${crypto.randomUUID()}`
    const projectId2 = `project-${crypto.randomUUID()}`
    const res1 = createMockResponse()
    const res2 = createMockResponse()

    subscribe(projectId1, asResponse(res1), { ip: '1.2.3.4', apiKey: 'key-other-1' })
    subscribe(projectId2, asResponse(res2), { ip: '1.2.3.5', apiKey: 'key-other-2' })

    emitFlagEvent(projectId1, 'flag-updated', { key: 'feature-y' })

    expect(res1.write).toHaveBeenCalledOnce()
    expect(res2.write).not.toHaveBeenCalled()

    unsubscribe(projectId1, asResponse(res1))
    unsubscribe(projectId2, asResponse(res2))
  })

  it('does nothing when no subscribers exist for projectId', () => {
    const projectId = `project-${crypto.randomUUID()}`
    expect(() =>
      emitFlagEvent(projectId, 'flag-updated', { key: 'ghost' })
    ).not.toThrow()
  })

  it('formats payload as SSE with event and data fields', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    const data = { key: 'my-flag', enabled: true }

    subscribe(projectId, asResponse(res), { ip: '1.2.3.4', apiKey: 'key-format' })
    emitFlagEvent(projectId, 'flag-updated', data)

    expect(res.write).toHaveBeenCalledOnce()
    const payload = res.write.mock.calls[0][0] as string
    expect(payload).toContain('event: flag-updated')
    expect(payload).toContain(`data: ${JSON.stringify(data)}`)
    expect(payload).toMatch(/\n\n$/)

    unsubscribe(projectId, asResponse(res))
  })

  it('queues events while the socket is backpressured and flushes on drain', () => {
    const projectId = `project-${crypto.randomUUID()}`
    let writeCount = 0
    const res = createMockResponse()
    res.write.mockImplementation(() => {
      writeCount += 1
      return writeCount <= 1 ? false : true
    })

    subscribe(projectId, asResponse(res), { ip: '1.2.3.4', apiKey: 'key-backpress' })

    emitFlagEvent(projectId, 'flag-updated', { key: 'a' })
    emitFlagEvent(projectId, 'flag-updated', { key: 'b' })

    expect(res.write).toHaveBeenCalledTimes(1)

    const drainHandler = res.on.mock.calls[0]?.[1] as () => void
    expect(typeof drainHandler).toBe('function')
    drainHandler()

    expect(res.write).toHaveBeenCalledTimes(3)
    expect(res.removeListener).toHaveBeenCalledWith('drain', drainHandler)

    emitFlagEvent(projectId, 'flag-updated', { key: 'c' })
    expect(res.write).toHaveBeenCalledTimes(4)

    unsubscribe(projectId, asResponse(res))
  })

  it('closes the connection when the queued events exceed the cap', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    res.write.mockReturnValue(false)

    subscribe(projectId, asResponse(res), { ip: '1.2.3.4', apiKey: 'key-overflow' })

    for (let i = 0; i < 65; i++) {
      emitFlagEvent(projectId, 'flag-updated', { index: i })
    }

    expect(res.write).toHaveBeenCalledTimes(1)
    expect(res.on).toHaveBeenCalledTimes(1)
    expect(res.removeListener).toHaveBeenCalledTimes(1)

    emitFlagEvent(projectId, 'flag-updated', { key: 'after-close' })
    expect(res.write).toHaveBeenCalledTimes(1)

    unsubscribe(projectId, asResponse(res))
  })
})

describe('disconnectByApiKey', () => {
  it('disconnects and removes every subscriber matching the api key', () => {
    const channel1 = `p1-${crypto.randomUUID()}`
    const channel2 = `p2-${crypto.randomUUID()}`
    const apiKey = `key-rotated-${crypto.randomUUID()}`
    const res1 = createMockResponse()
    const res2 = createMockResponse()
    const resOther = createMockResponse()

    subscribe(channel1, asResponse(res1), { ip: '1.2.3.4', apiKey })
    subscribe(channel2, asResponse(res2), { ip: '1.2.3.5', apiKey })
    subscribe(channel1, asResponse(resOther), {
      ip: '1.2.3.6',
      apiKey: 'other-key'
    })

    const count = disconnectByApiKey(apiKey)

    expect(count).toBe(2)
    expect(res1.end).toHaveBeenCalledOnce()
    expect(res2.end).toHaveBeenCalledOnce()

    emitFlagEvent(channel1, 'flag-updated', { key: 'after-rotation' })
    expect(res1.write).not.toHaveBeenCalled()
    expect(resOther.write).toHaveBeenCalledOnce()

    unsubscribe(channel1, asResponse(resOther))
  })

  it('returns 0 when no subscriber matches the api key', () => {
    expect(disconnectByApiKey('no-matching-key')).toBe(0)
  })
})
