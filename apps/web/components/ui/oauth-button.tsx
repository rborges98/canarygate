'use client'

import { authClient } from '@/lib/auth-client'

type OAuthProvider = 'google' | 'github' | 'microsoft'

interface OAuthButtonProps {
  provider: OAuthProvider
  icon: React.ReactNode
  label: string
  disabled?: boolean
}

export function OAuthButton({ provider, icon, label, disabled }: OAuthButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        authClient.signIn.social({ provider, callbackURL: '/orgs' })
      }
      className="border-cg-bg-100 hover:bg-cg-white-200 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-[13px] font-medium text-white transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {label}
    </button>
  )
}
