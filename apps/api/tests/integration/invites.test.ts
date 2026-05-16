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
}))

vi.mock('../../src/db/invites.ts', () => ({
  getInviteByToken: vi.fn(),
  createInvite: vi.fn(),
  acceptInvite: vi.fn(),
  declineInvite: vi.fn(),
}))

vi.mock('../../src/db/history.ts', () => ({
  insertHistory: vi.fn().mockResolvedValue(undefined),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import * as invitesDb from '../../src/db/invites.ts'
import invitesRoutes from '../../src/routes/invites.ts'
import { buildTestApp, TEST_ORG_ID } from '../helpers/build-app.ts'

const TEST_INVITE_TOKEN = '550e8400-e29b-41d4-a716-446655440000'

const mockInvite = {
  id: '11111111-1111-1111-1111-111111111111',
  orgId: TEST_ORG_ID,
  orgRole: 'MEMBER' as const,
  email: 'invited@example.com',
  token: TEST_INVITE_TOKEN,
  projectId: null,
  projectRole: null,
  expiresAt: new Date(Date.now() + 86400000),
  org: { name: 'Test Org' },
  project: null,
}

describe('Invites routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildTestApp(async (fastify) => {
      await fastify.register(invitesRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /invites/:token', () => {
    it('returns invite data for a valid token (public route)', async () => {
      vi.mocked(invitesDb.getInviteByToken).mockResolvedValue(mockInvite as any)

      const response = await app.inject({
        method: 'GET',
        url: `/invites/${TEST_INVITE_TOKEN}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({
        orgId: TEST_ORG_ID,
        orgRole: 'MEMBER',
        orgName: 'Test Org',
        projectId: null,
        projectName: null,
        projectRole: null,
      })
      expect(vi.mocked(invitesDb.getInviteByToken)).toHaveBeenCalledWith(
        TEST_INVITE_TOKEN,
        expect.anything()
      )
    })

    it('returns 404 when invite is not found', async () => {
      vi.mocked(invitesDb.getInviteByToken).mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: `/invites/${TEST_INVITE_TOKEN}`,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /invites/:token/accept', () => {
    it('accepts an invite and returns 200 with message', async () => {
      vi.mocked(invitesDb.getInviteByToken).mockResolvedValue(mockInvite as any)
      vi.mocked(invitesDb.acceptInvite).mockResolvedValue({ id: mockInvite.id } as any)

      const response = await app.inject({
        method: 'POST',
        url: `/invites/${TEST_INVITE_TOKEN}/accept`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toEqual({ message: 'Invite accepted' })
      expect(vi.mocked(invitesDb.acceptInvite)).toHaveBeenCalledWith(
        TEST_INVITE_TOKEN,
        'test-user-id',
        'test@example.com',
        expect.anything()
      )
    })

    it('returns 409 when invite is expired or already used', async () => {
      vi.mocked(invitesDb.getInviteByToken).mockResolvedValue(mockInvite as any)
      vi.mocked(invitesDb.acceptInvite).mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: `/invites/${TEST_INVITE_TOKEN}/accept`,
      })

      expect(response.statusCode).toBe(409)
    })
  })
})
