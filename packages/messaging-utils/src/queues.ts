export const SCHEDULE_QUEUE_NAME = 'flag-schedule'
export const AUTO_ROLLOUT_QUEUE_NAME = 'flag-auto-rollout'

export const SCHEDULE_JOB_NAME = 'process-schedule'
export const AUTO_ROLLOUT_JOB_NAME = 'process-auto-rollout'

export const FLAG_JOB_ATTEMPTS = 5
export const FLAG_JOB_BACKOFF_DELAY_MS = 5_000
export const SCHEDULE_SCAN_INTERVAL_MS = 60_000

export type ScheduleJobData = {
  flagEnvironmentId: string
  flagId: string
  projectId: string
  environmentId: string
  environmentSlug: string
  flagKey: string
  dueAt: string
}

export type AutoRolloutJobData = {
  flagEnvironmentId: string
  flagId: string
  projectId: string
  environmentId: string
  environmentSlug: string
  flagKey: string
  dueAt: string
}

function sanitizeJobIdPart(value: string) {
  return value.replace(/:/g, '-')
}

export function buildScheduleJobId(data: ScheduleJobData) {
  return `${SCHEDULE_JOB_NAME}-${data.flagEnvironmentId}-${sanitizeJobIdPart(data.dueAt)}`
}

export function buildAutoRolloutJobId(data: AutoRolloutJobData) {
  return `${AUTO_ROLLOUT_JOB_NAME}-${data.flagEnvironmentId}-${sanitizeJobIdPart(data.dueAt)}`
}
