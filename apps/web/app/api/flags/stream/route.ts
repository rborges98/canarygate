import type { NextRequest } from 'next/server'
import {
  createRedisConnection,
  type RedisConnection
} from '@canarygate/redis'
import {
  FLAG_EVENTS_CHANNEL_PATTERN,
  parseFlagEventEnvelope
} from '@canarygate/messaging-utils'
import { logServerError, logServerInfo } from '@canarygate/logger'
import { getSession } from '@/shared/auth'
import { getOrgs } from '@/server/orgs/queries'
import { getAllProjects } from '@/server/projects/queries'
import { invalidateProjectFlags } from '@/server/cache/flag-invalidation'

export const dynamic = 'force-dynamic'

const MAX_CONNECTIONS_PER_USER = 5
const HEARTBEAT_INTERVAL_MS = 25_000
const MEMBERSHIP_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000
const HEARTBEAT = new TextEncoder().encode(': ping\n\n')

type ActiveStream = {
  projectIds: Set<string>
  controller: ReadableStreamDefaultController<Uint8Array>
}

const activeConnectionsByUser = new Map<string, number>()
const activeStreams = new Set<ActiveStream>()

let flagEventSubscriber: RedisConnection | null = null
let subscribeStarted = false
let subscribeRequested = false

function getFlagEventSubscriber() {
  if (flagEventSubscriber) {
    return flagEventSubscriber
  }

  flagEventSubscriber = createRedisConnection('web flag event subscriber', {
    connectionName: 'web-flag-event-subscriber',
    enableReadyCheck: false
  })

  flagEventSubscriber.on('ready', () => {
    if (subscribeStarted || subscribeRequested) {
      return
    }

    subscribeRequested = true
    flagEventSubscriber!.psubscribe(FLAG_EVENTS_CHANNEL_PATTERN)
      .then(() => {
        subscribeStarted = true
        logServerInfo(
          'Flag event subscriber subscribed to Redis channel pattern'
        )
      })
      .catch((error) => {
        subscribeRequested = false
        logServerError(
          'Failed to subscribe to Redis flag event channel pattern',
          error
        )
      })
  })

  flagEventSubscriber.on('error', (error) => {
    logServerError('Flag event subscriber Redis connection error', error)
  })

  flagEventSubscriber.on('pmessage', (_pattern, _channel, message) => {
    try {
      const envelope = parseFlagEventEnvelope(message)

      for (const stream of activeStreams) {
        if (!stream.projectIds.has(envelope.projectId)) {
          continue
        }

        stream.controller.enqueue(
          new TextEncoder().encode(
            `event: ${envelope.event}\ndata: ${JSON.stringify(envelope.data)}\n\n`
          )
        )
      }

      try {
        invalidateProjectFlags(envelope.projectId)
      } catch (error) {
        logServerError('Failed to invalidate project flag cache', error)
      }
    } catch (error) {
      logServerError('Failed to process flag event from Redis', error)
    }
  })

  return flagEventSubscriber
}

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const connectionCount = activeConnectionsByUser.get(userId) ?? 0

  if (connectionCount >= MAX_CONNECTIONS_PER_USER) {
    return new Response('Too Many Connections', { status: 429 })
  }

  let accessibleProjectIds: Set<string>

  try {
    const orgs = await getOrgs()
    accessibleProjectIds = new Set<string>()

    for (const org of orgs) {
      const projects = await getAllProjects(org.orgId)

      for (const project of projects) {
        accessibleProjectIds.add(project.projectId)
      }
    }
  } catch (error) {
    logServerError('Failed to resolve accessible project ids', error)
    return new Response('Internal Server Error', { status: 500 })
  }

  activeConnectionsByUser.set(userId, connectionCount + 1)
  getFlagEventSubscriber()

  let cleaned = false
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let revalidateTimer: ReturnType<typeof setInterval> | null = null
  let cleanup: (() => void) | undefined

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const streamEntry: ActiveStream = {
        projectIds: accessibleProjectIds,
        controller
      }

      activeStreams.add(streamEntry)

      heartbeatTimer = setInterval(() => {
        if (cleaned) {
          return
        }

        try {
          controller.enqueue(HEARTBEAT)
        } catch (error) {
          logServerError('Failed to enqueue flag stream heartbeat', error)
        }
      }, HEARTBEAT_INTERVAL_MS)

      revalidateTimer = setInterval(async () => {
        if (cleaned) {
          return
        }

        try {
          const orgs = await getOrgs()
          const nextProjectIds = new Set<string>()

          for (const org of orgs) {
            const projects = await getAllProjects(org.orgId)

            for (const project of projects) {
              nextProjectIds.add(project.projectId)
            }
          }

          streamEntry.projectIds = nextProjectIds
        } catch (error) {
          logServerError(
            'Failed to revalidate accessible project ids for flag stream',
            error
          )
        }
      }, MEMBERSHIP_REVALIDATE_INTERVAL_MS)

      cleanup = () => {
        if (cleaned) {
          return
        }

        cleaned = true

        if (heartbeatTimer !== null) {
          clearInterval(heartbeatTimer)
          heartbeatTimer = null
        }

        if (revalidateTimer !== null) {
          clearInterval(revalidateTimer)
          revalidateTimer = null
        }

        if (activeStreams.has(streamEntry)) {
          activeStreams.delete(streamEntry)
        }

        const remaining = (activeConnectionsByUser.get(userId) ?? 1) - 1

        if (remaining > 0) {
          activeConnectionsByUser.set(userId, remaining)
        } else {
          activeConnectionsByUser.delete(userId)
        }

        try {
          controller.close()
        } catch (error) {
          logServerError('Failed to close flag stream controller', error)
        }
      }

      request.signal.addEventListener('abort', cleanup, { once: true })

      if (request.signal.aborted) {
        cleanup()
      }
    },
    cancel() {
      cleanup?.()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
