'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInvite, declineInvite } from '@/server/members/actions'

interface Props {
  token: string
}

export function InviteActions({ token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  const handleAccept = async () => {
    setLoading('accept')
    await acceptInvite(token)
    setLoading(null)
    router.push('/orgs')
  }

  const handleDecline = async () => {
    setLoading('decline')
    await declineInvite(token)
    setLoading(null)
    router.push('/login')
  }

  return (
    <>
      <button
        onClick={handleAccept}
        disabled={!!loading}
        className="bg-cg-indigo-400 hover:bg-cg-indigo-300 mb-2 w-full rounded-lg py-3 text-[13px] font-semibold disabled:opacity-50"
      >
        {loading === 'accept' ? 'Accepting...' : 'Accept invite'}
      </button>
      <button
        onClick={handleDecline}
        disabled={!!loading}
        className="border-cg-indigo-400 w-full rounded-lg border py-3 text-[12px] disabled:opacity-50"
      >
        {loading === 'decline' ? 'Declining...' : 'Decline invite'}
      </button>
    </>
  )
}
