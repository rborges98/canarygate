import { afterEach, describe, expect, it } from 'vitest'
import { isLocalAuthBypassEnabled } from './bypass'

const ORIGINAL_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  BYPASS_AUTH: process.env.BYPASS_AUTH,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  API_URL: process.env.API_URL
}

function restoreEnv(name: keyof typeof ORIGINAL_ENV) {
  const value = ORIGINAL_ENV[name]

  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}

afterEach(() => {
  restoreEnv('NODE_ENV')
  restoreEnv('BYPASS_AUTH')
  restoreEnv('NEXT_PUBLIC_APP_URL')
  restoreEnv('API_URL')
})

describe('isLocalAuthBypassEnabled', () => {
  it('returns true for local development bypass', () => {
    process.env.NODE_ENV = 'development'
    process.env.BYPASS_AUTH = 'true'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.API_URL = 'http://127.0.0.1:3001'

    expect(isLocalAuthBypassEnabled()).toBe(true)
  })

  it('returns false when bypass is disabled', () => {
    process.env.NODE_ENV = 'development'
    process.env.BYPASS_AUTH = 'false'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.API_URL = 'http://localhost:3001'

    expect(isLocalAuthBypassEnabled()).toBe(false)
  })

  it('returns false for non-local urls', () => {
    process.env.NODE_ENV = 'development'
    process.env.BYPASS_AUTH = 'true'
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.canarygate.com'
    process.env.API_URL = 'http://localhost:3001'

    expect(isLocalAuthBypassEnabled()).toBe(false)
  })
})
