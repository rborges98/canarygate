import pino from 'pino'
import { IS_PRODUCTION } from './env.ts'

const prettyLoggerOptions = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
} as const

export const fastifyLogger = IS_PRODUCTION ? true : prettyLoggerOptions

export const sharedLogger = IS_PRODUCTION ? pino() : pino(prettyLoggerOptions)
