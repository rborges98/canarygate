import { describe, it, expect, afterEach } from 'vitest'
import { subscribe, unsubscribe, emitFlagEvent } from './flag-emitter'
import type { ServerResponse } from 'node:http'

type MockResponse = { write: ReturnType<typeof vi.fn> } & ServerResponse

function createMockResponse(): MockResponse {
  return { write: vi.fn() } as unknown as MockResponse
}

describe('subscribe', () => {
  it('returns ok: true when subscription succeeds', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    const result = subscribe(projectId, res, { ip: '1.2.3.4', apiKey: 'key-1' })
    expect(result.ok).toBe(true)
    unsubscribe(projectId, res)
  })

  it('returns ok: false when IP limit exceeded (10 connections)', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const ip = `10.0.0.${Math.floor(Math.random() * 200)}`
    const responses: MockResponse[] = []

    for (let i = 0; i < 10; i++) {
      const res = createMockResponse()
      responses.push(res)
      const result = subscribe(projectId, res, { ip, apiKey: `key-ip-limit-${i}` })
      expect(result.ok).toBe(true)
    }

    const extra = createMockResponse()
    const result = subscribe(projectId, extra, { ip, apiKey: 'key-ip-limit-extra' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/too many/i)
    }

    for (const res of responses) {
      unsubscribe(projectId, res)
    }
  })

  it('returns ok: false when apiKey limit exceeded (25 connections)', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const apiKey = `key-apikey-limit-${crypto.randomUUID()}`
    const responses: MockResponse[] = []

    for (let i = 0; i < 25; i++) {
      const res = createMockResponse()
      responses.push(res)
      const result = subscribe(projectId, res, { ip: `192.168.${i}.1`, apiKey })
      expect(result.ok).toBe(true)
    }

    const extra = createMockResponse()
    const result = subscribe(projectId, extra, { ip: '192.168.99.1', apiKey })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/too many/i)
    }

    for (const res of responses) {
      unsubscribe(projectId, res)
    }
  })
})

describe('unsubscribe', () => {
  it('removes subscriber from the set', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    subscribe(projectId, res, { ip: '1.2.3.4', apiKey: 'key-unsub-1' })
    unsubscribe(projectId, res)

    // after unsubscribing, emitting should not call write
    emitFlagEvent(projectId, 'flag-updated', { key: 'my-flag' })
    expect(res.write).not.toHaveBeenCalled()
  })

  it('does nothing when subscriber not found', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    // should not throw
    expect(() => unsubscribe(projectId, res)).not.toThrow()
  })

  it('cleans up empty Set when last subscriber is removed', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    subscribe(projectId, res, { ip: '1.2.3.4', apiKey: 'key-cleanup' })
    unsubscribe(projectId, res)

    // emitting to a removed project should be a no-op
    expect(() => emitFlagEvent(projectId, 'flag-updated', {})).not.toThrow()
    expect(res.write).not.toHaveBeenCalled()
  })
})

describe('emitFlagEvent', () => {
  it('calls response.write for all subscribers of the projectId', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res1 = createMockResponse()
    const res2 = createMockResponse()

    subscribe(projectId, res1, { ip: '1.2.3.4', apiKey: 'key-emit-1' })
    subscribe(projectId, res2, { ip: '1.2.3.5', apiKey: 'key-emit-2' })

    emitFlagEvent(projectId, 'flag-updated', { key: 'feature-x' })

    expect(res1.write).toHaveBeenCalledOnce()
    expect(res2.write).toHaveBeenCalledOnce()

    unsubscribe(projectId, res1)
    unsubscribe(projectId, res2)
  })

  it('does not call write for subscribers of other projectIds', () => {
    const projectId1 = `project-${crypto.randomUUID()}`
    const projectId2 = `project-${crypto.randomUUID()}`
    const res1 = createMockResponse()
    const res2 = createMockResponse()

    subscribe(projectId1, res1, { ip: '1.2.3.4', apiKey: 'key-other-1' })
    subscribe(projectId2, res2, { ip: '1.2.3.5', apiKey: 'key-other-2' })

    emitFlagEvent(projectId1, 'flag-updated', { key: 'feature-y' })

    expect(res1.write).toHaveBeenCalledOnce()
    expect(res2.write).not.toHaveBeenCalled()

    unsubscribe(projectId1, res1)
    unsubscribe(projectId2, res2)
  })

  it('does nothing when no subscribers exist for projectId', () => {
    const projectId = `project-${crypto.randomUUID()}`
    expect(() => emitFlagEvent(projectId, 'flag-updated', { key: 'ghost' })).not.toThrow()
  })

  it('formats payload as SSE with event and data fields', () => {
    const projectId = `project-${crypto.randomUUID()}`
    const res = createMockResponse()
    const data = { key: 'my-flag', enabled: true }

    subscribe(projectId, res, { ip: '1.2.3.4', apiKey: 'key-format' })
    emitFlagEvent(projectId, 'flag-updated', data)

    expect(res.write).toHaveBeenCalledOnce()
    const payload = res.write.mock.calls[0][0] as string
    expect(payload).toContain('event: flag-updated')
    expect(payload).toContain(`data: ${JSON.stringify(data)}`)
    expect(payload).toMatch(/\n\n$/)

    unsubscribe(projectId, res)
  })
})
