import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@canarygate/database/client'
import {
  users,
  sessions,
  accounts,
  verifications
} from '@canarygate/database/schema'

export const auth = betterAuth({
  baseURL: process.env.API_URL ?? 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications
    }
  }),
  trustedOrigins: [process.env.WEB_URL ?? 'http://localhost:3000']
})
