import { createRedisConnection, type RedisConnection } from '@canarygate/redis'
import { logServerError, logServerInfo } from '@canarygate/logger'

const KEY_PREFIX = 'cache:web:'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

function isLocalRedisHost(): boolean {
  const rawUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

  try {
    return LOCAL_HOSTS.has(new URL(rawUrl).hostname)
  } catch (error) {
    logServerError('Invalid REDIS_URL, Redis cache disabled', error)
    return false
  }
}

const REDIS_TIER_ENV = process.env.CACHE_REDIS_TIER?.trim().toLowerCase()

function shouldUseRedisTier(): boolean {
  if (REDIS_TIER_ENV === 'on') {
    return true
  }

  if (REDIS_TIER_ENV === 'off') {
    return false
  }

  if (isLocalRedisHost()) {
    return true
  }

  return process.env.NODE_ENV === 'production'
}

const USE_REDIS = shouldUseRedisTier()

if (!USE_REDIS) {
  logServerInfo('Redis cache tier disabled: use CACHE_REDIS_TIER=on to enable')
}

let connection: RedisConnection | null = null
let isReady = false
const writtenKeys = new Set<string>()

function getCacheConnection(): RedisConnection {
  if (connection) {
    return connection
  }

  connection = createRedisConnection('web cache', {
    connectionName: 'web-cache',
    enableReadyCheck: false,
    enableOfflineQueue: false,
    commandTimeoutMs: 5_000
  })

  connection.on('ready', () => {
    isReady = true
    logServerInfo('Redis cache connection ready')
  })

  connection.on('close', () => {
    isReady = false
  })

  connection.on('end', () => {
    isReady = false
  })

  connection.on('error', (error) => {
    isReady = false
    logServerError('Redis cache connection error', error)
  })

  return connection
}

function buildKey(key: string): string {
  return `${KEY_PREFIX}${key}`
}

export async function getJson<T>(key: string): Promise<T | null> {
  if (!USE_REDIS || !isReady) {
    return null
  }

  try {
    const raw = await getCacheConnection().get(buildKey(key))

    if (raw === null) {
      return null
    }

    return JSON.parse(raw) as T
  } catch (error) {
    logServerError('Redis cache getJson failed', error, { key })
    return null
  }
}

export async function setJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!USE_REDIS || !isReady) {
    return
  }

  try {
    const fullKey = buildKey(key)
    await getCacheConnection().set(
      fullKey,
      JSON.stringify(value),
      'EX',
      ttlSeconds
    )
    writtenKeys.add(fullKey)
  } catch (error) {
    logServerError('Redis cache setJson failed', error, { key })
  }
}

export async function del(key: string): Promise<void> {
  if (!USE_REDIS || !isReady) {
    return
  }

  try {
    await getCacheConnection().del(buildKey(key))
  } catch (error) {
    logServerError('Redis cache del failed', error, { key })
  }
}

export async function flushKeys(): Promise<void> {
  if (!USE_REDIS || !isReady) {
    return
  }

  try {
    const keys = Array.from(writtenKeys)

    if (keys.length > 0) {
      await getCacheConnection().del(...keys)
    }

    writtenKeys.clear()
  } catch (error) {
    logServerError('Redis cache flushKeys failed', error)
  }
}
