import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

vi.mock('@canarygate/database/client', () => ({
  db: {
    query: {
      orgMembers: {
        findFirst: vi.fn(),
      },
    },
  },
}))

vi.mock('../../src/db/orgs.ts', () => ({
  listOrgsForUser: vi.fn(),
  createOrg: vi.fn(),
  getOrgBySlug: vi.fn(),
  getOrgById: vi.fn(),
  updateOrg: vi.fn(),
  deleteOrg: vi.fn(),
}))

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

import { db } from '@canarygate/database/client'
import * as orgsDb from '../../src/db/orgs.ts'
import orgsRoutes from '../../src/routes/orgs.ts'
import {
  buildTestApp,
  TEST_USER_ID,
  TEST_ORG_ID,
} from '../helpers/build-app.ts'

const mockOrg = {
  id: TEST_ORG_ID,
  name: 'Test Org',
  slug: 'test-org',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('Orgs routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildTestApp(async (fastify) => {
      await fastify.register(orgsRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /orgs', () => {
    it('returns empty array when user has no orgs', async () => {
      vi.mocked(orgsDb.listOrgsForUser).mockResolvedValue([])

      const response = await app.inject({ method: 'GET', url: '/orgs' })

      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual([])
    })

    it('returns list of orgs for authenticated user', async () => {
      const orgs = [
        {
          ...mockOrg,
          role: 'OWNER' as const,
          memberCount: 2,
          projectCount: 1,
        },
      ]
      vi.mocked(orgsDb.listOrgsForUser).mockResolvedValue(orgs as any)

      const response = await app.inject({ method: 'GET', url: '/orgs' })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(1)
      expect(body[0]).toMatchObject({ id: TEST_ORG_ID, name: 'Test Org', slug: 'test-org' })
      expect(vi.mocked(orgsDb.listOrgsForUser)).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.anything()
      )
    })
  })

  describe('POST /orgs', () => {
    it('creates an org with valid body and returns 201', async () => {
      vi.mocked(orgsDb.createOrg).mockResolvedValue(mockOrg as any)

      const response = await app.inject({
        method: 'POST',
        url: '/orgs',
        payload: { name: 'Test Org', slug: 'test-org' },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_ORG_ID, name: 'Test Org', slug: 'test-org' })
      expect(vi.mocked(orgsDb.createOrg)).toHaveBeenCalledWith(
        { name: 'Test Org', slug: 'test-org' },
        TEST_USER_ID,
        expect.anything()
      )
    })

    it('returns 400 when name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orgs',
        payload: { slug: 'test-org' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 when slug is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orgs',
        payload: { name: 'Test Org' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 when slug has invalid format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/orgs',
        payload: { name: 'Test Org', slug: 'Invalid Slug!' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /orgs/slug/:slug', () => {
    it('returns org when slug exists and user is a member', async () => {
      vi.mocked(orgsDb.getOrgBySlug).mockResolvedValue(mockOrg as any)
      vi.mocked(db.query.orgMembers.findFirst).mockResolvedValue({
        id: 'member-1',
      } as any)

      const response = await app.inject({
        method: 'GET',
        url: '/orgs/slug/test-org',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({ id: TEST_ORG_ID, slug: 'test-org' })
    })

    it('returns 404 when slug does not exist', async () => {
      vi.mocked(orgsDb.getOrgBySlug).mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/orgs/slug/nonexistent',
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 404 when user is not a member of the org', async () => {
      vi.mocked(orgsDb.getOrgBySlug).mockResolvedValue(mockOrg as any)
      vi.mocked(db.query.orgMembers.findFirst).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'GET',
        url: '/orgs/slug/test-org',
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
