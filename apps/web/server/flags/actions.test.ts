import { createFlag, updateFlag, deleteFlag } from './actions'
import { apiFetch } from '../api-fetch'

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

const mockApiFetch = vi.mocked(apiFetch)

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

  it('returns { id } when apiFetch returns 200', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'flag-1' }), { status: 200 })
    )

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toEqual({ id: 'flag-1' })
  })

  it('returns null when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Conflict' }), { status: 409 })
    )

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toBeNull()
  })

  it('returns null when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await createFlag('org-1', 'proj-1', validFlagData)

    expect(result).toBeNull()
  })

  it('returns null when required fields are missing (invalid input)', async () => {
    const result = await createFlag('org-1', 'proj-1', {
      ...validFlagData,
      name: '',
    })

    expect(result).toBeNull()
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

  it('returns true when apiFetch returns ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(result).toBe(true)
  })

  it('returns false when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 400 }))

    const result = await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(result).toBe(false)
  })

  it('appends environmentSlug to query string when provided', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await updateFlag('org-1', 'proj-1', 'flag-1', updateData, 'production')

    const [url] = mockApiFetch.mock.calls[0]
    expect(url).toContain('environmentSlug=production')
  })

  it('returns false when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await updateFlag('org-1', 'proj-1', 'flag-1', updateData)

    expect(result).toBe(false)
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

  it('returns true when apiFetch returns ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(result).toBe(true)
  })

  it('returns false when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 404 }))

    const result = await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(result).toBe(false)
  })

  it('returns false when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await deleteFlag('org-1', 'proj-1', 'flag-1')

    expect(result).toBe(false)
  })
})
