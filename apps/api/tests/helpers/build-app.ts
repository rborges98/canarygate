import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'

export const TEST_USER_ID = 'test-user-id'
export const TEST_USER_EMAIL = 'test@example.com'
export const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'
export const TEST_PROJECT_ID = '00000000-0000-0000-0000-000000000002'
export const TEST_FLAG_ID = '00000000-0000-0000-0000-000000000003'
export const TEST_ENV_ID = '00000000-0000-0000-0000-000000000004'

export async function buildTestApp(
  routes: (app: FastifyInstance) => Promise<void>
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  app.decorateRequest('userId', TEST_USER_ID)
  app.decorateRequest('userEmail', TEST_USER_EMAIL)
  app.decorateRequest('orgRole', 'OWNER')
  app.decorateRequest('projectRole', null)

  await app.register(routes)
  await app.ready()

  return app
}
