import { buildApp } from './app.js'
import { closeFlagQueues, connectFlagQueues } from './queues/flag-jobs.js'
import { startScheduleProcessor } from './cron/schedule-processor.js'
import {
  startFlagEventsSubscriber,
  stopFlagEventsPubSub
} from './pubsub/flag-events.js'

const PORT = Number(process.env.PORT) || 3001

const app = buildApp()
let stopScheduleProcessor: (() => void) | null = null
let shuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  app.log.info({ signal }, 'Shutting down API')
  stopScheduleProcessor?.()

  await Promise.allSettled([
    stopFlagEventsPubSub(),
    closeFlagQueues(),
    app.close()
  ])

  process.exit(0)
}

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    void connectFlagQueues(app.log)
    startFlagEventsSubscriber(app.log)
    stopScheduleProcessor = startScheduleProcessor(app.log)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal)
  })
}

void start()
