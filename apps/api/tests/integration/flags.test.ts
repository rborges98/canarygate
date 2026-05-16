import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

vi.mock('../../src/plugins/require-session.ts', () => ({
  requireSession: vi.fn(async (request: { userId: string; userEmail: string }) => {
    request.userId = 'test-user-id'
    request.userEmail = 'test@example.com'
  }),
  isLocalAuthBypassEnabled: vi.fn(() => false),
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

vi.mock('../../src/pubsub/flag-events.ts', () => ({
  publishFlagEvent: vi.fn().mockResolvedValue(undefined),
  startFlagEventSubscriber: vi.fn(),
}))

import * as flagsDb from '../../src/db/flags.ts'
import * as environmentsDb from '../../src/db/environments.ts'
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

const FLAGS_BASE = `/orgs/${TEST_ORG_ID}/projects/${TEST_PROJECT_ID}/flags`

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
      vi.mocked(flagsDb.listFlagsWithAllEnvs).mockResolvedValue([flagWithEnvs] as any)

      const response = await app.inject({ method: 'GET', url: FLAGS_BASE })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(1)
      expect(body[0]).toMatchObject({ id: TEST_FLAG_ID, key: 'test-flag' })
    })

    it('returns flags for a specific environment when environmentSlug is provided', async () => {
      vi.mocked(environmentsDb.getEnvironmentBySlug).mockResolvedValue(mockEnv as any)
      vi.mocked(flagsDb.listFlags).mockResolvedValue([mockFlag] as any)

      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?environmentSlug=production`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(1)
      expect(body[0]).toMatchObject({ id: TEST_FLAG_ID, key: 'test-flag' })
    })

    it('returns 404 when specified environment does not exist', async () => {
      vi.mocked(environmentsDb.getEnvironmentBySlug).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'GET',
        url: `${FLAGS_BASE}?environmentSlug=nonexistent`,
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns empty array when project has no flags', async () => {
      vi.mocked(flagsDb.listFlagsWithAllEnvs).mockResolvedValue([])

      const response = await app.inject({ method: 'GET', url: FLAGS_BASE })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
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
    it('deletes a flag and returns 204', async () => {
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
      expect(vi.mocked(publishFlagEvent)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        TEST_ENV_ID,
        'flag-deleted',
        expect.objectContaining({ key: 'test-flag' }),
        expect.anything()
      )
    })

    it('returns 404 when flag does not exist', async () => {
      vi.mocked(flagsDb.deleteFlag).mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: `${FLAGS_BASE}/${TEST_FLAG_ID}`,
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
