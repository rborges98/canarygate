import { calcIntervalMs } from './time'

describe('calcIntervalMs', () => {
  it('returns 3_600_000 for 1 hour', () => {
    expect(calcIntervalMs(1, 'hours')).toBe(3_600_000)
  })

  it('returns 7_200_000 for 2 hours', () => {
    expect(calcIntervalMs(2, 'hours')).toBe(7_200_000)
  })

  it('returns 86_400_000 for 1 day', () => {
    expect(calcIntervalMs(1, 'days')).toBe(86_400_000)
  })

  it('returns 604_800_000 for 7 days', () => {
    expect(calcIntervalMs(7, 'days')).toBe(604_800_000)
  })

  it('returns 604_800_000 for 1 week', () => {
    expect(calcIntervalMs(1, 'weeks')).toBe(604_800_000)
  })

  it('1 day equals 24 hours', () => {
    expect(calcIntervalMs(1, 'days')).toBe(calcIntervalMs(24, 'hours'))
  })

  it('1 week equals 7 days', () => {
    expect(calcIntervalMs(1, 'weeks')).toBe(calcIntervalMs(7, 'days'))
  })

  it('returns 0 for 0 hours', () => {
    expect(calcIntervalMs(0, 'hours')).toBe(0)
  })
})
