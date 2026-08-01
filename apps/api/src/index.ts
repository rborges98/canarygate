import { buildApp } from './app.js'
import {
  startFlagEventsSubscriber,
  stopFlagEventsPubSub
} from './pubsub/flag-events.js'

const PORT = Number(process.env.PORT) || 3001

const app = buildApp()
let shuttingDown = false

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  app.log.info({ signal }, 'Shutting down API')

  // Encerra apenas o que sobrou: o PubSub e o servidor Fastify
  await Promise.allSettled([stopFlagEventsPubSub(), app.close()])

  process.exit(0)
}

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    startFlagEventsSubscriber(app.log)
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
