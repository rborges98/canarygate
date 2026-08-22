const mocks = vi.hoisted(() => ({
  handler: {
    GET: vi.fn(),
    POST: vi.fn()
  },
  toNextJsHandler: vi.fn()
}))

vi.mock('@/services/auth/server', () => ({
  auth: { api: {} }
}))

vi.mock('better-auth/next-js', () => ({
  toNextJsHandler: mocks.toNextJsHandler
}))

vi.mock('@canarygate/logger', () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
  logServerWarn: vi.fn()
}))

async function importRoute() {
  vi.resetModules()
  return import('@/app/api/auth/[...all]/route')
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.toNextJsHandler.mockReturnValue(mocks.handler)
  mocks.handler.GET.mockResolvedValue(new Response('ok', { status: 200 }))
  mocks.handler.POST.mockResolvedValue(new Response('ok', { status: 200 }))
})

function otpRequest(
  path: string,
  ip?: string,
  method: 'GET' | 'POST' = 'POST'
): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' }

  if (ip !== undefined) {
    headers['x-forwarded-for'] = ip
  }

  return new Request(`http://localhost${path}`, { method, headers })
}

describe('auth route rate limiting', () => {
  it('returns 429 after the send OTP limit is exceeded', async () => {
    const route = await importRoute()

    for (let i = 0; i < 5; i++) {
      const res = await route.POST(
        otpRequest('/api/auth/sign-in/email-otp', '203.0.113.10')
      )
      expect(res.status).toBe(200)
    }

    const blocked = await route.POST(
      otpRequest('/api/auth/sign-in/email-otp', '203.0.113.10')
    )

    expect(blocked.status).toBe(429)
    expect(await blocked.json()).toEqual({ error: 'Too many requests' })
    expect(blocked.headers.get('retry-after')).toBe('900')
    expect(mocks.handler.POST).toHaveBeenCalledTimes(5)
  })

  it('returns 429 after the verify OTP limit is exceeded', async () => {
    const route = await importRoute()

    for (let i = 0; i < 10; i++) {
      const res = await route.POST(
        otpRequest('/api/auth/sign-in/email-otp/verify', '203.0.113.11')
      )
      expect(res.status).toBe(200)
    }

    const blocked = await route.POST(
      otpRequest('/api/auth/sign-in/email-otp/verify', '203.0.113.11')
    )

    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('retry-after')).toBe('900')
    expect(mocks.handler.POST).toHaveBeenCalledTimes(10)
  })

  it('limits send and verify endpoints independently', async () => {
    const route = await importRoute()

    for (let i = 0; i < 5; i++) {
      await route.POST(
        otpRequest('/api/auth/sign-in/email-otp', '203.0.113.12')
      )
    }

    const blockedSend = await route.POST(
      otpRequest('/api/auth/sign-in/email-otp', '203.0.113.12')
    )
    expect(blockedSend.status).toBe(429)

    const verify = await route.POST(
      otpRequest('/api/auth/sign-in/email-otp/verify', '203.0.113.12')
    )
    expect(verify.status).toBe(200)
  })

  it('passes non-OTP POST requests through without limiting', async () => {
    const route = await importRoute()

    for (let i = 0; i < 20; i++) {
      const res = await route.POST(otpRequest('/api/auth/sign-in/email', '1.2.3.4'))
      expect(res.status).toBe(200)
    }

    expect(mocks.handler.POST).toHaveBeenCalledTimes(20)
  })

  it('passes GET requests through untouched', async () => {
    const route = await importRoute()

    const res = await route.GET(
      otpRequest('/api/auth/session', '1.2.3.4', 'GET')
    )

    expect(res.status).toBe(200)
    expect(mocks.handler.GET).toHaveBeenCalledTimes(1)
  })

  it('keys on the first entry of x-forwarded-for', async () => {
    const route = await importRoute()

    for (let i = 0; i < 5; i++) {
      const res = await route.POST(
        otpRequest(
          '/api/auth/sign-in/email-otp',
          '198.51.100.7, 203.0.113.99'
        )
      )
      expect(res.status).toBe(200)
    }

    const blocked = await route.POST(
      otpRequest('/api/auth/sign-in/email-otp', '198.51.100.7, 203.0.113.99')
    )
    expect(blocked.status).toBe(429)

    const other = await route.POST(
      otpRequest('/api/auth/sign-in/email-otp', '203.0.113.99')
    )
    expect(other.status).toBe(200)
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', async () => {
    const route = await importRoute()
    const request = new Request('http://localhost/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers: { 'x-real-ip': '192.0.2.55' }
    })

    for (let i = 0; i < 5; i++) {
      expect((await route.POST(request)).status).toBe(200)
    }

    expect((await route.POST(request)).status).toBe(429)
  })

  it('uses unknown as the key when no IP headers exist', async () => {
    const route = await importRoute()
    const request = otpRequest('/api/auth/sign-in/email-otp')

    for (let i = 0; i < 5; i++) {
      expect((await route.POST(request)).status).toBe(200)
    }

    expect((await route.POST(request)).status).toBe(429)
  })
})
