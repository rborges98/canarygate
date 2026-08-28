import Fastify, { LogController } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import compress from '@fastify/compress'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import './types.ts'

import orgsRoutes from './routes/orgs.ts'
import membersRoutes from './routes/members.ts'
import projectsRoutes from './routes/projects.ts'
import flagsRoutes from './routes/flags.ts'
import historyRoutes from './routes/history.ts'
import invitesRoutes from './routes/invites.ts'
import sdkRoutes from './routes/sdk.ts'
import healthRoutes from './routes/health.ts'
import { fastifyLogger } from '@canarygate/logger'
import { getRequiredUrl, IS_PRODUCTION } from './utils/env.ts'
import { webhookRoutes } from './routes/webhook'

const AUTH_RATE_LIMIT = { max: 30, timeWindow: '1 minute' }

const FORWARDED_AUTH_HEADERS = new Set([
  'host',
  'origin',
  'cookie',
  'content-type',
  'accept',
  'authorization',
  'user-agent'
])

function extractHostname(hostHeader: string) {
  const value = hostHeader.includes('://') ? hostHeader : `http://${hostHeader}`
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function buildApp() {
  const webUrl = getRequiredUrl('WEB_URL', 'http://localhost:3000', 'api app')
  const apiUrl = getRequiredUrl('API_URL', 'http://localhost:3001', 'api app')
  const allowedCorsOrigins = [
    webUrl,
    ...(process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  ]

  const allowedAuthHosts = new Set<string>()
  for (const origin of [webUrl, apiUrl]) {
    const hostname = extractHostname(origin)
    if (hostname) {
      allowedAuthHosts.add(hostname)
    }
  }

  const app = Fastify({
    logger: fastifyLogger,
    logController: new LogController({ disableRequestLogging: true }),
    trustProxy: true
  })

  app.register(cors, {
    delegator: (request, callback) => {
      const isSdkRoute = request.url.split('?')[0].startsWith('/sdk')
      callback(null, {
        origin: isSdkRoute ? true : IS_PRODUCTION ? allowedCorsOrigins : true,
        credentials: !isSdkRoute
      })
    }
  })

  app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: IS_PRODUCTION
      ? {
          maxAge: 15_552_000,
          includeSubDomains: true
        }
      : false,
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' }
  })

  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  app.register(compress, {
    threshold: 1024
  })

  app.register(swagger, {
    openapi: {
      info: {
        title: 'CanaryGate API',
        description: 'API para gerenciamento de feature flags',
        version: '0.1.0'
      },
      tags: [
        { name: 'orgs', description: 'Organizações' },
        { name: 'members', description: 'Membros de organizações' },
        { name: 'projects', description: 'Projetos' },
        { name: 'flags', description: 'Feature flags' },
        { name: 'history', description: 'Histórico de alterações' },
        { name: 'invites', description: 'Convites' },
        { name: 'sdk', description: 'SDK público' }
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header'
          }
        }
      }
    }
  })

  app.register(swaggerUi, {
    routePrefix: '/swagger',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  })

  app.setErrorHandler((error, request, reply) => {
    const appError = error as { statusCode?: number }
    const statusCode =
      typeof appError.statusCode === 'number' ? appError.statusCode : 500
    const errorName = error instanceof Error ? error.name : 'UnknownError'
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error payload'
    const message =
      !IS_PRODUCTION && error instanceof Error
        ? error.message
        : 'Internal Server Error'

    request.log.error(
      {
        statusCode,
        route: request.routeOptions.url,
        method: request.method,
        errorName,
        errorMessage
      },
      'Request failed'
    )
    reply.status(statusCode).send({ message })
  })

  app.all('/api/auth/*', {
    config: { rateLimit: AUTH_RATE_LIMIT },
    handler: async (request, reply) => {
      const { auth } = await import('./auth.ts')

      const hostHeader = request.headers.host
      const hostname =
        typeof hostHeader === 'string' ? extractHostname(hostHeader) : null
      if (!hostname || !allowedAuthHosts.has(hostname)) {
        request.log.error(
          {
            scope: 'route.auth.proxy',
            host: hostHeader ?? null,
            url: request.url,
            ip: request.ip
          },
          'Rejected auth request from unauthorized host'
        )
        return reply.status(403).send({ message: 'Forbidden' })
      }

      const body =
        request.method === 'GET' || request.method === 'HEAD'
          ? undefined
          : JSON.stringify(request.body)

      const forwardedHeaders: Record<string, string> = {}
      for (const [name, value] of Object.entries(request.headers)) {
        if (value === undefined) {
          continue
        }

        const lowerName = name.toLowerCase()
        if (!FORWARDED_AUTH_HEADERS.has(lowerName)) {
          continue
        }

        forwardedHeaders[name] = Array.isArray(value)
          ? value.join(', ')
          : value
      }

      if (body !== undefined) {
        forwardedHeaders['content-length'] = String(Buffer.byteLength(body))
      }

      const url = `${request.protocol}://${hostHeader}${request.url}`
      const webRequest = new Request(url, {
        method: request.method,
        headers: forwardedHeaders,
        body
      })

      const response = await auth.handler(webRequest)
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      return reply.send(await response.text())
    }
  })

  app.register(orgsRoutes)
  app.register(membersRoutes)
  app.register(projectsRoutes)
  app.register(flagsRoutes)
  app.register(historyRoutes)
  app.register(invitesRoutes)
  app.register(
    async function sdkScope(sdk) {
      await sdk.register(sdkRoutes)
    },
    { prefix: '/sdk' }
  )
  app.register(healthRoutes)
  app.register(webhookRoutes)

  return app
}
