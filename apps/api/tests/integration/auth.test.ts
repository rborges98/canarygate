import { describe, it, expect, vi } from 'vitest'

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

import { isLocalAuthBypassEnabled } from '../../src/plugins/require-session.ts'

describe('Auth / Session', () => {
  it('isLocalAuthBypassEnabled returns false in test environment', () => {
    const result = isLocalAuthBypassEnabled()
    // NODE_ENV is 'test' so it must return false
    expect(result).toBe(false)
  })

  it('requireSession is exported as a function', async () => {
    const { requireSession } = await import('../../src/plugins/require-session.ts')
    expect(typeof requireSession).toBe('function')
  })
})
