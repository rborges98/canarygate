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

vi.mock('../../src/db/projects.ts', () => ({
  listProjectsByOrg: vi.fn(),
  createProject: vi.fn(),
  getProjectBySlug: vi.fn(),
  getProjectBySlugForOrgMember: vi.fn(),
  getProjectById: vi.fn(),
  regenerateApiKey: vi.fn(),
  updateProject: vi.fn(),
  getWebhook: vi.fn(),
  getWebhookSecret: vi.fn(),
  getProjectWebhookConfig: vi.fn(),
  updateWebhook: vi.fn(),
  regenerateWebhookSecret: vi.fn(),
}))

vi.mock('../../src/db/environments.ts', () => ({
  createDefaultEnvironments: vi.fn().mockResolvedValue(undefined),
  listEnvironments: vi.fn(),
  getEnvironmentBySlug: vi.fn(),
  getOrCreateEnvironments: vi.fn(),
}))

vi.mock('../../src/db/history.ts', () => ({
  insertHistory: vi.fn().mockResolvedValue(undefined),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@canarygate/database/client', () => ({
  db: {
    query: {
      orgMembers: { findFirst: vi.fn() },
    },
  },
}))

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

import * as projectsDb from '../../src/db/projects.ts'
import * as environmentsDb from '../../src/db/environments.ts'
import projectsRoutes from '../../src/routes/projects.ts'
import { buildTestApp, TEST_ORG_ID, TEST_PROJECT_ID } from '../helpers/build-app.ts'

const mockProject = {
  id: TEST_PROJECT_ID,
  orgId: TEST_ORG_ID,
  name: 'Test Project',
  slug: 'test-project',
  apiKey: 'cg_live_abc123',
  active: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const PROJECTS_BASE = `/orgs/${TEST_ORG_ID}/projects`

describe('Projects routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildTestApp(async (fastify) => {
      await fastify.register(projectsRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /orgs/:orgId/projects', () => {
    it('creates a project and returns 201 with default environments', async () => {
      vi.mocked(projectsDb.createProject).mockResolvedValue(mockProject as any)
      vi.mocked(environmentsDb.createDefaultEnvironments).mockResolvedValue(undefined as any)

      const response = await app.inject({
        method: 'POST',
        url: PROJECTS_BASE,
        payload: { name: 'Test Project', slug: 'test-project' },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_PROJECT_ID, name: 'Test Project', slug: 'test-project' })
      expect(vi.mocked(projectsDb.createProject)).toHaveBeenCalledWith(
        TEST_ORG_ID,
        expect.objectContaining({ name: 'Test Project', slug: 'test-project' }),
        expect.anything()
      )
      expect(vi.mocked(environmentsDb.createDefaultEnvironments)).toHaveBeenCalledWith(
        TEST_PROJECT_ID,
        expect.anything()
      )
    })

    it('returns 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: PROJECTS_BASE,
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /orgs/:orgId/projects', () => {
    it('returns paginated list of projects for the org owner', async () => {
      vi.mocked(projectsDb.listProjectsByOrg).mockResolvedValue({
        items: [mockProject],
        total: 1,
      } as any)

      const response = await app.inject({ method: 'GET', url: PROJECTS_BASE })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual(
        expect.objectContaining({ total: 1, page: 1, pageSize: 50 })
      )
      expect(body.items).toHaveLength(1)
      expect(body.items[0]).toMatchObject({
        id: TEST_PROJECT_ID,
        slug: 'test-project',
      })
      expect(vi.mocked(projectsDb.listProjectsByOrg)).toHaveBeenCalledWith(
        TEST_ORG_ID,
        undefined,
        { page: 1, pageSize: 50 },
        expect.anything()
      )
    })

    it('passes page and pageSize query params to the db', async () => {
      vi.mocked(projectsDb.listProjectsByOrg).mockResolvedValue({
        items: [],
        total: 42,
      } as any)

      const response = await app.inject({
        method: 'GET',
        url: `${PROJECTS_BASE}?page=2&pageSize=25`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({ items: [], total: 42, page: 2, pageSize: 25 })
      expect(vi.mocked(projectsDb.listProjectsByOrg)).toHaveBeenCalledWith(
        TEST_ORG_ID,
        undefined,
        { page: 2, pageSize: 25 },
        expect.anything()
      )
    })

    it('returns 400 for pageSize above the maximum', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `${PROJECTS_BASE}?pageSize=101`,
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /orgs/:orgId/projects/slug/:slug', () => {
    it('returns project by slug', async () => {
      vi.mocked(projectsDb.getProjectBySlug).mockResolvedValue(mockProject as any)

      const response = await app.inject({
        method: 'GET',
        url: `${PROJECTS_BASE}/slug/test-project`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_PROJECT_ID, slug: 'test-project', projectRole: 'ADMIN' })
    })

    it('returns 404 when slug does not exist', async () => {
      vi.mocked(projectsDb.getProjectBySlug).mockResolvedValue(undefined as any)

      const response = await app.inject({
        method: 'GET',
        url: `${PROJECTS_BASE}/slug/nonexistent-slug`,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('Webhook endpoints', () => {
    const WEBHOOK_BASE = `${PROJECTS_BASE}/${TEST_PROJECT_ID}/webhook`

    it('GET returns the webhook URL and secret', async () => {
      vi.mocked(projectsDb.getWebhook).mockResolvedValue(
        'https://hooks.example.com/canarygate' as any
      )
      vi.mocked(projectsDb.getWebhookSecret).mockResolvedValue(
        'webhook-secret' as any
      )

      const response = await app.inject({
        method: 'GET',
        url: WEBHOOK_BASE,
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        webhookUrl: 'https://hooks.example.com/canarygate',
        webhookSecret: 'webhook-secret',
      })
    })

    it('GET returns 404 when the project does not exist', async () => {
      vi.mocked(projectsDb.getWebhook).mockResolvedValue(undefined as any)

      const response = await app.inject({
        method: 'GET',
        url: WEBHOOK_BASE,
      })

      expect(response.statusCode).toBe(404)
    })

    it('PUT saves the webhook URL and returns the generated secret', async () => {
      vi.mocked(projectsDb.getWebhook).mockResolvedValue(null as any)
      vi.mocked(projectsDb.updateWebhook).mockResolvedValue({
        ...mockProject,
        webhookUrl: 'https://hooks.example.com/canarygate',
        webhookSecret: 'generated-secret',
      } as any)

      const response = await app.inject({
        method: 'PUT',
        url: WEBHOOK_BASE,
        payload: { webhookUrl: 'https://hooks.example.com/canarygate' },
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        webhookUrl: 'https://hooks.example.com/canarygate',
        webhookSecret: 'generated-secret',
      })
    })

    it('PUT rejects non-https webhook URLs', async () => {
      vi.mocked(projectsDb.getWebhook).mockResolvedValue(null as any)

      const response = await app.inject({
        method: 'PUT',
        url: WEBHOOK_BASE,
        payload: { webhookUrl: 'http://hooks.example.com/canarygate' },
      })

      expect(response.statusCode).toBe(400)
      expect(projectsDb.updateWebhook).not.toHaveBeenCalled()
    })

    it('POST /secret regenerates the webhook secret', async () => {
      vi.mocked(projectsDb.getProjectById).mockResolvedValue(mockProject as any)
      vi.mocked(projectsDb.regenerateWebhookSecret).mockResolvedValue({
        webhookSecret: 'regenerated-secret',
      } as any)

      const response = await app.inject({
        method: 'POST',
        url: `${WEBHOOK_BASE}/secret`,
      })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({
        webhookSecret: 'regenerated-secret',
      })
    })

    it('POST /secret returns 404 when the project does not exist', async () => {
      vi.mocked(projectsDb.getProjectById).mockResolvedValue(null as any)

      const response = await app.inject({
        method: 'POST',
        url: `${WEBHOOK_BASE}/secret`,
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
