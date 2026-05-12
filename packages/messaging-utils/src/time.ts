const HOUR_IN_MS = 60 * 60 * 1000
const DAY_IN_MS = 24 * HOUR_IN_MS
const WEEK_IN_MS = 7 * DAY_IN_MS

export type EveryUnit = 'hours' | 'days' | 'weeks'

export function calcIntervalMs(value: number, unit: EveryUnit) {
  if (unit === 'hours') {
    return value * HOUR_IN_MS
  }

  if (unit === 'days') {
    return value * DAY_IN_MS
  }

  return value * WEEK_IN_MS
}
