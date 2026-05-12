import { Queue } from 'bullmq'
import type { FastifyBaseLogger } from 'fastify'
import { createRedisConnection } from '@canarygate/redis'
import {
  AUTO_ROLLOUT_JOB_NAME,
  AUTO_ROLLOUT_QUEUE_NAME,
  FLAG_JOB_ATTEMPTS,
  FLAG_JOB_BACKOFF_DELAY_MS,
  SCHEDULE_JOB_NAME,
  SCHEDULE_QUEUE_NAME,
  buildAutoRolloutJobId,
  buildScheduleJobId,
  type AutoRolloutJobData,
  type ScheduleJobData
} from '@canarygate/messaging-utils'

type AppLogger = Pick<FastifyBaseLogger, 'info' | 'warn' | 'error'>

const queueConnection = createRedisConnection('api flag queues', {
  connectionName: 'api-flag-queues',
  enableOfflineQueue: false
})

let scheduleQueue: Queue<ScheduleJobData> | null = null
let autoRolloutQueue: Queue<AutoRolloutJobData> | null = null
let queueListenersAttached = false
let queueConnectionReadyPromise: Promise<void> | null = null

function attachQueueConnectionListeners(log: AppLogger) {
  if (queueListenersAttached) {
    return
  }

  queueListenersAttached = true

  queueConnection.on('ready', () => {
    log.info({ scope: 'api.flagQueues' }, 'Flag queues connected to Redis')
  })

  queueConnection.on('error', (err) => {
    log.error(
      { err, scope: 'api.flagQueues' },
      'Flag queues Redis connection failed'
    )
  })

  queueConnection.on('end', () => {
    log.warn(
      { scope: 'api.flagQueues' },
      'Flag queues Redis connection closed'
    )
  })
}

function getScheduleQueue() {
  if (!scheduleQueue) {
    scheduleQueue = new Queue<ScheduleJobData>(SCHEDULE_QUEUE_NAME, {
      connection: queueConnection
    })
  }

  return scheduleQueue
}

function getAutoRolloutQueue() {
  if (!autoRolloutQueue) {
    autoRolloutQueue = new Queue<AutoRolloutJobData>(AUTO_ROLLOUT_QUEUE_NAME, {
      connection: queueConnection
    })
  }

  return autoRolloutQueue
}

export function connectFlagQueues(log: AppLogger) {
  attachQueueConnectionListeners(log)

  if (!queueConnectionReadyPromise) {
    queueConnectionReadyPromise = Promise.all([
      getScheduleQueue().waitUntilReady(),
      getAutoRolloutQueue().waitUntilReady()
    ])
      .then(() => undefined)
      .catch((err) => {
        queueConnectionReadyPromise = null
        log.error(
          { err, scope: 'api.flagQueues' },
          'Failed to initialize BullMQ queues'
        )
      })
  }

  return queueConnectionReadyPromise
}

function buildJobOptions(jobId: string) {
  return {
    attempts: FLAG_JOB_ATTEMPTS,
    backoff: {
      type: 'exponential' as const,
      delay: FLAG_JOB_BACKOFF_DELAY_MS
    },
    jobId,
    removeOnComplete: 1_000,
    removeOnFail: false
  }
}

export async function enqueueScheduleJob(
  data: ScheduleJobData,
  log?: AppLogger
) {
  try {
    return await getScheduleQueue().add(
      SCHEDULE_JOB_NAME,
      data,
      buildJobOptions(buildScheduleJobId(data))
    )
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'api.flagQueues.enqueueScheduleJob',
        flagEnvironmentId: data.flagEnvironmentId,
        projectId: data.projectId,
        environmentSlug: data.environmentSlug,
        dueAt: data.dueAt
      },
      'Failed to enqueue schedule job'
    )
    throw error
  }
}

export async function enqueueAutoRolloutJob(
  data: AutoRolloutJobData,
  log?: AppLogger
) {
  try {
    return await getAutoRolloutQueue().add(
      AUTO_ROLLOUT_JOB_NAME,
      data,
      buildJobOptions(buildAutoRolloutJobId(data))
    )
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'api.flagQueues.enqueueAutoRolloutJob',
        flagEnvironmentId: data.flagEnvironmentId,
        projectId: data.projectId,
        environmentSlug: data.environmentSlug,
        dueAt: data.dueAt
      },
      'Failed to enqueue auto-rollout job'
    )
    throw error
  }
}

export async function closeFlagQueues() {
  await Promise.allSettled([
    scheduleQueue?.close(),
    autoRolloutQueue?.close(),
    queueConnection.quit()
  ])

  scheduleQueue = null
  autoRolloutQueue = null
  queueConnectionReadyPromise = null
}
