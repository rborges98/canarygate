import { buildApp } from './app.js'
import { startScheduleProcessor } from './cron/schedule-processor.js'

const PORT = Number(process.env.PORT) || 3001

const app = buildApp()

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  startScheduleProcessor(app.log)
})
