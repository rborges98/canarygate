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

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
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

  throw new Error(`[web auth] Missing required env var: ${name}`)
}

const APP_BASE_URL = getRequiredUrl(
  'NEXT_PUBLIC_APP_URL',
  'http://localhost:3000'
)
const BETTER_AUTH_SECRET = getRequiredEnv('BETTER_AUTH_SECRET')
const RESEND_API_KEY = getRequiredEnv('RESEND_API_KEY')
const GOOGLE_CLIENT_ID = getRequiredEnv('GOOGLE_CLIENT_ID')
const GOOGLE_CLIENT_SECRET = getRequiredEnv('GOOGLE_CLIENT_SECRET')
const GITHUB_CLIENT_ID = getRequiredEnv('GITHUB_CLIENT_ID')
const GITHUB_CLIENT_SECRET = getRequiredEnv('GITHUB_CLIENT_SECRET')
const MICROSOFT_CLIENT_ID = getRequiredEnv('MICROSOFT_CLIENT_ID')
const MICROSOFT_CLIENT_SECRET = getRequiredEnv('MICROSOFT_CLIENT_SECRET')

const resend = new Resend(RESEND_API_KEY)

export const auth = betterAuth({
  baseURL: APP_BASE_URL,
  secret: BETTER_AUTH_SECRET,
  session: {
    expiresIn: IS_PRODUCTION ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
    updateAge: 60 * 60 * 24
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
          from: 'CanaryGate <onboarding@resend.dev>',
          to: email,
          subject: 'Your CanaryGate sign-in code',
          text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`
        })
      }
    }),
    nextCookies()
  ],
  socialProviders: {
    google: {
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET
    },
    microsoft: {
      clientId: MICROSOFT_CLIENT_ID,
      clientSecret: MICROSOFT_CLIENT_SECRET
    }
  }
})

export type Auth = typeof auth
