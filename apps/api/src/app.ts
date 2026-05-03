import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
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
import { getRequiredUrl, IS_PRODUCTION } from './utils/env.ts'
import { fastifyLogger } from './utils/logger.ts'

const AUTH_RATE_LIMIT = { max: 30, timeWindow: '1 minute' }

export function buildApp() {
  const webUrl = getRequiredUrl('WEB_URL', 'http://localhost:3000', 'api app')

  const app = Fastify({
    logger: fastifyLogger
  })

  app.register(cors, {
    origin: webUrl,
    credentials: true
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

  if (!IS_PRODUCTION) {
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
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      }
    })
  }

  app.setErrorHandler((error, request, reply) => {
    const appError = error as { statusCode?: number }
    const statusCode =
      typeof appError.statusCode === 'number' ? appError.statusCode : 500
    const message =
      !IS_PRODUCTION && error instanceof Error
        ? error.message
        : 'Internal Server Error'

    request.log.error(
      {
        statusCode,
        route: request.routeOptions.url,
        method: request.method,
        errorName: error.name,
        errorMessage: error.message
      },
      'Request failed'
    )
    reply.status(statusCode).send({ message })
  })

  // Better Auth handler — captura tudo sob /api/auth/*
  app.all('/api/auth/*', {
    config: { rateLimit: AUTH_RATE_LIMIT },
    handler: async (request, reply) => {
      const { auth } = await import('./auth.ts')
      const url = `${request.protocol}://${request.hostname}:${request.port ?? 3001}${request.url}`
      const webRequest = new Request(url, {
        method: request.method,
        headers: request.headers as HeadersInit,
        body: ['GET', 'HEAD'].includes(request.method)
          ? undefined
          : JSON.stringify(request.body)
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
  app.register(sdkRoutes)

  return app
}
