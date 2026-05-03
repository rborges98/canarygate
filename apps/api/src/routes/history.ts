import type { FastifyInstance } from 'fastify'
import { requireSession } from '../plugins/require-session.ts'
import { requireProjectAdmin } from '../plugins/require-org-access.ts'
import * as historyDb from '../db/history.ts'
import * as environmentsDb from '../db/environments.ts'

export default async function historyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireSession)
  app.addHook('onRoute', (route) => {
    route.schema = { tags: ['history'], ...(route.schema ?? {}) }
  })

  app.get<{
    Params: { orgId: string; projectId: string }
    Querystring: {
      flagId?: string
      environmentSlug?: string
      limit?: number
      offset?: number
      action?: string
    }
  }>('/orgs/:orgId/projects/:projectId/history', {
    preHandler: requireProjectAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['orgId', 'projectId'],
        properties: {
          orgId: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          flagId: { type: 'string', format: 'uuid' },
          environmentSlug: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
          },
          limit: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          offset: { type: 'integer', default: 0, minimum: 0 },
          action: {
            type: 'string',
            enum: [
              'created',
              'updated',
              'toggled',
              'rollout_updated',
              'deleted'
            ]
          }
        }
      }
    },
    handler: async (request) => {
      const { projectId } = request.params
      const {
        flagId,
        environmentSlug,
        limit = 20,
        offset = 0,
        action
      } = request.query

      let environmentId: string | undefined
      if (environmentSlug) {
        const env = await environmentsDb.getEnvironmentBySlug(
          projectId,
          environmentSlug
        )
        environmentId = env?.id
      }

      return historyDb.listHistory(projectId, {
        flagId,
        environmentId,
        limit,
        offset,
        action: action as Parameters<typeof historyDb.listHistory>[1]['action']
      })
    }
  })
}
