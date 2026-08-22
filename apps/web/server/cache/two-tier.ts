import { del, getJson, setJson } from './redis-cache'
import { createTtlCache, type TtlCache } from './ttl-cache'

export type GetCachedOptions<T> = {
  key: string
  ttlMs: number
  memory?: TtlCache<T>
  redisTtlSeconds: number
  fetcher: () => Promise<T>
}

const inFlight = new Map<string, Promise<unknown>>()

export async function getCached<T>(
  options: GetCachedOptions<T>
): Promise<{ value: T; cached: boolean }> {
  const { key, ttlMs, redisTtlSeconds, fetcher } = options
  const memory = options.memory ?? createTtlCache<T>({ ttlMs })

  const memoryValue = memory.get(key)

  if (memoryValue !== undefined) {
    return { value: memoryValue, cached: true }
  }

  const redisValue = await getJson<T>(key)

  if (redisValue !== null) {
    memory.set(key, redisValue)
    return { value: redisValue, cached: true }
  }

  const pending = inFlight.get(key)

  if (pending) {
    return { value: (await pending) as T, cached: true }
  }

  const promise = fetcher()
    .then((value) => {
      memory.set(key, value)

      if (value !== null) {
        return setJson(key, value, redisTtlSeconds).then(() => value)
      }

      return value
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, promise)
  const value = await promise

  return { value, cached: false }
}

export type InvalidateKeyOptions = {
  key: string
  memory: TtlCache<unknown>
  redis?: boolean
}

export async function invalidateKey(
  options: InvalidateKeyOptions
): Promise<void> {
  const { key, memory, redis = true } = options

  memory.delete(key)

  if (redis) {
    await del(key)
  }
}
