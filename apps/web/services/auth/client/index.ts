'use client'

import { createAuthClient } from 'better-auth/react'
import {
  emailOTPClient,
  inferAdditionalFields
} from 'better-auth/client/plugins'
import type { Auth } from '../server'

const AUTH_CLIENT_RETRY_ATTEMPTS = 2
const AUTH_CLIENT_RETRY_DELAY_MS = 250

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  fetchOptions: {
    retry: {
      type: 'linear',
      attempts: AUTH_CLIENT_RETRY_ATTEMPTS,
      delay: AUTH_CLIENT_RETRY_DELAY_MS
    }
  },
  sessionOptions: {
    refetchOnWindowFocus: true
  },
  plugins: [emailOTPClient(), inferAdditionalFields<Auth>()]
})

export const { signIn, signOut, useSession } = authClient
