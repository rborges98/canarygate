export type CacheEntry<T> = {
  value: T
  createdAt: number
}

export type TtlCacheOptions = {
  ttlMs: number
  maxEntries?: number
}

export type TtlCache<T> = {
  get: (key: string) => T | undefined
  set: (key: string, value: T) => void
  delete: (key: string) => void
  invalidateByPrefix: (prefix: string) => void
}

export function createTtlCache<T>(options: TtlCacheOptions): TtlCache<T> {
  const { ttlMs, maxEntries } = options
  const entries = new Map<string, CacheEntry<T>>()

  function purgeExpired() {
    const now = Date.now()

    for (const [key, entry] of entries) {
      if (now - entry.createdAt >= ttlMs) {
        entries.delete(key)
      }
    }
  }

  function isExpired(entry: CacheEntry<T>) {
    return Date.now() - entry.createdAt >= ttlMs
  }

  return {
    get(key) {
      const entry = entries.get(key)

      if (!entry) {
        return undefined
      }

      if (isExpired(entry)) {
        entries.delete(key)
        return undefined
      }

      return entry.value
    },
    set(key, value) {
      if (
        maxEntries !== undefined &&
        entries.size >= maxEntries &&
        !entries.has(key)
      ) {
        purgeExpired()

        if (entries.size >= maxEntries) {
          const oldestKey = entries.keys().next().value

          if (oldestKey !== undefined) {
            entries.delete(oldestKey)
          }
        }
      }

      entries.set(key, { value, createdAt: Date.now() })
    },
    delete(key) {
      entries.delete(key)
    },
    invalidateByPrefix(prefix) {
      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) {
          entries.delete(key)
        }
      }
    }
  }
}
