import { revokeAllSessions } from './actions'
import { auth } from '@/services/auth/server'
import { getSession } from '@/shared/auth'
import { logServerError } from '@canarygate/logger'

vi.mock('@/services/auth/server', () => ({
  auth: {
    api: {
      listSessions: vi.fn(),
      revokeSession: vi.fn()
    }
  }
}))

vi.mock('@/shared/auth', () => ({
  getSession: vi.fn()
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers())
}))

vi.mock('@canarygate/logger', () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
  logServerWarn: vi.fn()
}))

const mockListSessions = vi.mocked(auth.api.listSessions)
const mockRevokeSession = vi.mocked(auth.api.revokeSession)
const mockGetSession = vi.mocked(getSession)
const mockLogServerError = vi.mocked(logServerError)

type ListSessionsResult = Awaited<ReturnType<typeof auth.api.listSessions>>

const currentSession = {
  session: { token: 'current-token', id: 's-1', userId: 'u-1' },
  user: { id: 'u-1', email: 'user@test.dev', name: 'Test User' }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('revokeAllSessions', () => {
  it('returns { ok: false } when there is no active session', async () => {
    mockGetSession.mockResolvedValue(null)

    const result = await revokeAllSessions()

    expect(result).toEqual({ ok: false })
    expect(mockListSessions).not.toHaveBeenCalled()
  })

  it('revokes every session except the current one', async () => {
    mockGetSession.mockResolvedValue(currentSession)
    mockListSessions.mockResolvedValue([
      { token: 'current-token', id: 's-1' },
      { token: 'other-token-1', id: 's-2' },
      { token: 'other-token-2', id: 's-3' }
    ] as ListSessionsResult)

    const result = await revokeAllSessions()

    expect(result).toEqual({ ok: true })
    expect(mockListSessions).toHaveBeenCalledTimes(1)
    expect(mockRevokeSession).toHaveBeenCalledTimes(2)
    expect(mockRevokeSession).toHaveBeenCalledWith(
      expect.objectContaining({ body: { token: 'other-token-1' } })
    )
    expect(mockRevokeSession).toHaveBeenCalledWith(
      expect.objectContaining({ body: { token: 'other-token-2' } })
    )
  })

  it('does not call revokeSession when only the current session exists', async () => {
    mockGetSession.mockResolvedValue(currentSession)
    mockListSessions.mockResolvedValue([
      { token: 'current-token', id: 's-1' }
    ] as ListSessionsResult)

    const result = await revokeAllSessions()

    expect(result).toEqual({ ok: true })
    expect(mockRevokeSession).not.toHaveBeenCalled()
  })

  it('returns { ok: false } and logs the error when listSessions throws', async () => {
    mockGetSession.mockResolvedValue(currentSession)
    mockListSessions.mockRejectedValue(new Error('list failed'))

    const result = await revokeAllSessions()

    expect(result).toEqual({ ok: false })
    expect(mockLogServerError).toHaveBeenCalled()
  })

  it('returns { ok: false } and logs the error when revokeSession throws', async () => {
    mockGetSession.mockResolvedValue(currentSession)
    mockListSessions.mockResolvedValue([
      { token: 'current-token', id: 's-1' },
      { token: 'other-token', id: 's-2' }
    ] as ListSessionsResult)
    mockRevokeSession.mockRejectedValue(new Error('revoke failed'))

    const result = await revokeAllSessions()

    expect(result).toEqual({ ok: false })
    expect(mockLogServerError).toHaveBeenCalled()
  })
})
