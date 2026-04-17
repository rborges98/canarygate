import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import { requireOrgMember } from '../plugins/require-org-access.ts'
import * as historyDb from '../db/history.ts'

export default async function historyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('preHandler', requireOrgMember)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['history'], ...(route.schema ?? {}) }
  })

  app.get<{
    Params: { orgId: string; projectId: string }
    Querystring: { flagId?: string; limit?: number; offset?: number }
  }>('/orgs/:orgId/projects/:projectId/history', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          flagId: { type: 'string' },
          limit: { type: 'number', default: 20, maximum: 100 },
          offset: { type: 'number', default: 0 }
        }
      }
    },
    handler: async (request) => {
      const { projectId } = request.params
      const { flagId, limit = 20, offset = 0 } = request.query
      return historyDb.listHistory(projectId, { flagId, limit, offset })
    }
  })
}
