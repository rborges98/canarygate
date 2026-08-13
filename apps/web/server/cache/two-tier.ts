import { del, getJson, setJson } from './redis-cache'
import { createTtlCache, type TtlCache } from './ttl-cache'

export type GetCachedOptions<T> = {
  key: string
  ttlMs: number
  memory?: TtlCache<T>
  redisTtlSeconds: number
  fetcher: () => Promise<T>
}

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

  const value = await fetcher()
  memory.set(key, value)

  if (value !== null) {
    await setJson(key, value, redisTtlSeconds)
  }

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
