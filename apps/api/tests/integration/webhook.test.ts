import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import type { FastifyInstance } from 'fastify'

const { verifyMock, dbSelectLimitMock, dbDeleteReturningMock } = vi.hoisted(
  () => ({
    verifyMock: vi.fn(),
    dbSelectLimitMock: vi.fn(() => Promise.resolve([])),
    dbDeleteReturningMock: vi.fn(() => Promise.resolve([])),
  })
)

vi.mock('@upstash/qstash', () => ({
  Receiver: vi.fn().mockImplementation(() => ({ verify: verifyMock })),
  Client: vi.fn().mockImplementation(() => ({
    publishJSON: vi.fn().mockResolvedValue({ messageId: 'test-message' }),
    schedules: {
      create: vi.fn().mockResolvedValue({ scheduleId: 'flag-history-retention' }),
    },
  })),
}))

vi.mock('@canarygate/database/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: dbSelectLimitMock,
            })),
          })),
        })),
        where: vi.fn(() => ({
          limit: dbSelectLimitMock,
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: dbDeleteReturningMock,
      })),
    })),
  },
}))

vi.mock('../../src/pubsub/flag-events.ts', () => ({
  publishFlagEvent: vi.fn().mockResolvedValue(undefined),
  startFlagEventSubscriber: vi.fn(),
}))

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { webhookRoutes } from '../../src/routes/webhook.ts'
import { buildTestApp } from '../helpers/build-app.ts'

const VALID_PAYLOAD = {
  type: 'schedule',
  jobData: {
    flagEnvironmentId: 'fe-1',
    flagId: 'flag-1',
    projectId: 'project-1',
    environmentId: 'env-1',
    environmentSlug: 'production',
    flagKey: 'test-flag',
    dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
}

describe('Webhook routes (QStash)', () => {
  let app: FastifyInstance

  beforeAll(() => {
    process.env.QSTASH_CURRENT_SIGNING_KEY = 'test-current-key'
    process.env.QSTASH_NEXT_SIGNING_KEY = 'test-next-key'
    process.env.QSTASH_TOKEN = 'test-token'
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildTestApp(async (fastify) => {
      await fastify.register(webhookRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('verifies the signature against the raw body string and processes the job', async () => {
    verifyMock.mockResolvedValue(true)
    const rawBody = JSON.stringify(VALID_PAYLOAD)

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'test-signature',
      },
      payload: rawBody,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'State missing' })
    expect(verifyMock).toHaveBeenCalledWith({
      signature: 'test-signature',
      body: rawBody,
    })
  })

  it('returns 401 when the signature header is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      payload: VALID_PAYLOAD,
    })

    expect(response.statusCode).toBe(401)
    expect(verifyMock).not.toHaveBeenCalled()
  })

  it('returns 401 when the signature is invalid', async () => {
    verifyMock.mockResolvedValue(false)

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: { 'upstash-signature': 'bad-signature' },
      payload: VALID_PAYLOAD,
    })

    expect(response.statusCode).toBe(401)
  })

  it('returns 400 when the raw body is not valid JSON', async () => {
    verifyMock.mockResolvedValue(true)

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'test-signature',
      },
      payload: '{not-valid-json',
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({ error: 'Invalid JSON body' })
  })

  it('processes the history-retention job and deletes old flag history in batches', async () => {
    verifyMock.mockResolvedValue(true)
    const batch = Array.from({ length: 5000 }, (_, i) => ({
      id: `history-${i}`,
    }))
    dbSelectLimitMock.mockResolvedValueOnce(batch)
    dbDeleteReturningMock.mockResolvedValueOnce(batch)

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'test-signature',
      },
      payload: JSON.stringify({ type: 'history-retention' }),
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ success: true, deleted: 5000 })
    expect(dbSelectLimitMock).toHaveBeenCalledTimes(2)
    expect(dbDeleteReturningMock).toHaveBeenCalledTimes(1)
  })

  it('returns 400 for an unknown job type', async () => {
    verifyMock.mockResolvedValue(true)

    const response = await app.inject({
      method: 'POST',
      url: '/webhook',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'test-signature',
      },
      payload: JSON.stringify({ type: 'unknown-job' }),
    })

    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({ error: 'Unknown job type' })
  })
})
