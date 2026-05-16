import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { revalidatePath } from 'next/cache'
import { createOrg } from '@/server/orgs/actions'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@canarygate/logger', () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
  logServerWarn: vi.fn()
}))
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn(() => null)
  })
}))

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('createOrg via MSW', () => {
  it('calls POST /orgs and returns org data on success', async () => {
    server.use(
      http.post('http://localhost:3001/orgs', () => {
        return HttpResponse.json({ id: 'org-123', name: 'Test Org', slug: 'test-org' })
      })
    )
    const result = await createOrg({ name: 'Test Org', slug: 'test-org' })
    expect(result).toEqual({ id: 'org-123', name: 'Test Org', slug: 'test-org' })
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith('/orgs')
  })

  it('returns null when API returns 500', async () => {
    server.use(
      http.post('http://localhost:3001/orgs', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    const result = await createOrg({ name: 'Test Org', slug: 'test-org' })
    expect(result).toBeNull()
  })

  it('returns null when data fails validation', async () => {
    const result = await createOrg({ name: '', slug: 'invalid slug!' })
    expect(result).toBeNull()
  })
})
