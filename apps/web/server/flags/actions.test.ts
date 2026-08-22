import { createFlag, updateFlag, deleteFlag } from './actions'
import { apiFetch } from '../api-fetch'
import { invalidateProjectFlags } from '../cache/flag-invalidation'
import { revalidatePath } from 'next/cache'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@canarygate/logger', () => ({
  logServerError: vi.fn(),
  logServerInfo: vi.fn(),
  logServerWarn: vi.fn(),
}))

vi.mock('../api-fetch', () => ({
  apiFetch: vi.fn(),
}))

vi.mock('../cache/flag-invalidation', () => ({
  getProjectFlagVersion: vi.fn(() => 0),
  invalidateProjectFlags: vi.fn(),
}))

const mockApiFetch = vi.mocked(apiFetch)
const mockInvalidateProjectFlags = vi.mocked(invalidateProjectFlags)
const mockRevalidatePath = vi.mocked(revalidatePath)

const validFlagData = {
  name: 'My Flag',
  key: 'my-flag',
  description: 'A test flag',
  type: 'boolean' as const,
  enabled: false,
  rolloutPercent: 0,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createFlag', () => {
  it('calls apiFetch with POST to the correct URL containing orgId and projectId', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'flag-1' }), { status: 200 })
    )

    await createFlag('org-1', 'proj-1', validFlagData)

    expect(mockApiFetch).toHaveBeenCalledOnce()
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toContain('/orgs/org-1')
    expect(url).toContain('/projects/proj-1')
    expect(url).toContain('/flags')
    expect(options?.method).toBe('POST')
  })

  it('returns { ok: true, data } when apiFetch returns 200', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'flag-1' }), { status: 200 })
    )

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toEqual({ ok: true, data: { id: 'flag-1' } })
  })

  it('invalidates the flags list page after a successful creation', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'flag-1' }), { status: 200 })
    )

    await createFlag('org-1', 'proj-1', validFlagData)

    expect(mockInvalidateProjectFlags).toHaveBeenCalledWith('proj-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/orgs/[orgSlug]/projects/[projectSlug]/flags'
    )
  })

  it('returns { ok: false, message } with the API message when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Conflict' }), { status: 409 })
    )

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toEqual({ ok: false, message: 'Conflict' })
  })

  it('returns { ok: false } without message when the API body is not JSON', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response('internal error', { status: 500 })
    )

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toEqual({ ok: false })
  })

  it('returns { ok: false } when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toEqual({ ok: false })
  })

  it('returns { ok: false } when required fields are missing (invalid input)', async () => {
    const result = await createFlag('org-1', 'proj-1', {
      ...validFlagData,
      name: '',
    })

    expect(result).toEqual({ ok: false })
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('sends correct body with flag data', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'flag-1' }), { status: 200 })
    )

    await createFlag('org-1', 'proj-1', validFlagData)

    const [, options] = mockApiFetch.mock.calls[0]
    const body = JSON.parse(options?.body as string)
    expect(body.name).toBe('My Flag')
    expect(body.key).toBe('my-flag')
    expect(body.type).toBe('boolean')
  })
})

describe('updateFlag', () => {
  const updateData = {
    name: 'Updated Flag',
    description: 'Updated description',
    enabled: true,
    rolloutPercent: 50,
  }

  it('calls apiFetch with PUT to correct URL', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(mockApiFetch).toHaveBeenCalledOnce()
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toContain('/orgs/org-1/projects/proj-1/flags/flag-1')
    expect(options?.method).toBe('PUT')
  })

  it('returns { ok: true } when apiFetch returns ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(result).toEqual({ ok: true })
  })

  it('invalidates the flags list and detail pages after a successful update', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(mockInvalidateProjectFlags).toHaveBeenCalledWith('proj-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/orgs/[orgSlug]/projects/[projectSlug]/flags'
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/orgs/[orgSlug]/projects/[projectSlug]/flags/[...flagKey]'
    )
  })

  it('returns { ok: false, message } with the API message when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Bad request' }), { status: 400 })
    )

    const result = await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(result).toEqual({ ok: false, message: 'Bad request' })
  })

  it('appends environmentSlug to query string when provided', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await updateFlag('org-1', 'proj-1', 'flag-1', updateData, 'production')

    const [url] = mockApiFetch.mock.calls[0]
    expect(url).toContain('environmentSlug=production')
  })

  it('returns { ok: false } when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(result).toEqual({ ok: false })
  })
})

describe('deleteFlag', () => {
  it('calls apiFetch with DELETE to correct URL', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(mockApiFetch).toHaveBeenCalledOnce()
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toContain('/orgs/org-1/projects/proj-1/flags/flag-1')
    expect(options?.method).toBe('DELETE')
  })

  it('returns { ok: true } when apiFetch returns ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(result).toEqual({ ok: true })
  })

  it('invalidates the flags list page after a successful deletion', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(mockInvalidateProjectFlags).toHaveBeenCalledWith('proj-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/orgs/[orgSlug]/projects/[projectSlug]/flags'
    )
  })

  it('returns { ok: false, message } with the API message when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })
    )

    const result = await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(result).toEqual({ ok: false, message: 'Not found' })
  })

  it('returns { ok: false } when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(result).toEqual({ ok: false })
  })
})
