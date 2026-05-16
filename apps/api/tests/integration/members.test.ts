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

vi.mock('../../src/db/members.ts', () => ({
  listMembers: vi.fn(),
  getMemberSummary: vi.fn(),
  removeMember: vi.fn(),
  makeOwner: vi.fn(),
}))

vi.mock('../../src/db/history.ts', () => ({
  insertHistory: vi.fn().mockResolvedValue(undefined),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/db/invites.ts', () => ({
  getInviteByToken: vi.fn(),
  createInvite: vi.fn(),
  acceptInvite: vi.fn(),
  declineInvite: vi.fn(),
}))

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import * as membersDb from '../../src/db/members.ts'
import membersRoutes from '../../src/routes/members.ts'
import {
  buildTestApp,
  TEST_ORG_ID,
  TEST_USER_ID,
  TEST_USER_EMAIL,
} from '../helpers/build-app.ts'

const mockMember = {
  id: '11111111-1111-1111-1111-111111111111',
  userId: TEST_USER_ID,
  name: 'Test User',
  email: TEST_USER_EMAIL,
  role: 'MEMBER' as const,
  joinedAt: new Date('2024-01-01').toISOString(),
  projects: [],
}

const MEMBERS_BASE = `/orgs/${TEST_ORG_ID}/members`

describe('Members routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildTestApp(async (fastify) => {
      await fastify.register(membersRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /orgs/:orgId/members', () => {
    it('returns list of members', async () => {
      vi.mocked(membersDb.listMembers).mockResolvedValue([mockMember] as any)

      const response = await app.inject({
        method: 'GET',
        url: MEMBERS_BASE,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveLength(1)
      expect(body[0]).toMatchObject({ userId: TEST_USER_ID, email: TEST_USER_EMAIL })
    })
  })

  describe('DELETE /orgs/:orgId/members/:userId', () => {
    it('removes a member and returns 204', async () => {
      vi.mocked(membersDb.getMemberSummary).mockResolvedValue({
        userId: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        role: 'MEMBER',
      } as any)
      vi.mocked(membersDb.removeMember).mockResolvedValue(true as any)

      const response = await app.inject({
        method: 'DELETE',
        url: `${MEMBERS_BASE}/${TEST_USER_ID}`,
      })

      expect(response.statusCode).toBe(204)
      expect(vi.mocked(membersDb.getMemberSummary)).toHaveBeenCalledWith(
        TEST_ORG_ID,
        TEST_USER_ID,
        expect.anything()
      )
      expect(vi.mocked(membersDb.removeMember)).toHaveBeenCalledWith(
        TEST_ORG_ID,
        TEST_USER_ID,
        expect.anything()
      )
    })

    it('returns 404 when member does not exist', async () => {
      vi.mocked(membersDb.getMemberSummary).mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: `${MEMBERS_BASE}/${TEST_USER_ID}`,
      })

      expect(response.statusCode).toBe(404)
    })
  })
})
