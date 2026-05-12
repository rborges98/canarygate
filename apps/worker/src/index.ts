import { Worker } from 'bullmq'
import { createRedisConnection } from '@canarygate/redis'
import {
  AUTO_ROLLOUT_QUEUE_NAME,
  SCHEDULE_QUEUE_NAME,
  type AutoRolloutJobData,
  type ScheduleJobData
} from '@canarygate/messaging-utils'
import { workerLogger } from '@canarygate/logger'
import { processAutoRolloutJob } from './jobs/process-auto-rollout.ts'
import { processScheduleJob } from './jobs/process-schedule.ts'
import {
  startFlagEventPublisher,
  stopFlagEventPublisher
} from './pubsub/flag-events.ts'

const workerConnection = createRedisConnection('worker queues', {
  connectionName: 'worker-flag-queues',
  enableOfflineQueue: true
})

const scheduleWorker = new Worker<ScheduleJobData>(
  SCHEDULE_QUEUE_NAME,
  async (job) => processScheduleJob(job, workerLogger),
  {
    connection: workerConnection,
    concurrency: 5
  }
)

const autoRolloutWorker = new Worker<AutoRolloutJobData>(
  AUTO_ROLLOUT_QUEUE_NAME,
  async (job) => processAutoRolloutJob(job, workerLogger),
  {
    connection: workerConnection,
    concurrency: 5
  }
)

function attachWorkerObservers() {
  workerConnection.on('ready', () => {
    workerLogger.info(
      { scope: 'worker.queueConnection' },
      'Worker connected to Redis'
    )
  })

  workerConnection.on('error', (err) => {
    workerLogger.error(
      { err, scope: 'worker.queueConnection' },
      'Worker Redis connection failed'
    )
  })

  workerConnection.on('end', () => {
    workerLogger.warn(
      { scope: 'worker.queueConnection' },
      'Worker Redis connection closed'
    )
  })

  scheduleWorker.on('failed', (job, err) => {
    workerLogger.error(
      {
        err,
        scope: 'worker.scheduleWorker',
        jobId: job?.id,
        flagEnvironmentId: job?.data.flagEnvironmentId,
        attemptsMade: job?.attemptsMade
      },
      'Schedule worker job failed'
    )
  })

  autoRolloutWorker.on('failed', (job, err) => {
    workerLogger.error(
      {
        err,
        scope: 'worker.autoRolloutWorker',
        jobId: job?.id,
        flagEnvironmentId: job?.data.flagEnvironmentId,
        attemptsMade: job?.attemptsMade
      },
      'Auto-rollout worker job failed'
    )
  })
}

let shuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  workerLogger.info({ signal }, 'Shutting down worker')

  await Promise.allSettled([
    scheduleWorker.close(),
    autoRolloutWorker.close(),
    stopFlagEventPublisher(),
    workerConnection.quit()
  ])

  process.exit(0)
}

async function start() {
  attachWorkerObservers()
  startFlagEventPublisher(workerLogger)

  await Promise.all([
    scheduleWorker.waitUntilReady(),
    autoRolloutWorker.waitUntilReady()
  ])

  workerLogger.info(
    {
      queues: [SCHEDULE_QUEUE_NAME, AUTO_ROLLOUT_QUEUE_NAME]
    },
    'Worker is ready to process background jobs'
  )
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal)
  })
}

void start().catch((error) => {
  workerLogger.error({ err: error }, 'Worker failed to start')
  process.exit(1)
})
