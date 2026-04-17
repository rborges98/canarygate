import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { projects, flags } from '@canarygate/database/schema'

export default async function sdkRoutes(app: FastifyInstance) {
  app.addHook('onRoute', (route) => {
    route.schema = {
      tags: ['sdk'],
      security: [{ apiKey: [] }],
      ...(route.schema ?? {})
    }
  })

  // GET /sdk/flags
  // Header: X-Api-Key: <project api key>
  app.get('/sdk/flags', {
    handler: async (request, reply) => {
      const apiKey = (
        request.headers['x-api-key'] as string | undefined
      )?.trim()
      if (!apiKey)
        return reply.status(401).send({ message: 'Missing X-Api-Key header' })

      const project = await db.query.projects.findFirst({
        where: eq(projects.apiKey, apiKey)
      })
      if (!project)
        return reply
          .status(404)
          .send({ message: 'Project not found for the provided API key' })

      const projectFlags = await db.query.flags.findMany({
        where: eq(flags.projectId, project.id)
      })

      return {
        projectId: project.id,
        flags: projectFlags.map((f) => ({
          key: f.key,
          enabled: f.enabled,
          rolloutPercent: f.rolloutPercent
        }))
      }
    }
  })
}
