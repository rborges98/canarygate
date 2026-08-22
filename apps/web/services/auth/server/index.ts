import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { getDb } from '@canarygate/database/client'
import {
  users,
  sessions,
  accounts,
  verifications
} from '@canarygate/database/schema'
import { Resend } from 'resend'

import 'server-only'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const IS_BUILD_TIME = !process.env.NEXT_RUNTIME

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    if (IS_BUILD_TIME) {
      return ''
    }

    throw new Error(`[web auth] Missing required env var: ${name}`)
  }

  return value
}

function getRequiredUrl(name: string, developmentFallback: string) {
  const value = process.env[name]

  if (value) {
    return value
  }

  if (!IS_PRODUCTION) {
    return developmentFallback
  }

  if (IS_BUILD_TIME) {
    return ''
  }

  throw new Error(`[web auth] Missing required env var: ${name}`)
}

const APP_BASE_URL = getRequiredUrl(
  'NEXT_PUBLIC_APP_URL',
  'http://localhost:3000'
)
const BETTER_AUTH_SECRET = getRequiredEnv('BETTER_AUTH_SECRET')
const RESEND_API_KEY = getRequiredEnv('RESEND_API_KEY')

const resend = new Resend(RESEND_API_KEY)
const RESEND_SENDER =
  process.env.RESEND_SENDER ?? 'CanaryGate <onboarding@resend.dev>'

export const auth = betterAuth({
  baseURL: APP_BASE_URL,
  secret: BETTER_AUTH_SECRET,
  session: {
    expiresIn: IS_PRODUCTION ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60
    }
  },
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications
    }
  }),
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp }) {
        await resend.emails.send({
          from: RESEND_SENDER,
          to: email,
          subject: 'Your CanaryGate sign-in code',
          text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`
        })
      }
    }),
    nextCookies()
  ]
})

export type Auth = typeof auth
