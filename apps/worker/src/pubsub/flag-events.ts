import { createRedisConnection } from '@canarygate/redis'
import {
  buildFlagEventsChannel,
  serializeFlagEventEnvelope,
  type FlagDeletedEventData,
  type FlagEventName,
  type FlagUpsertEventData
} from '@canarygate/messaging-utils'
import type { WorkerLogger } from '@canarygate/logger'

type FlagEventData = FlagUpsertEventData | FlagDeletedEventData

const publisher = createRedisConnection('worker flag event publisher', {
  connectionName: 'worker-flag-event-publisher',
  enableOfflineQueue: false
})

let listenersAttached = false

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

export function startFlagEventPublisher(log: WorkerLogger) {
  if (listenersAttached) {
    return
  }

  listenersAttached = true

  publisher.on('ready', () => {
    log.info(
      { scope: 'worker.flagEvents.publisher' },
      'Worker flag event publisher connected to Redis'
    )
  })

  publisher.on('error', (err) => {
    log.error(
      { err, scope: 'worker.flagEvents.publisher' },
      'Worker flag event publisher Redis connection failed'
    )
  })

  publisher.on('end', () => {
    log.warn(
      { scope: 'worker.flagEvents.publisher' },
      'Worker flag event publisher Redis connection closed'
    )
  })
}

export async function publishFlagEvent(
  projectId: string,
  environmentId: string,
  event: FlagEventName,
  data: FlagEventData,
  log: WorkerLogger
) {
  try {
    await publisher.publish(
      buildFlagEventsChannel(projectId, environmentId),
      serializePublishedFlagEvent(projectId, environmentId, event, data)
    )
  } catch (error) {
    log.error(
      {
        err: error,
        scope: 'worker.flagEvents.publisher',
        projectId,
        environmentId,
        event
      },
      'Failed to publish flag event from worker'
    )
    throw error
  }
}

export async function stopFlagEventPublisher() {
  await publisher.quit()
}
