import pino, { type Logger, type LoggerOptions } from 'pino'

export type LogContext = Record<string, unknown>

type CreateLoggerOptions = {
  service?: string
  level?: string
}

type CreateLoggerHelpersOptions = {
  service: string
  level?: string
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export const prettyLoggerOptions = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
} as const satisfies LoggerOptions

export const fastifyLogger = IS_PRODUCTION ? true : prettyLoggerOptions

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  return pino({
    level:
      options.level ??
      process.env.LOG_LEVEL ??
      (IS_PRODUCTION ? 'info' : 'debug'),
    ...(options.service
      ? {
          base: {
            service: options.service,
            env: process.env.NODE_ENV ?? 'development'
          }
        }
      : {}),
    serializers: {
      err: pino.stdSerializers.err
    },
    ...(IS_PRODUCTION ? {} : prettyLoggerOptions)
  })
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }

  return error
}

export function normalizeLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return serializeError(value)
  }

  if (value instanceof URL) {
    return value.toString()
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLogValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeLogValue(item)
      ])
    )
  }

  return value
}

export function normalizeContext(context?: LogContext) {
  return context ? (normalizeLogValue(context) as LogContext) : undefined
}

export function createLoggerHelpers(options: CreateLoggerHelpersOptions) {
  const logger = createLogger(options)

  return {
    logger,
    logInfo(message: string, context?: LogContext) {
      logger.info(normalizeContext(context), message)
    },
    logWarn(message: string, context?: LogContext) {
      logger.warn(normalizeContext(context), message)
    },
    logError(message: string, error?: unknown, context?: LogContext) {
      const normalizedContext = normalizeContext(context)

      if (error instanceof Error) {
        logger.error({ ...(normalizedContext ?? {}), err: error }, message)
        return
      }

      logger.error(
        {
          ...(normalizedContext ?? {}),
          ...(error !== undefined
            ? { error: normalizeLogValue(error) }
            : {})
        },
        message
      )
    }
  }
}

export const workerLogger = createLogger({ service: 'canarygate-worker' })

export type WorkerLogger = typeof workerLogger

const webLoggerHelpers = createLoggerHelpers({ service: 'canarygate-web' })

export const logServerInfo = webLoggerHelpers.logInfo
export const logServerWarn = webLoggerHelpers.logWarn
export const logServerError = webLoggerHelpers.logError