import { revalidatePath } from 'next/cache'
import { createOrg, updateOrg, deleteOrg } from './actions'
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
const mockRevalidatePath = vi.mocked(revalidatePath)

const validOrgData = { name: 'My Org', slug: 'my-org' }
const orgResponse = { id: '123', name: 'My Org', slug: 'my-org' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createOrg', () => {
  it('calls apiFetch with POST to /orgs with valid input', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(orgResponse), { status: 200 })
    )

    await createOrg(validOrgData)

    expect(mockApiFetch).toHaveBeenCalledOnce()
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toContain('/orgs')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(options?.body as string)).toEqual(validOrgData)
  })

  it('returns created org on success', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(orgResponse), { status: 200 })
    )

    const result = await createOrg(validOrgData)

    expect(result).toEqual(orgResponse)
  })

  it('calls revalidatePath after successful creation', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(orgResponse), { status: 200 })
    )

    await createOrg(validOrgData)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/orgs')
  })

  it('returns null when name is empty (invalid input)', async () => {
    const result = await createOrg({ name: '', slug: 'my-org' })

    expect(result).toBeNull()
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('returns null when apiFetch returns status 400', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 })
    )

    const result = await createOrg(validOrgData)

    expect(result).toBeNull()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns null when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await createOrg(validOrgData)

    expect(result).toBeNull()
  })
})

describe('updateOrg', () => {
  it('calls apiFetch with PUT to /orgs/:orgId with valid input', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(orgResponse), { status: 200 })
    )

    await updateOrg('org-1', validOrgData)

    expect(mockApiFetch).toHaveBeenCalledOnce()
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toContain('/orgs/org-1')
    expect(options?.method).toBe('PUT')
  })

  it('returns updated org on success', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(orgResponse), { status: 200 })
    )

    const result = await updateOrg('org-1', validOrgData)

    expect(result).toEqual(orgResponse)
  })

  it('calls revalidatePath after successful update', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(orgResponse), { status: 200 })
    )

    await updateOrg('org-1', validOrgData)

    expect(mockRevalidatePath).toHaveBeenCalledWith('/orgs')
  })

  it('returns null when slug is invalid', async () => {
    const result = await updateOrg('org-1', { name: 'My Org', slug: 'INVALID SLUG!' })

    expect(result).toBeNull()
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('returns null when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(
      new Response(null, { status: 500 })
    )

    const result = await updateOrg('org-1', validOrgData)

    expect(result).toBeNull()
  })

  it('returns null when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await updateOrg('org-1', validOrgData)

    expect(result).toBeNull()
  })
})

describe('deleteOrg', () => {
  it('calls apiFetch with DELETE to /orgs/:orgId', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    await deleteOrg('org-1')

    expect(mockApiFetch).toHaveBeenCalledOnce()
    const [url, options] = mockApiFetch.mock.calls[0]
    expect(url).toContain('/orgs/org-1')
    expect(options?.method).toBe('DELETE')
  })

  it('returns true and calls revalidatePath on success', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 200 }))

    const result = await deleteOrg('org-1')

    expect(result).toBe(true)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/orgs')
  })

  it('returns false when apiFetch returns non-ok status', async () => {
    mockApiFetch.mockResolvedValueOnce(new Response(null, { status: 404 }))

    const result = await deleteOrg('org-1')

    expect(result).toBe(false)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns false when apiFetch throws an exception', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await deleteOrg('org-1')

    expect(result).toBe(false)
  })
})
