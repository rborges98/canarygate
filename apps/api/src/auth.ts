import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@canarygate/database/client'
import {
  users,
  sessions,
  accounts,
  verifications
} from '@canarygate/database/schema'
import { getRequiredEnv, getRequiredUrl, IS_PRODUCTION } from './utils/env.ts'

const API_BASE_URL = getRequiredUrl(
  'API_URL',
  'http://localhost:3001',
  'api auth'
)
const WEB_BASE_URL = getRequiredUrl(
  'WEB_URL',
  'http://localhost:3000',
  'api auth'
)
const BETTER_AUTH_SECRET = getRequiredEnv('BETTER_AUTH_SECRET', 'api auth')

export const auth = betterAuth({
  session: {
    expiresIn: IS_PRODUCTION ? 60 * 60 * 24 * 7 : 60 * 60 * 24,
    updateAge: 60 * 60 * 24
  },
  baseURL: API_BASE_URL,
  secret: BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications
    }
  }),
  trustedOrigins: [WEB_BASE_URL]
})
