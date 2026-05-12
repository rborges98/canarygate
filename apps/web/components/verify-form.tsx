'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { authClient } from '@/services/auth/client'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp'

type Props = {
  email: string
}

type FormValues = {
  otp: string
}

const OTP_FETCH_OPTIONS = {
  retry: 0
} as const

export function VerifyForm({ email }: Props) {
  const router = useRouter()
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid }
  } = useForm<FormValues>({ defaultValues: { otp: '' }, mode: 'onChange' })

  async function onSubmit({ otp }: FormValues) {
    const { error } = await authClient.signIn.emailOtp({
      email: email ?? '',
      otp,
      fetchOptions: OTP_FETCH_OPTIONS
    })
    if (error) {
      setError('otp', {
        message: error.message ?? 'Invalid or expired code. Please try again.'
      })
      return
    }
    router.push('/orgs')
  }

  async function handleResend() {
    if (!email) {
      return
    }

    await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
      fetchOptions: OTP_FETCH_OPTIONS
    })
  }

  return (
    <div className="grad-border-inner flex flex-col items-center p-6 text-center md:p-8">
      <div className="bg-cg-indigo-800 border-cg-indigo-600 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl">
        ✉
      </div>

      <h2 className="mb-1 text-[20px] font-bold text-white">
        Enter verification code
      </h2>
      <p className="text-cg-neutral-300 mb-1 text-[12px]">
        We sent a 6-digit code to
      </p>
      <p className="text-cg-neutral-300 mb-6 font-sans text-[13px]">
        {email ?? 'your email'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <Controller
          name="otp"
          control={control}
          rules={{ required: true, minLength: 6 }}
          render={({ field }) => (
            <InputOTP
              maxLength={6}
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          )}
        />

        {errors.otp && (
          <p className="text-cg-red-100 mt-3 text-[12px]">
            {errors.otp.message}
          </p>
        )}

        <div className="bg-cg-white-300 border-cg-bg-100 mt-6 mb-6 w-full rounded-lg border px-4 py-3">
          <p className="text-cg-neutral-400 font-sans text-[11px]">
            ⏱ Expires in 5 minutes
          </p>
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="border-cg-indigo-300 hover:bg-cg-indigo-300 bg-cg-indigo-400 mb-6 w-full rounded-lg border py-3 text-[13px] font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Verifying...' : 'Verify code'}
        </button>
      </form>

      <div className="border-cg-bg-100 w-full border-t pt-5">
        <button
          onClick={handleResend}
          disabled={isSubmitting}
          className="btn-ghost w-full text-[12px]"
        >
          Didn&apos;t receive the code? Resend →
        </button>
      </div>
    </div>
  )
}
