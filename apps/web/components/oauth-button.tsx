'use client'

import { authClient } from '@/services/auth/client'

type OAuthProvider = 'google' | 'github' | 'microsoft'

type OAuthButtonProps = {
  provider: OAuthProvider
  icon: React.ReactNode
  label: string
  disabled?: boolean
  iconOnly?: boolean
}

export function OAuthButton({
  provider,
  icon,
  label,
  disabled,
  iconOnly
}: OAuthButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      onClick={() =>
        authClient.signIn.social({ provider, callbackURL: '/orgs' })
      }
      className={
        iconOnly
          ? 'border-cg-bg-100 hover:bg-cg-white-200 flex flex-1 items-center justify-center rounded-lg border py-3 transition duration-300 disabled:cursor-not-allowed disabled:opacity-60'
          : 'border-cg-bg-100 hover:bg-cg-white-200 flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-[13px] font-medium text-white transition duration-300 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {icon}
      {!iconOnly && label}
    </button>
  )
}
