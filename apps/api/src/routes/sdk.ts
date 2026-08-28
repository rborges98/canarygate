import type { FastifyInstance } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  flags,
  flagEnvironments,
  environments
} from '@canarygate/database/schema'
import { hashApiKey, findProjectByApiKey } from '../db/projects.ts'
import { subscribe, unsubscribe } from '../sse/flag-emitter.ts'

const SDK_FLAGS_RATE_LIMIT = { max: 60, timeWindow: '1 minute' }
const SDK_STREAM_RATE_LIMIT = { max: 30, timeWindow: '1 minute' }
const SSE_RETRY_MS = 5_000
const SSE_MAX_CONNECTION_LIFETIME_MS = 1000 * 60 * 60 * 24

export function resolveSdkStreamAuthentication(input: {
  headerApiKey?: string
  queryApiKey?: string
}):
  | {
      apiKey: string
    }
  | {
      statusCode: 400 | 401
      message: string
    } {
  if (input.queryApiKey?.trim()) {
    return {
      statusCode: 400 as const,
      message: 'Send the API key in the X-Api-Key header'
    }
  }

  const apiKey = input.headerApiKey?.trim()
  if (!apiKey) {
    return {
      statusCode: 401 as const,
      message: 'Missing X-Api-Key header'
    }
  }

  return { apiKey }
}

type SdkProjectRow = NonNullable<
  Awaited<ReturnType<typeof findProjectByApiKey>>
>
type SdkEnvironmentRow = NonNullable<
  Awaited<ReturnType<typeof resolveEnvironment>>
>

type ResolvedSdkProject =
  | { status: 'ok'; project: SdkProjectRow; env: SdkEnvironmentRow }
  | { status: 'not-found' }
  | { status: 'disabled' }

async function resolveEnvironment(
  projectId: string,
  environmentSlug?: string
) {
  if (environmentSlug) {
    return db.query.environments.findFirst({
      where: and(
        eq(environments.projectId, projectId),
        eq(environments.slug, environmentSlug)
      )
    })
  }

  const envs = await db.query.environments.findMany({
    where: eq(environments.projectId, projectId)
  })
  return envs.find((e) => e.isDefault) ?? envs[0] ?? null
}

async function resolveProjectAndEnvironment(
  apiKey: string,
  environmentSlug?: string
): Promise<ResolvedSdkProject> {
  const project = await findProjectByApiKey(apiKey)
  if (!project) {
    return { status: 'not-found' }
  }

  if (!project.active) {
    return { status: 'disabled' }
  }

  const env = await resolveEnvironment(project.id, environmentSlug)
  if (!env) {
    return { status: 'not-found' }
  }

  return { status: 'ok', project, env }
}

export default async function sdkRoutes(app: FastifyInstance) {
  // Header: X-Api-Key: <project api key>
  // Header: X-Environment: <environment slug> (optional, defaults to production)
  app.get('/flags', {
    config: {
      rateLimit: SDK_FLAGS_RATE_LIMIT,
      cors: { origin: true, credentials: false }
    },
    schema: {
      tags: ['sdk'],
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          environment: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
          }
        }
      }
    },
    handler: async (request, reply) => {
      const apiKey = (
        request.headers['x-api-key'] as string | undefined
      )?.trim()
      if (!apiKey) {
        return reply.status(401).send({ message: 'Missing X-Api-Key header' })
      }

      const environmentSlug = (
        (request.headers['x-environment'] as string | undefined) ??
        (request.query as { environment?: string }).environment
      )?.trim()

      const resolved = await resolveProjectAndEnvironment(
        apiKey,
        environmentSlug
      )
      if (resolved.status === 'disabled') {
        return reply.status(403).send({ message: 'Project is disabled' })
      }

      if (resolved.status !== 'ok') {
        return reply
          .status(404)
          .send({ message: 'Project or environment not found' })
      }

      const { project, env } = resolved

      const rows = await db
        .select({
          key: flags.key,
          type: flags.type,
          enabled: flagEnvironments.enabled,
          rolloutPercent: flagEnvironments.rolloutPercent,
          updatedAt: flagEnvironments.updatedAt
        })
        .from(flags)
        .innerJoin(
          flagEnvironments,
          and(
            eq(flagEnvironments.flagId, flags.id),
            eq(flagEnvironments.environmentId, env.id)
          )
        )
        .where(eq(flags.projectId, project.id))

      return {
        projectId: project.id,
        environment: env.slug,
        flags: rows.map((row) => ({
          key: row.key,
          type: row.type,
          enabled: row.enabled,
          rolloutPercent: row.rolloutPercent,
          updatedAt: row.updatedAt.toISOString()
        }))
      }
    }
  })

  app.get('/stream', {
    config: {
      rateLimit: SDK_STREAM_RATE_LIMIT,
      cors: { origin: true, credentials: false }
    },
    schema: {
      tags: ['sdk'],
      querystring: {
        type: 'object',
        properties: {
          apiKey: { type: 'string' },
          environment: {
            type: 'string',
            minLength: 1,
            maxLength: 50,
            pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
          }
        }
      }
    },
    handler: async (request, reply) => {
      const headers = request.headers

      // TRAVA DE SEGURANÇA: Rejeita requisições originárias de navegadores
      const isBrowserRequest = headers['sec-fetch-dest'] || headers['origin']

      if (isBrowserRequest) {
        return reply.status(403).send({
          error: 'Forbidden',
          message:
            'Real-time streams (SSE) are not allowed from browser environments to protect system architecture.'
        })
      }

      const query = request.query as { apiKey?: string; environment?: string }
      const auth = resolveSdkStreamAuthentication({
        headerApiKey: request.headers['x-api-key'] as string | undefined,
        queryApiKey: query.apiKey
      })
      if ('message' in auth) {
        return reply.status(auth.statusCode).send({ message: auth.message })
      }

      const { apiKey } = auth

      const environmentSlug = (
        (request.headers['x-environment'] as string | undefined) ??
        query.environment
      )?.trim()

      let resolved: Awaited<ReturnType<typeof resolveProjectAndEnvironment>>
      try {
        resolved = await resolveProjectAndEnvironment(apiKey, environmentSlug)
      } catch (err) {
        app.log.error(err, 'SSE: failed to look up project')
        return reply.status(500).send({ message: 'Internal server error' })
      }

      if (resolved.status === 'disabled') {
        return reply.status(403).send({ message: 'Project is disabled' })
      }

      if (resolved.status !== 'ok') {
        return reply
          .status(404)
          .send({ message: 'Project or environment not found' })
      }

      const { project, env } = resolved
      const channelKey = `${project.id}:${env.id}`
      const raw = reply.raw

      const subscription = subscribe(channelKey, raw, {
        ip: request.ip,
        apiKey: hashApiKey(apiKey)
      })

      if (!subscription.ok) {
        reply.header('retry-after', '60')
        return reply.status(429).send({ message: subscription.message })
      }

      reply.hijack()

      raw.setHeader('Access-Control-Allow-Origin', '*')
      raw.setHeader('Content-Type', 'text/event-stream')
      raw.setHeader('Cache-Control', 'no-cache')
      raw.setHeader('Connection', 'keep-alive')
      raw.setHeader('X-Accel-Buffering', 'no')
      raw.flushHeaders()

      let cleanedUp = false
      const cleanup = () => {
        if (cleanedUp) {
          return
        }

        cleanedUp = true
        clearInterval(heartbeat)
        clearTimeout(connectionLifetimeTimeout)
        unsubscribe(channelKey, raw)

        if (!raw.destroyed && !raw.writableEnded) {
          raw.end()
        }
      }

      raw.write(`retry: ${SSE_RETRY_MS}\n\n`)
      raw.write('event: connected\ndata: {}\n\n')

      const heartbeat = setInterval(() => {
        try {
          raw.write(': heartbeat\n\n')
        } catch {
          cleanup()
        }
      }, 30_000)

      const connectionLifetimeTimeout = setTimeout(() => {
        try {
          raw.write(
            'event: connection-closing\ndata: {"reason":"max-lifetime-exceeded"}\n\n'
          )
        } catch {
          // Ignore write errors during shutdown.
        }

        cleanup()
      }, SSE_MAX_CONNECTION_LIFETIME_MS)

      request.raw.on('close', cleanup)
      request.raw.on('error', cleanup)
      request.raw.on('aborted', cleanup)
    }
  })
}
