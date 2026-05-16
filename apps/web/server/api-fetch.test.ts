import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { apiFetch } from './api-fetch'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((key: string) => {
      if (key === 'cookie') return 'session=abc123'
      return null
    })
  })
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    const error = new Error(`NEXT_REDIRECT:${path}`)
    ;(error as { digest?: string }).digest = `NEXT_REDIRECT:${path}`
    throw error
  }),
  useRouter: vi.fn(() => ({ push: vi.fn() }))
}))

vi.mock('@canarygate/logger', () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
  logServerWarn: vi.fn()
}))

describe('apiFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.clearAllMocks()
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'cookie') return 'session=abc123'
        return null
      })
    } as never)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('returns response on success', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
    const res = await apiFetch('http://api.example.com/test')
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('forwards cookie from Next.js headers', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn((key: string) => {
        if (key === 'cookie') return 'session=my-cookie'
        return null
      })
    } as never)
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await apiFetch('http://api.example.com/test')
    const calledHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(calledHeaders?.cookie).toBe('session=my-cookie')
  })

  it('returns 4xx response without retrying', async () => {
    fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }))
    const res = await apiFetch('http://api.example.com/test')
    expect(res.status).toBe(404)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries on TypeError (network error) and returns success on third attempt', async () => {
    vi.useFakeTimers()
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
    const promise = apiFetch('http://api.example.com/test')
    await vi.runAllTimersAsync()
    const res = await promise
    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('throws after exhausting all retries on persistent TypeError', async () => {
    vi.useFakeTimers()
    const networkError = new TypeError('Failed to fetch')
    fetchMock
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
    // Attach rejection handler immediately to prevent unhandled rejection warning
    const rejectedPromise = expect(
      apiFetch('http://api.example.com/test')
    ).rejects.toThrow(TypeError)
    await vi.runAllTimersAsync()
    await rejectedPromise
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry on non-retryable errors', async () => {
    fetchMock.mockRejectedValueOnce(new SyntaxError('Unexpected token'))
    await expect(apiFetch('http://api.example.com/test')).rejects.toThrow(SyntaxError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('redirects to /login on 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
    await expect(apiFetch('http://api.example.com/test')).rejects.toThrow()
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/login')
  })

  it('merges custom headers with forwarded cookie', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await apiFetch('http://api.example.com/test', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' }
    })
    const calledHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(calledHeaders?.['Content-Type']).toBe('application/json')
    expect(calledHeaders?.['Authorization']).toBe('Bearer token')
  })

  it('does not include cookie header when no cookie is available', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: vi.fn(() => null)
    } as never)
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }))
    await apiFetch('http://api.example.com/test')
    const calledHeaders = fetchMock.mock.calls[0][1]?.headers as Record<string, string>
    expect(calledHeaders?.cookie).toBeUndefined()
  })
})
