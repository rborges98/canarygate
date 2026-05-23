'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { authClient } from '@/services/auth/client'
import { OAuthButton } from '@/components/oauth-button'

type FormValues = {
  email: string
}

const OTP_FETCH_OPTIONS = {
  retry: 0
} as const

export function LoginForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid }
  } = useForm<FormValues>({ defaultValues: { email: '' }, mode: 'onChange' })

  async function onSubmit({ email }: FormValues) {
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
      fetchOptions: OTP_FETCH_OPTIONS
    })
    if (error) {
      setError('email', {
        message: error.message ?? 'Something went wrong. Please try again.'
      })
      return
    }
    router.push('/verify?e=' + btoa(email))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="mb-1 text-[20px] font-bold text-white">Sign in</h2>
      <p className="text-cg-neutral-300 mb-6 text-[12px]">
        No password. Just email.
      </p>

      <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
        Email address
      </label>
      <input
        type="email"
        placeholder="you@email.com"
        disabled={isSubmitting}
        className="placeholder:text-cg-neutral-300 text-cg-neutral-100 bg-cg-white-200 border-cg-bg-100 focus:border-cg-indigo-300 mb-4 w-full rounded-lg border px-4 py-3 text-[12px] transition-colors outline-none disabled:opacity-50"
        {...register('email', { required: true })}
      />

      {errors.email && (
        <p className="mb-3 text-[11px] text-red-400">{errors.email.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="border-cg-indigo-300 hover:bg-cg-indigo-300 bg-cg-indigo-400 mb-6 w-full rounded-lg border py-3 text-[13px] font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending…' : 'Continue with email'}
      </button>

      <div className="border-cg-bg-100 border-t pt-5">
        <div className="relative mb-5 flex items-center">
          <div className="border-cg-bg-100 flex-1 border-t" />
          <span className="text-cg-neutral-400 mx-3 text-[11px]">
            or continue with
          </span>
          <div className="border-cg-bg-100 flex-1 border-t" />
        </div>

        <div className="flex gap-2">
          <OAuthButton
            provider="google"
            iconOnly
            disabled={isSubmitting}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            }
            label="Google"
          />
          <OAuthButton
            provider="github"
            iconOnly
            disabled={isSubmitting}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            }
            label="GitHub"
          />
          <OAuthButton
            provider="microsoft"
            iconOnly
            disabled={isSubmitting}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
                  fill="#F25022"
                />
                <path d="M11.4 24H0V12.6h11.4V24z" fill="#00A4EF" />
                <path d="M24 24H12.6V12.6H24V24z" fill="#FFB900" />
                <path d="M24 11.4H12.6V0H24v11.4z" fill="#7FBA00" />
                <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#F25022" />
              </svg>
            }
            label="Microsoft"
          />
        </div>

        <p className="text-cg-neutral-300 mt-5 text-center text-[11px]">
          New here? Your account is created automatically on first sign in.
        </p>
      </div>
    </form>
  )
}
