import Fastify from 'fastify'
import cors from '@fastify/cors'
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

export function buildApp() {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === 'production'
        ? true
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname'
              }
            }
          }
  })

  app.register(cors, {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true
  })

  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  if (process.env.NODE_ENV !== 'production') {
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
    request.log.error(error)
    reply.status(error.statusCode ?? 500).send({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal Server Error'
          : error.message
    })
  })

  // Better Auth handler — captura tudo sob /api/auth/*
  app.all('/api/auth/*', async (request, reply) => {
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
