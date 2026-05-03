export function calcIntervalMs(
  value: number,
  unit: 'hours' | 'days' | 'weeks'
): number {
  const multipliers = { hours: 3_600_000, days: 86_400_000, weeks: 604_800_000 }
  return value * multipliers[unit]
}