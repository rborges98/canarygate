import { createRateLimiter, getOtpRateLimitKind } from './rate-limit'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxHits: 3 })

    expect(limiter.checkLimit('ip-1').allowed).toBe(true)
    expect(limiter.checkLimit('ip-1').allowed).toBe(true)
    expect(limiter.checkLimit('ip-1').allowed).toBe(true)
  })

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxHits: 2 })

    limiter.checkLimit('ip-1')
    limiter.checkLimit('ip-1')

    expect(limiter.checkLimit('ip-1')).toEqual({
      allowed: false,
      retryAfterSeconds: 60
    })
  })

  it('resets the window after windowMs elapses', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxHits: 1 })

    expect(limiter.checkLimit('ip-1').allowed).toBe(true)
    expect(limiter.checkLimit('ip-1').allowed).toBe(false)

    vi.advanceTimersByTime(60_001)

    expect(limiter.checkLimit('ip-1').allowed).toBe(true)
  })

  it('reports the remaining seconds in retryAfter', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxHits: 1 })

    limiter.checkLimit('ip-1')
    vi.advanceTimersByTime(5_000)

    const decision = limiter.checkLimit('ip-1')

    expect(decision.allowed).toBe(false)
    expect(decision.retryAfterSeconds).toBe(55)
  })

  it('tracks keys independently', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxHits: 1 })

    limiter.checkLimit('ip-a')

    expect(limiter.checkLimit('ip-a').allowed).toBe(false)
    expect(limiter.checkLimit('ip-b').allowed).toBe(true)
  })
})

describe('getOtpRateLimitKind', () => {
  it('returns send for the send OTP endpoint', () => {
    expect(
      getOtpRateLimitKind('/api/auth/sign-in/email-otp', 'POST')
    ).toBe('send')
  })

  it('returns verify for the verify OTP endpoint', () => {
    expect(
      getOtpRateLimitKind('/api/auth/sign-in/email-otp/verify', 'POST')
    ).toBe('verify')
  })

  it('handles trailing slashes', () => {
    expect(
      getOtpRateLimitKind('/api/auth/sign-in/email-otp/', 'POST')
    ).toBe('send')
    expect(
      getOtpRateLimitKind('/api/auth/sign-in/email-otp/verify/', 'POST')
    ).toBe('verify')
  })

  it('returns null for non-POST methods', () => {
    expect(
      getOtpRateLimitKind('/api/auth/sign-in/email-otp', 'GET')
    ).toBeNull()
  })

  it('returns null for non-OTP paths', () => {
    expect(getOtpRateLimitKind('/api/auth/sign-in/email', 'POST')).toBeNull()
    expect(getOtpRateLimitKind('/api/auth/session', 'POST')).toBeNull()
  })
})
