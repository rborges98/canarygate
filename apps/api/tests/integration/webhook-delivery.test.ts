import { createHmac } from 'node:crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FastifyBaseLogger } from 'fastify'

const { publishJSONMock } = vi.hoisted(() => ({ publishJSONMock: vi.fn() }))

vi.mock('../../src/utils/webhook.ts', () => ({
  getQStashClient: vi.fn(() => ({ publishJSON: publishJSONMock })),
  getQStashWebhookUrl: vi.fn(),
  getRequiredEnv: vi.fn(),
}))

vi.mock('../../src/utils/ssrf.ts', () => ({
  assertPublicWebhookTarget: vi.fn(),
}))

import { assertPublicWebhookTarget } from '../../src/utils/ssrf.ts'
import {
  buildWebhookPayload,
  deliverFlagWebhook,
  dispatchWebhookDelivery
} from '../../src/services/webhook-delivery.ts'

const log = { error: vi.fn(), warn: vi.fn(), info: vi.fn() } as unknown as FastifyBaseLogger

const webhookProject = {
  id: 'project-1',
  slug: 'my-project',
  webhookUrl: 'https://hooks.example.com/canarygate',
  webhookSecret: 'webhook-secret'
}

const payloadInput = {
  project: webhookProject,
  flag: {
    key: 'dark-mode',
    name: 'Dark Mode',
    type: 'boolean',
    enabled: true,
    rolloutPercent: null,
    updatedAt: new Date('2024-01-01T00:00:00.000Z')
  },
  environment: { slug: 'production' }
}

describe('webhook delivery service', () => {
  beforeEach(() => {
    publishJSONMock.mockReset()
    vi.mocked(assertPublicWebhookTarget).mockReset()
    vi.mocked(assertPublicWebhookTarget).mockResolvedValue({ ok: true })
  })

  describe('buildWebhookPayload', () => {
    it('builds a payload with ISO timestamps and actor email', () => {
      const payload = buildWebhookPayload('flag.toggled', {
        ...payloadInput,
        actorEmail: 'admin@example.com'
      })

      expect(payload).toMatchObject({
        event: 'flag.toggled',
        projectId: 'project-1',
        projectSlug: 'my-project',
        flag: {
          key: 'dark-mode',
          name: 'Dark Mode',
          type: 'boolean',
          enabled: true,
          rolloutPercent: null,
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        environment: { slug: 'production' },
        actorEmail: 'admin@example.com'
      })
      expect(typeof payload.timestamp).toBe('string')
      expect(new Date(payload.timestamp).getTime()).not.toBeNaN()
    })

    it('omits actorEmail when absent', () => {
      const payload = buildWebhookPayload('flag.created', payloadInput)
      expect(payload).not.toHaveProperty('actorEmail')
    })
  })

  describe('dispatchWebhookDelivery', () => {
    it('does nothing when the project has no webhook configured', async () => {
      const result = await dispatchWebhookDelivery(
        { ...webhookProject, webhookUrl: null },
        {},
        log
      )

      expect(result).toBe(false)
      expect(publishJSONMock).not.toHaveBeenCalled()
    })

    it('skips delivery when the target is not public', async () => {
      vi.mocked(assertPublicWebhookTarget).mockResolvedValue({
        ok: false,
        reason: 'blocked'
      })

      const result = await dispatchWebhookDelivery(webhookProject, {}, log)

      expect(result).toBe(false)
      expect(publishJSONMock).not.toHaveBeenCalled()
    })

    it('publishes the payload to QStash with an HMAC signature header', async () => {
      publishJSONMock.mockResolvedValue({ messageId: 'msg-1' })

      const payload = buildWebhookPayload('flag.toggled', payloadInput)
      const result = await dispatchWebhookDelivery(webhookProject, payload, log)

      expect(result).toBe(true)
      expect(publishJSONMock).toHaveBeenCalledTimes(1)
      const [args] = publishJSONMock.mock.calls[0]
      expect(args.url).toBe(webhookProject.webhookUrl)
      expect(args.body).toEqual(payload)
      expect(args.retries).toBe(3)

      const expectedSignature = createHmac(
        'sha256',
        webhookProject.webhookSecret
      )
        .update(JSON.stringify(payload))
        .digest('hex')
      expect(args.headers['x-canarygate-signature']).toBe(
        `sha256=${expectedSignature}`
      )
    })

    it('logs and returns false when publishing fails', async () => {
      publishJSONMock.mockRejectedValue(new Error('qstash down'))

      const result = await dispatchWebhookDelivery(
        webhookProject,
        {},
        log
      )

      expect(result).toBe(false)
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('deliverFlagWebhook', () => {
    it('does nothing when the project is null', async () => {
      await deliverFlagWebhook('flag.created', null, payloadInput.flag, {
        slug: 'production'
      }, log)

      expect(publishJSONMock).not.toHaveBeenCalled()
    })

    it('dispatches the event with the project and environment', async () => {
      await deliverFlagWebhook(
        'flag.updated',
        webhookProject,
        payloadInput.flag,
        { slug: 'production' },
        log,
        'admin@example.com'
      )

      expect(publishJSONMock).toHaveBeenCalledTimes(1)
      const [args] = publishJSONMock.mock.calls[0]
      expect(args.body.event).toBe('flag.updated')
      expect(args.body.environment).toEqual({ slug: 'production' })
      expect(args.body.actorEmail).toBe('admin@example.com')
    })
  })
})