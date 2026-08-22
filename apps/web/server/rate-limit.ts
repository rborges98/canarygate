export type RateLimitDecision = {
  allowed: boolean
  retryAfterSeconds: number
}

export type RateLimiterOptions = {
  windowMs: number
  maxHits: number
}

export type RateLimiter = {
  checkLimit: (key: string) => RateLimitDecision
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { windowMs, maxHits } = options
  const entries = new Map<string, { count: number; resetAt: number }>()
  const maxEntries = 10_000

  function pruneExpired(now: number) {
    for (const [key, entry] of entries) {
      if (now >= entry.resetAt) {
        entries.delete(key)
      }
    }
  }

  return {
    checkLimit(key) {
      const now = Date.now()

      if (entries.size >= maxEntries) {
        pruneExpired(now)

        if (entries.size >= maxEntries) {
          const oldestKey = entries.keys().next().value

          if (oldestKey !== undefined) {
            entries.delete(oldestKey)
          }
        }
      }

      const entry = entries.get(key)

      if (!entry || now >= entry.resetAt) {
        entries.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, retryAfterSeconds: 0 }
      }

      if (entry.count >= maxHits) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((entry.resetAt - now) / 1000)
          )
        }
      }

      entry.count += 1
      return { allowed: true, retryAfterSeconds: 0 }
    }
  }
}

export type OtpRateLimitKind = 'send' | 'verify'

export function getOtpRateLimitKind(
  pathname: string,
  method: string
): OtpRateLimitKind | null {
  if (method !== 'POST' || !pathname.includes('email-otp')) {
    return null
  }

  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  if (normalized.endsWith('/email-otp/verify')) {
    return 'verify'
  }

  if (normalized.endsWith('/email-otp')) {
    return 'send'
  }

  return null
}
