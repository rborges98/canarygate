'use client'

import { createAuthClient } from 'better-auth/react'
import {
  emailOTPClient,
  inferAdditionalFields
} from 'better-auth/client/plugins'
import type { Auth } from './auth'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [emailOTPClient(), inferAdditionalFields<Auth>()]
})

export const { signIn, signOut, useSession } = authClient
