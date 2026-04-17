'use client'

import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'
import type { Auth } from './auth'

export const authClient = createAuthClient<Auth>({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [emailOTPClient()],
})

export const { signIn, signOut, useSession } = authClient
