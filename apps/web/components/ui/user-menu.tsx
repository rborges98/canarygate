'use client'

import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/services/auth/client'
import type { SessionUser } from '@/shared/auth'
import { UserAvatar } from './user-avatar'

const SESSION_REFETCH_RETRY_LIMIT = 2
const SESSION_REFETCH_RETRY_DELAY_MS = 750

type UserMenuProps = {
  initialUser?: SessionUser | null
}

export function UserMenu({ initialUser }: UserMenuProps) {
  const { data: session, isPending, isRefetching, refetch } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sessionRetryCountRef = useRef(0)
  const router = useRouter()

  const email = session?.user?.email ?? initialUser?.email ?? ''
  const initial = (email[0] ?? '?').toUpperCase()

  useEffect(() => {
    if (email) {
      sessionRetryCountRef.current = 0
      return
    }

    if (
      isPending ||
      isRefetching ||
      sessionRetryCountRef.current >= SESSION_REFETCH_RETRY_LIMIT
    ) {
      return
    }

    const delay =
      sessionRetryCountRef.current === 0 ? 0 : SESSION_REFETCH_RETRY_DELAY_MS

    const timeoutId = window.setTimeout(() => {
      sessionRetryCountRef.current += 1
      void refetch({ query: { disableCookieCache: true } })
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [email, isPending, isRefetching, refetch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full focus:outline-none"
        aria-label="User menu"
      >
        <UserAvatar
          initial={initial}
          size="md"
          variant="filled"
          className="bg-cg-indigo-300 border-cg-indigo-200 text-white"
        />
      </button>

      {open && (
        <>
          {/* arrow */}
          <div
            className="absolute right-3.5 z-101"
            style={{
              top: 'calc(100% + 7px)',
              width: '10px',
              height: '10px',
              transform: 'rotate(45deg)',
              backgroundColor: '#141414',
              borderTop: '1px solid #1a1a1a',
              borderLeft: '1px solid #1a1a1a'
            }}
          />
          {/* dropdown */}
          <div
            className="absolute right-0 z-100 w-52 rounded-xl border"
            style={{
              top: 'calc(100% + 12px)',
              backgroundColor: '#141414',
              borderColor: '#1a1a1a',
              boxShadow: '0 8px 24px #000'
            }}
          >
            <div
              className="border-b px-4 py-3"
              style={{ borderColor: '#1a1a1a' }}
            >
              <p className="text-cg-neutral-500 truncate font-sans text-[11px]">
                {email}
              </p>
            </div>
            <div className="p-1.5">
              <button
                onClick={handleSignOut}
                className="text-cg-neutral-300 hover:bg-cg-bg-100 hover:text-cg-red-100 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-sans text-[12px] transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserMenu
