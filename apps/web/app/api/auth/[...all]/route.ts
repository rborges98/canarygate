import { auth } from '@/services/auth/server'
import { toNextJsHandler } from 'better-auth/next-js'
import { logServerError } from '@canarygate/logger'
import {
  createRateLimiter,
  getOtpRateLimitKind,
  type RateLimitDecision
} from '@/server/rate-limit'

const handler = toNextJsHandler(auth)

const OTP_WINDOW_MS = 15 * 60 * 1000
const sendOtpLimiter = createRateLimiter({
  windowMs: OTP_WINDOW_MS,
  maxHits: 5
})
const verifyOtpLimiter = createRateLimiter({
  windowMs: OTP_WINDOW_MS,
  maxHits: 10
})

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') ?? 'unknown'
}

function getRateLimitDecision(
  pathname: string,
  method: string,
  ip: string
): RateLimitDecision | null {
  const kind = getOtpRateLimitKind(pathname, method)

  if (!kind) {
    return null
  }

  const limiter = kind === 'send' ? sendOtpLimiter : verifyOtpLimiter
  return limiter.checkLimit(ip)
}

function tooManyRequests(decision: RateLimitDecision): Response {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(decision.retryAfterSeconds)
    }
  })
}

export async function GET(request: Request) {
  try {
    return handler.GET(request)
  } catch (error) {
    logServerError('Auth route handler failed', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url)
    const decision = getRateLimitDecision(pathname, 'POST', getClientIp(request))

    if (decision && !decision.allowed) {
      return tooManyRequests(decision)
    }

    return handler.POST(request)
  } catch (error) {
    logServerError('Auth route handler failed', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
