'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { authClient } from '@/services/auth/client'

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

      <label
        htmlFor="login-email"
        className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]"
      >
        Email address
      </label>
      <input
        id="login-email"
        type="email"
        placeholder="you@email.com"
        autoComplete="email"
        disabled={isSubmitting}
        className="placeholder:text-cg-neutral-300 text-cg-neutral-100 bg-cg-white-200 border-cg-bg-100 focus:border-cg-indigo-300 focus-visible:ring-cg-indigo-300 mb-4 w-full rounded-lg border px-4 py-3 text-[12px] transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
        {...register('email', { required: true })}
      />

      {errors.email && (
        <p role="alert" className="mb-3 text-[11px] text-red-400">
          {errors.email.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="border-cg-indigo-300 hover:bg-cg-indigo-300 bg-cg-indigo-400 mb-6 w-full rounded-lg border py-3 text-[13px] font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending…' : 'Continue with email'}
      </button>

      <div className="border-cg-bg-100 border-t pt-5">
        <p className="text-cg-neutral-300 text-center text-[11px]">
          New here? Your account is created automatically on first sign in.
        </p>
      </div>
    </form>
  )
}
