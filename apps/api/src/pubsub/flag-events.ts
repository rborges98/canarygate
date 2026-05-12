import type { FastifyBaseLogger } from 'fastify'
import { createRedisConnection } from '@canarygate/redis'
import {
  FLAG_EVENTS_CHANNEL_PATTERN,
  buildFlagEventsChannel,
  buildLocalFlagStreamKey,
  parseFlagEventEnvelope,
  serializeFlagEventEnvelope,
  type FlagDeletedEventData,
  type FlagEventName,
  type FlagUpsertEventData
} from '@canarygate/messaging-utils'
import { emitFlagEvent } from '../sse/flag-emitter.ts'

type AppLogger = Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>
type FlagEventData = FlagUpsertEventData | FlagDeletedEventData

const publisher = createRedisConnection('api flag event publisher', {
  connectionName: 'api-flag-event-publisher',
  enableOfflineQueue: false
})
const subscriber = createRedisConnection('api flag event subscriber', {
  connectionName: 'api-flag-event-subscriber',
  enableReadyCheck: false
})

let listenersAttached = false
let subscriberStarted = false
let subscriberStartRequested = false

function emitLocalFlagEvent(
  projectId: string,
  environmentId: string,
  event: FlagEventName,
  data: FlagEventData
) {
  emitFlagEvent(buildLocalFlagStreamKey(projectId, environmentId), event, data)
}

function serializePublishedFlagEvent(
  projectId: string,
  environmentId: string,
  event: FlagEventName,
  data: FlagEventData
) {
  if (event === 'flag-deleted') {
    return serializeFlagEventEnvelope({
      projectId,
      environmentId,
      event,
      data: data as FlagDeletedEventData
    })
  }

  return serializeFlagEventEnvelope({
    projectId,
    environmentId,
    event,
    data: data as FlagUpsertEventData
  })
}

function attachListeners(log: AppLogger) {
  if (listenersAttached) {
    return
  }

  listenersAttached = true

  publisher.on('ready', () => {
    log.info(
      { scope: 'api.flagEvents.publisher' },
      'Flag event publisher connected to Redis'
    )
  })

  publisher.on('error', (err) => {
    log.error(
      { err, scope: 'api.flagEvents.publisher' },
      'Flag event publisher Redis connection failed'
    )
  })

  subscriber.on('ready', () => {
    subscriberStarted = true
    log.info(
      { scope: 'api.flagEvents.subscriber' },
      'Flag event subscriber connected to Redis'
    )
  })

  subscriber.on('error', (err) => {
    log.error(
      { err, scope: 'api.flagEvents.subscriber' },
      'Flag event subscriber Redis connection failed'
    )
  })

  subscriber.on('end', () => {
    subscriberStarted = false
    log.warn(
      { scope: 'api.flagEvents.subscriber' },
      'Flag event subscriber Redis connection closed'
    )
  })

  subscriber.on('pmessage', (_pattern, _channel, message) => {
    try {
      const envelope = parseFlagEventEnvelope(message)
      emitLocalFlagEvent(
        envelope.projectId,
        envelope.environmentId,
        envelope.event,
        envelope.data
      )
    } catch (error) {
      log.error(
        { err: error, scope: 'api.flagEvents.subscriber' },
        'Failed to process a flag event from Redis'
      )
    }
  })
}

export function startFlagEventsSubscriber(log: AppLogger) {
  attachListeners(log)

  if (subscriberStartRequested) {
    return
  }

  subscriberStartRequested = true
  void subscriber.psubscribe(FLAG_EVENTS_CHANNEL_PATTERN).catch((error) => {
    subscriberStartRequested = false
    subscriberStarted = false
    log.error(
      { err: error, scope: 'api.flagEvents.subscriber' },
      'Failed to subscribe to Redis flag event channels'
    )
  })
}

export async function publishFlagEvent(
  projectId: string,
  environmentId: string,
  event: FlagEventName,
  data: FlagEventData,
  log?: AppLogger
) {
  try {
    await publisher.publish(
      buildFlagEventsChannel(projectId, environmentId),
      serializePublishedFlagEvent(projectId, environmentId, event, data)
    )

    if (!subscriberStarted) {
      emitLocalFlagEvent(projectId, environmentId, event, data)
    }
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'api.flagEvents.publisher',
        projectId,
        environmentId,
        event
      },
      'Failed to publish flag event to Redis, falling back to local SSE'
    )

    emitLocalFlagEvent(projectId, environmentId, event, data)
  }
}

export async function stopFlagEventsPubSub() {
  await Promise.allSettled([publisher.quit(), subscriber.quit()])
  subscriberStarted = false
  subscriberStartRequested = false
}
