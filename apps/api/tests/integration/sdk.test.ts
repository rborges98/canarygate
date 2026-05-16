import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

vi.mock('@canarygate/database/client', () => ({
  db: {
    query: {
      projects: { findFirst: vi.fn() },
      environments: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  },
}))

vi.mock('@canarygate/database/schema', () => ({
  projects: {},
  flags: {},
  flagEnvironments: {},
  environments: {},
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
}))

vi.mock('../../src/sse/flag-emitter.ts', () => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  emitFlagEvent: vi.fn(),
}))

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { db } from '@canarygate/database/client'
import { resolveSdkStreamAuthentication } from '../../src/routes/sdk.ts'
import sdkRoutes from '../../src/routes/sdk.ts'
import { buildTestApp, TEST_PROJECT_ID, TEST_ENV_ID } from '../helpers/build-app.ts'

const mockProject = {
  id: TEST_PROJECT_ID,
  orgId: '00000000-0000-0000-0000-000000000001',
  name: 'Test Project',
  slug: 'test-project',
  apiKey: 'cg_live_abc123',
  active: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const mockEnv = {
  id: TEST_ENV_ID,
  projectId: TEST_PROJECT_ID,
  name: 'Production',
  slug: 'production',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('SDK routes', () => {
  describe('resolveSdkStreamAuthentication (unit)', () => {
    it('returns 401 when no API key is provided', () => {
      const result = resolveSdkStreamAuthentication({})
      expect(result).toMatchObject({ statusCode: 401 })
    })

    it('returns 400 when API key is sent as query param', () => {
      const result = resolveSdkStreamAuthentication({ queryApiKey: 'some-key' })
      expect(result).toMatchObject({ statusCode: 400 })
    })

    it('returns apiKey when sent in header', () => {
      const result = resolveSdkStreamAuthentication({ headerApiKey: 'cg_live_abc123' })
      expect(result).toEqual({ apiKey: 'cg_live_abc123' })
    })
  })

  describe('GET /sdk/flags', () => {
    let app: FastifyInstance

    beforeEach(async () => {
      vi.clearAllMocks()
      ;(db.query.projects.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      ;(db.query.environments.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
      ;(db.select as ReturnType<typeof vi.fn>).mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
      })
      app = await buildTestApp(async (fastify) => {
        await fastify.register(sdkRoutes)
      })
    })

    afterEach(async () => {
      await app.close()
    })

    it('returns 401 when X-Api-Key header is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/sdk/flags',
      })

      expect(response.statusCode).toBe(401)
    })

    it('returns 404 when project is not found', async () => {
      ;(db.query.projects.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/sdk/flags',
        headers: { 'x-api-key': 'invalid-key' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 200 with project flags when API key is valid', async () => {
      ;(db.query.projects.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockProject)
      ;(db.query.environments.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockEnv])

      const response = await app.inject({
        method: 'GET',
        url: '/sdk/flags',
        headers: { 'x-api-key': 'cg_live_abc123' },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({
        projectId: TEST_PROJECT_ID,
        environment: 'production',
        flags: [],
      })
    })
  })
})
