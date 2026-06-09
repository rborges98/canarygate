import IORedis from 'ioredis'

const DEFAULT_REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export type RedisConnectionOptions = {
  connectionName?: string
  lazyConnect?: boolean
  enableOfflineQueue?: boolean
  enableReadyCheck?: boolean
}

export function getRedisUrl(scope: string) {
  const value = process.env.REDIS_URL?.trim()
  if (value) {
    return value
  }

  if (!IS_PRODUCTION) {
    return DEFAULT_REDIS_URL
  }

  throw new Error(`[${scope}] Missing required env var: REDIS_URL`)
}

export function createRedisConnection(
  scope: string,
  options: RedisConnectionOptions = {}
) {
  return new IORedis(getRedisUrl(scope), {
    connectionName: options.connectionName,
    enableOfflineQueue: options.enableOfflineQueue ?? true,
    enableReadyCheck: options.enableReadyCheck ?? true,
    lazyConnect: options.lazyConnect ?? false,
    maxRetriesPerRequest: null
  })
}

export type RedisConnection = ReturnType<typeof createRedisConnection>
