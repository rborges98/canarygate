import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteActions } from './invite-actions'
import { acceptInvite, declineInvite } from '@/server/members/actions'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/server/members/actions', () => ({
  acceptInvite: vi.fn().mockResolvedValue(undefined),
  declineInvite: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  pushMock.mockReset()
  vi.mocked(acceptInvite).mockResolvedValue(undefined)
  vi.mocked(declineInvite).mockResolvedValue(undefined)
})

describe('InviteActions', () => {
  it('renders Accept invite and Decline invite buttons', () => {
    render(<InviteActions token="abc123" />)

    expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline invite/i })).toBeInTheDocument()
  })

  it('calls acceptInvite with token when Accept is clicked', async () => {
    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /accept invite/i }))

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith('abc123'))
  })

  it('redirects to /orgs after accepting', async () => {
    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /accept invite/i }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/orgs'))
  })

  it('calls declineInvite with token when Decline is clicked', async () => {
    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /decline invite/i }))

    await waitFor(() => expect(declineInvite).toHaveBeenCalledWith('abc123'))
  })

  it('redirects to /login after declining', async () => {
    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /decline invite/i }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'))
  })

  it('shows loading state "Accepting..." while accepting', async () => {
    let resolveAccept!: () => void
    vi.mocked(acceptInvite).mockReturnValueOnce(
      new Promise<undefined>((resolve) => {
        resolveAccept = () => resolve(undefined)
      })
    )

    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /accept invite/i }))

    expect(screen.getByRole('button', { name: /accepting\.\.\./i })).toBeInTheDocument()

    resolveAccept()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /accept invite/i })).toBeInTheDocument()
    )
  })

  it('shows loading state "Declining..." while declining', async () => {
    let resolveDecline!: () => void
    vi.mocked(declineInvite).mockReturnValueOnce(
      new Promise<undefined>((resolve) => {
        resolveDecline = () => resolve(undefined)
      })
    )

    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /decline invite/i }))

    expect(screen.getByRole('button', { name: /declining\.\.\./i })).toBeInTheDocument()

    resolveDecline()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /decline invite/i })).toBeInTheDocument()
    )
  })

  it('disables both buttons while loading', async () => {
    let resolveAccept!: () => void
    vi.mocked(acceptInvite).mockReturnValueOnce(
      new Promise<undefined>((resolve) => {
        resolveAccept = () => resolve(undefined)
      })
    )

    const user = userEvent.setup()
    render(<InviteActions token="abc123" />)

    await user.click(screen.getByRole('button', { name: /accept invite/i }))

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toBeDisabled())

    resolveAccept()
    await waitFor(() =>
      buttons.forEach((btn) => expect(btn).not.toBeDisabled())
    )
  })
})
