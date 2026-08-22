import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

const { publishJSONMock } = vi.hoisted(() => ({ publishJSONMock: vi.fn() }))

vi.mock('@upstash/qstash', () => ({
  Client: vi.fn().mockImplementation(() => ({ publishJSON: publishJSONMock })),
}))

vi.mock('../../src/plugins/require-session.ts', () => ({
  requireSession: vi.fn(async (request: { userId: string; userEmail: string }) => {
    request.userId = 'test-user-id'
    request.userEmail = 'test@example.com'
  }),
}))

vi.mock('../../src/plugins/require-org-access.ts', () => ({
  requireOrgMember: vi.fn(async (request: { orgRole: string }) => {
    request.orgRole = 'OWNER'
  }),
  requireOrgOwner: vi.fn(async (request: { orgRole: string }) => {
    request.orgRole = 'OWNER'
  }),
  requireProjectAccess: vi.fn(
    async (request: { orgRole: string; projectRole: string }) => {
      request.orgRole = 'OWNER'
      request.projectRole = 'ADMIN'
    }
  ),
  requireProjectAdmin: vi.fn(
    async (request: { orgRole: string; projectRole: string }) => {
      request.orgRole = 'OWNER'
      request.projectRole = 'ADMIN'
    }
  ),
}))

vi.mock('../../src/db/flags.ts', () => ({
  listFlags: vi.fn(),
  listFlagsWithAllEnvs: vi.fn(),
  getFlagById: vi.fn(),
  getFlagMetaById: vi.fn(),
  createFlag: vi.fn(),
  updateFlag: vi.fn(),
  deleteFlag: vi.fn(),
  toggleFlag: vi.fn(),
  updateRollout: vi.fn(),
  addFlagToEnvironment: vi.fn(),
  getFlagEnvironmentRow: vi.fn(),
  listFlagEnvironmentsForFlag: vi.fn(),
}))

vi.mock('../../src/db/environments.ts', () => ({
  listEnvironments: vi.fn(),
  getEnvironmentBySlug: vi.fn(),
  getOrCreateEnvironments: vi.fn(),
  createDefaultEnvironments: vi.fn(),
}))

vi.mock('../../src/db/history.ts', () => ({
  insertHistory: vi.fn().mockResolvedValue(undefined),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/projects.ts', () => ({
  getProjectWebhookConfig: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../src/utils/ssrf.ts', () => ({
  assertPublicWebhookTarget: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('../../src/pubsub/flag-events.ts', () => ({
  publishFlagEvent: vi.fn().mockResolvedValue(undefined),
  startFlagEventSubscriber: vi.fn(),
}))

import * as flagsDb from '../../src/db/flags.ts'
import * as environmentsDb from '../../src/db/environments.ts'
import { getProjectWebhookConfig } from '../../src/db/projects.ts'
import { publishFlagEvent } from '../../src/pubsub/flag-events.ts'
import flagsRoutes from '../../src/routes/flags.ts'
import {
  buildTestApp,
  TEST_PROJECT_ID,
  TEST_ORG_ID,
  TEST_FLAG_ID,
  TEST_ENV_ID,
} from '../helpers/build-app.ts'

const mockEnv = {
  id: TEST_ENV_ID,
  projectId: TEST_PROJECT_ID,
  name: 'Production',
  slug: 'production',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockFlag = {
  id: TEST_FLAG_ID,
  projectId: TEST_PROJECT_ID,
  name: 'Test Flag',
  key: 'test-flag',
  description: '',
  type: 'boolean' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  environmentId: TEST_ENV_ID,
  enabled: false,
  rolloutPercent: 0,
  scheduleEnabled: false,
  scheduleDate: null,
  scheduleAction: null,
  scheduleRolloutPercent: null,
  autoRolloutEnabled: false,
  autoRolloutIncreaseBy: null,
  autoRolloutEveryValue: null,
  autoRolloutEveryUnit: null,
  autoRolloutUntilMax: null,
  autoRolloutNextAt: null,
}

const mockFlagEnvironmentRow = {
  id: 'fe-1',
  flagId: TEST_FLAG_ID,
  environmentId: TEST_ENV_ID,
  enabled: false,
  rolloutPercent: 0,
  scheduleEnabled: false,
  scheduleDate: null,
  scheduleAction: null,
  scheduleRolloutPercent: 0,
  autoRolloutEnabled: false,
  autoRolloutIncreaseBy: 10,
  autoRolloutEveryValue: 1,
  autoRolloutEveryUnit: 'hours',
  autoRolloutUntilMax: 100,
  autoRolloutNextAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const FLAGS_BASE = `/orgs/${TEST_ORG_ID}/projects/${TEST_PROJECT_ID}/flags`

process.env.QSTASH_TOKEN = 'test-token'

describe('Flags routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.mocked(environmentsDb.getOrCreateEnvironments).mockResolvedValue(
      [mockEnv] as any
    )
    vi.mocked(environmentsDb.listEnvironments).mockResolvedValue([mockEnv] as any)
    app = await buildTestApp(async (fastify) => {
      await fastify.register(flagsRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /orgs/:orgId/projects/:projectId/flags', () => {
    it('returns list of flags with all environments when no environmentSlug', async () => {
      const flagWithEnvs = {
        id: TEST_FLAG_ID,
        projectId: TEST_PROJECT_ID,
        name: 'Test Flag',
        key: 'test-flag',
        description: '',
        type: 'boolean',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        environments: [
          { slug: 'production', name: 'Production', enabled: false, rolloutPercent: 0 },
        ],
      }
      vi.mocked(flagsDb.listFlagsWithAllEnvs).mockResolvedValue({
        items: [flagWithEnvs],
        total: 1,
      } as any)

      const response = await app.inject({ method: 'GET', url: FLAGS_BASE })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual(
        expect.objectContaining({ total: 1, page: 1, pageSize: 50 })
      )
      expect(body.items).toHaveLength(1)
      expect(body.items[0]).toMatchObject({ id: TEST_FLAG_ID, key: 'test-flag' })
      expect(vi.mocked(flagsDb.listFlagsWithAllEnvs)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        { page: 1, pageSize: 50 },
        expect.anything()
      )
    })

    it('returns flags for a specific environment when environmentSlug is provided', async () => {
      vi.mocked(environmentsDb.getEnvironmentBySlug).mockResolvedValue(mockEnv as any)
      vi.mocked(flagsDb.listFlags).mockResolvedValue({
        items: [mockFlag],
        total: 1,
      } as any)

      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?environmentSlug=production`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual(
        expect.objectContaining({ total: 1, page: 1, pageSize: 50 })
      )
      expect(body.items).toHaveLength(1)
      expect(body.items[0]).toMatchObject({ id: TEST_FLAG_ID, key: 'test-flag' })
      expect(vi.mocked(flagsDb.listFlags)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        { page: 1, pageSize: 50 },
        expect.anything()
      )
    })

    it('returns 404 when specified environment does not exist', async () => {
      vi.mocked(environmentsDb.getEnvironmentBySlug).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?environmentSlug=nonexistent`,
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns empty page when project has no flags', async () => {
      vi.mocked(flagsDb.listFlagsWithAllEnvs).mockResolvedValue({
        items: [],
        total: 0,
      } as any)

      const response = await app.inject({ method: 'GET', url: FLAGS_BASE })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        items: [],
        total: 0,
        page: 1,
        pageSize: 50,
      })
    })

    it('passes page and pageSize to listFlagsWithAllEnvs', async () => {
      vi.mocked(flagsDb.listFlagsWithAllEnvs).mockResolvedValue({
        items: [],
        total: 7,
      } as any)

      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?page=2&pageSize=10`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({ items: [], total: 7, page: 2, pageSize: 10 })
      expect(vi.mocked(flagsDb.listFlagsWithAllEnvs)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        { page: 2, pageSize: 10 },
        expect.anything()
      )
    })

    it('passes page and pageSize to listFlags when environmentSlug is provided', async () => {
      vi.mocked(environmentsDb.getEnvironmentBySlug).mockResolvedValue(mockEnv as any)
      vi.mocked(flagsDb.listFlags).mockResolvedValue({
        items: [],
        total: 5,
      } as any)

      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?environmentSlug=production&page=2&pageSize=10`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({ items: [], total: 5, page: 2, pageSize: 10 })
      expect(vi.mocked(flagsDb.listFlags)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        { page: 2, pageSize: 10 },
        expect.anything()
      )
    })

    it('returns 400 for pageSize above the maximum', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?pageSize=101`,
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /orgs/:orgId/projects/:projectId/flags', () => {
    it('creates a boolean flag with valid body and returns 201', async () => {
      vi.mocked(flagsDb.createFlag).mockResolvedValue(mockFlag as any)

      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: { name: 'Test Flag', key: 'test-flag', type: 'boolean' },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_FLAG_ID, key: 'test-flag', type: 'boolean' })
      expect(vi.mocked(flagsDb.createFlag)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        expect.objectContaining({ name: 'Test Flag', key: 'test-flag', type: 'boolean' }),
        [TEST_ENV_ID],
        expect.anything()
      )
    })

    it('publishes a flag-created event after creating a flag', async () => {
      vi.mocked(flagsDb.createFlag).mockResolvedValue(mockFlag as any)

      await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: { name: 'Test Flag', key: 'test-flag', type: 'boolean' },
      })

      expect(vi.mocked(publishFlagEvent)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        'flag-created',
        expect.objectContaining({ key: 'test-flag', type: 'boolean' }),
        expect.anything()
      )
    })

    it('returns 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: { name: 'Test Flag' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 when type is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: { name: 'Test Flag', key: 'test-flag', type: 'invalid-type' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 when scheduleEnabled is true but scheduleDate is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: {
          name: 'Test Flag',
          key: 'test-flag',
          type: 'boolean',
          scheduleEnabled: true,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PATCH /orgs/:orgId/projects/:projectId/flags/:flagId/toggle', () => {
    it('toggles the flag and returns the updated flag', async () => {
      const toggledFlag = { ...mockFlag, enabled: true }
      vi.mocked(flagsDb.toggleFlag).mockResolvedValue(toggledFlag as any)

      const response = await app.inject({
        method: 'PATCH',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}/toggle`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_FLAG_ID, enabled: true })
      expect(vi.mocked(flagsDb.toggleFlag)).toHaveBeenCalledWith(
        TEST_FLAG_ID,
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        expect.anything()
      )
    })

    it('publishes a flag-updated event after toggling', async () => {
      const toggledFlag = { ...mockFlag, enabled: true }
      vi.mocked(flagsDb.toggleFlag).mockResolvedValue(toggledFlag as any)

      await app.inject({
        method: 'PATCH',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}/toggle`,
      })

      expect(vi.mocked(publishFlagEvent)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        'flag-updated',
        expect.objectContaining({ key: 'test-flag', enabled: true }),
        expect.anything()
      )
    })

    it('dispatches a signed webhook delivery when the project has a webhook configured', async () => {
      const webhookProject = {
        id: TEST_PROJECT_ID,
        slug: 'test-project',
        webhookUrl: 'https://hooks.example.com/canarygate',
        webhookSecret: 'webhook-secret'
      }
      vi.mocked(getProjectWebhookConfig).mockResolvedValueOnce(
        webhookProject as any
      )
      vi.mocked(flagsDb.toggleFlag).mockResolvedValue({
        ...mockFlag,
        enabled: true
      } as any)

      const response = await app.inject({
        method: 'PATCH',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}/toggle`,
      })

      expect(response.statusCode).toBe(200)
      const deliveryCall = publishJSONMock.mock.calls.find(
        (args: any[]) => args[0]?.url === webhookProject.webhookUrl
      )
      expect(deliveryCall).toBeDefined()
      const [publishArgs] = deliveryCall
      expect(publishArgs.headers['x-canarygate-signature']).toMatch(
        /^sha256=[0-9a-f]{64}$/
      )
      expect(publishArgs.retries).toBe(3)
      expect(publishArgs.body).toMatchObject({
        event: 'flag.toggled',
        projectId: TEST_PROJECT_ID,
        projectSlug: webhookProject.slug,
        flag: { key: 'test-flag', enabled: true },
        environment: { slug: 'production' }
      })
    })

    it('returns 404 when flag does not exist', async () => {
      vi.mocked(flagsDb.toggleFlag).mockResolvedValue(null)

      const response = await app.inject({
        method: 'PATCH',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}/toggle`,
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 404 when environment does not exist', async () => {
      vi.mocked(environmentsDb.getOrCreateEnvironments).mockResolvedValue([])

      const response = await app.inject({
        method: 'PATCH',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}/toggle`,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('PUT /orgs/:orgId/projects/:projectId/flags/:flagId', () => {
    it('updates a flag and returns 200', async () => {
      const updatedFlag = { ...mockFlag, name: 'Updated Flag', enabled: true, rolloutPercent: 50 }
      vi.mocked(flagsDb.getFlagById).mockResolvedValue(mockFlag as any)
      vi.mocked(flagsDb.updateFlag).mockResolvedValue(updatedFlag as any)

      const response = await app.inject({
        method: 'PUT',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
        payload: {
          name: 'Updated Flag',
          description: 'Updated description',
          enabled: true,
          rolloutPercent: 50,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_FLAG_ID, name: 'Updated Flag', enabled: true })
      expect(vi.mocked(flagsDb.updateFlag)).toHaveBeenCalledWith(
        TEST_FLAG_ID,
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        expect.objectContaining({ name: 'Updated Flag', enabled: true }),
        expect.anything()
      )
    })

    it('publishes a flag-updated event after updating', async () => {
      const updatedFlag = { ...mockFlag, enabled: true }
      vi.mocked(flagsDb.getFlagById).mockResolvedValue(mockFlag as any)
      vi.mocked(flagsDb.updateFlag).mockResolvedValue(updatedFlag as any)

      await app.inject({
        method: 'PUT',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
        payload: { name: 'Test Flag', description: '', enabled: true, rolloutPercent: 0 },
      })

      expect(vi.mocked(publishFlagEvent)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        'flag-updated',
        expect.objectContaining({ key: 'test-flag' }),
        expect.anything()
      )
    })

    it('returns 404 when environment does not exist', async () => {
      vi.mocked(environmentsDb.getOrCreateEnvironments).mockResolvedValue([])

      const response = await app.inject({
        method: 'PUT',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
        payload: { name: 'Updated Flag', description: '', enabled: true, rolloutPercent: 0 },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 404 when flag does not exist', async () => {
      vi.mocked(flagsDb.getFlagById).mockResolvedValue(null)

      const response = await app.inject({
        method: 'PUT',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
        payload: { name: 'Updated Flag', description: '', enabled: true, rolloutPercent: 0 },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
        payload: { name: 'Updated Flag' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('DELETE /orgs/:orgId/projects/:projectId/flags/:flagId', () => {
    it('deletes a flag and broadcasts to every environment', async () => {
      vi.mocked(flagsDb.listFlagEnvironmentsForFlag).mockResolvedValue([
        { id: 'fe-1', environmentId: TEST_ENV_ID, environmentSlug: 'production' },
      ] as any)
      vi.mocked(flagsDb.deleteFlag).mockResolvedValue(mockFlag as any)

      const response = await app.inject({
        method: 'DELETE',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
      })

      expect(response.statusCode).toBe(204)
      expect(vi.mocked(flagsDb.deleteFlag)).toHaveBeenCalledWith(
        TEST_FLAG_ID,
        TEST_PROJECT_ID,
        expect.anything()
      )
      expect(vi.mocked(flagsDb.listFlagEnvironmentsForFlag)).toHaveBeenCalledWith(
        TEST_FLAG_ID,
        expect.anything()
      )
      expect(vi.mocked(publishFlagEvent)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        'flag-deleted',
        expect.objectContaining({ key: 'test-flag' }),
        expect.anything()
      )
    })

    it('broadcasts to multiple environments', async () => {
      vi.mocked(flagsDb.listFlagEnvironmentsForFlag).mockResolvedValue([
        { id: 'fe-1', environmentId: TEST_ENV_ID, environmentSlug: 'production' },
        { id: 'fe-2', environmentId: 'env-2', environmentSlug: 'staging' },
      ] as any)
      vi.mocked(flagsDb.deleteFlag).mockResolvedValue(mockFlag as any)

      const response = await app.inject({
        method: 'DELETE',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
      })

      expect(response.statusCode).toBe(204)
      expect(vi.mocked(publishFlagEvent)).toHaveBeenCalledTimes(2)
    })

    it('returns 404 when flag does not exist', async () => {
      vi.mocked(flagsDb.listFlagEnvironmentsForFlag).mockResolvedValue([])
      vi.mocked(flagsDb.deleteFlag).mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('QStash job dispatch', () => {
    it('dispatches a schedule job with flagEnvironmentId and deduplicationId', async () => {
      const scheduleDate = new Date(Date.now() + 60 * 60 * 1000)
      vi.mocked(flagsDb.createFlag).mockResolvedValue(mockFlag as any)
      vi.mocked(flagsDb.getFlagEnvironmentRow).mockResolvedValue({
        ...mockFlagEnvironmentRow,
        scheduleEnabled: true,
        scheduleDate,
        scheduleAction: 'enable',
      } as any)

      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: {
          name: 'Test Flag',
          key: 'test-flag',
          type: 'boolean',
          scheduleEnabled: true,
          scheduleDate: scheduleDate.toISOString(),
          scheduleAction: 'enable',
        },
      })

      expect(response.statusCode).toBe(201)
      expect(vi.mocked(flagsDb.getFlagEnvironmentRow)).toHaveBeenCalledWith(
        TEST_FLAG_ID,
        TEST_ENV_ID,
        expect.anything()
      )
      expect(publishJSONMock).toHaveBeenCalledTimes(1)
      const publishCall = publishJSONMock.mock.calls[0][0]
      expect(publishCall.body.type).toBe('schedule')
      expect(publishCall.body.jobData.flagEnvironmentId).toBe('fe-1')
      expect(publishCall.body.jobData.flagKey).toBe('test-flag')
      expect(publishCall.body.jobData.dueAt).toBe(scheduleDate.toISOString())
      expect(publishCall.deduplicationId).toContain(
        `schedule:${TEST_FLAG_ID}:${TEST_ENV_ID}:`
      )
    })

    it('dispatches an auto-rollout job using the stored nextAt', async () => {
      const nextAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
      vi.mocked(flagsDb.createFlag).mockResolvedValue(mockFlag as any)
      vi.mocked(flagsDb.getFlagEnvironmentRow).mockResolvedValue({
        ...mockFlagEnvironmentRow,
        autoRolloutEnabled: true,
        autoRolloutNextAt: nextAt,
      } as any)

      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: {
          name: 'Test Flag',
          key: 'test-flag',
          type: 'boolean',
          autoRolloutEnabled: true,
          autoRolloutIncreaseBy: 10,
          autoRolloutEveryValue: 1,
          autoRolloutEveryUnit: 'hours',
          autoRolloutUntilMax: 100,
        },
      })

      expect(response.statusCode).toBe(201)
      expect(publishJSONMock).toHaveBeenCalledTimes(1)
      const publishCall = publishJSONMock.mock.calls[0][0]
      expect(publishCall.body.type).toBe('auto-rollout')
      expect(publishCall.body.jobData.flagEnvironmentId).toBe('fe-1')
      expect(publishCall.body.jobData.dueAt).toBe(nextAt.toISOString())
    })

    it('returns 400 when scheduleDate is not ISO-8601 with offset', async () => {
      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: {
          name: 'Test Flag',
          key: 'test-flag',
          type: 'boolean',
          scheduleEnabled: true,
          scheduleDate: '2026-08-14T10:00:00',
          scheduleAction: 'enable',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).message).toContain('timezone offset')
    })

    it('returns 400 when scheduleDate is more than 30 days ahead', async () => {
      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: {
          name: 'Test Flag',
          key: 'test-flag',
          type: 'boolean',
          scheduleEnabled: true,
          scheduleDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
          scheduleAction: 'enable',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).message).toContain('30 days')
    })

    it('returns 400 when auto-rollout interval exceeds 30 days', async () => {
      const response = await app.inject({
        method: 'POST',
        url: FLAGS_BASE,
        payload: {
          name: 'Test Flag',
          key: 'test-flag',
          type: 'boolean',
          autoRolloutEnabled: true,
          autoRolloutIncreaseBy: 10,
          autoRolloutEveryValue: 5,
          autoRolloutEveryUnit: 'weeks',
          autoRolloutUntilMax: 100,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).message).toContain('30 days')
    })
  })
})
