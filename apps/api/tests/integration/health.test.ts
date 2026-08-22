import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'

import healthRoutes from '../../src/routes/health.ts'
import { buildTestApp } from '../helpers/build-app.ts'

describe('Health routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await buildTestApp(async (fastify) => {
      await fastify.register(healthRoutes)
    })
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns 200 with status ok and uptime', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.status).toBe('ok')
    expect(typeof body.uptime).toBe('number')
  })
})