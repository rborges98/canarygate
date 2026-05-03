import pino from 'pino'

type LogContext = Record<string, unknown>

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const logger = pino({
  level: process.env.LOG_LEVEL ?? (IS_PRODUCTION ? 'info' : 'debug'),
  base: {
    service: 'canarygate-web',
    env: process.env.NODE_ENV ?? 'development'
  },
  serializers: {
    err: pino.stdSerializers.err
  },
  ...(IS_PRODUCTION
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      })
})

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

function normalizeLogValue(value: unknown): unknown {
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

function normalizeContext(context?: LogContext) {
  return context ? (normalizeLogValue(context) as LogContext) : undefined
}

export function logServerInfo(message: string, context?: LogContext) {
  logger.info(normalizeContext(context), message)
}

export function logServerWarn(message: string, context?: LogContext) {
  logger.warn(normalizeContext(context), message)
}

export function logServerError(
  message: string,
  error?: unknown,
  context?: LogContext
) {
  const normalizedContext = normalizeContext(context)

  if (error instanceof Error) {
    logger.error({ ...(normalizedContext ?? {}), err: error }, message)
    return
  }

  logger.error(
    {
      ...(normalizedContext ?? {}),
      ...(error !== undefined ? { error: normalizeLogValue(error) } : {})
    },
    message
  )
}
