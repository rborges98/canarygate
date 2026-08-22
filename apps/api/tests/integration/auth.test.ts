import { describe, it, expect, vi } from 'vitest'

vi.mock('@canarygate/logger', () => ({
  fastifyLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

describe('Auth / Session', () => {
  it('requireSession is exported as a function', async () => {
    const { requireSession } = await import('../../src/plugins/require-session.ts')
    expect(typeof requireSession).toBe('function')
  })
})
