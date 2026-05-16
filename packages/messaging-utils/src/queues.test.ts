import {
  buildScheduleJobId,
  buildAutoRolloutJobId,
  SCHEDULE_QUEUE_NAME,
  AUTO_ROLLOUT_QUEUE_NAME,
  SCHEDULE_JOB_NAME,
  AUTO_ROLLOUT_JOB_NAME,
  FLAG_JOB_ATTEMPTS,
} from './queues'

describe('constants', () => {
  it('SCHEDULE_QUEUE_NAME is flag-schedule', () => {
    expect(SCHEDULE_QUEUE_NAME).toBe('flag-schedule')
  })

  it('AUTO_ROLLOUT_QUEUE_NAME is flag-auto-rollout', () => {
    expect(AUTO_ROLLOUT_QUEUE_NAME).toBe('flag-auto-rollout')
  })

  it('FLAG_JOB_ATTEMPTS is 5', () => {
    expect(FLAG_JOB_ATTEMPTS).toBe(5)
  })
})

const baseScheduleData = {
  flagEnvironmentId: 'fenv-abc',
  flagId: 'flag-123',
  projectId: 'proj-1',
  environmentId: 'env-1',
  environmentSlug: 'production',
  flagKey: 'my-flag',
  dueAt: '2025-01-01T12:00:00.000Z',
}

describe('buildScheduleJobId', () => {
  it('returns string with format process-schedule-{flagEnvironmentId}-{sanitizedDueAt}', () => {
    const result = buildScheduleJobId(baseScheduleData)
    expect(result).toBe(`${SCHEDULE_JOB_NAME}-fenv-abc-2025-01-01T12-00-00.000Z`)
  })

  it('sanitizes dueAt by replacing colons with dashes', () => {
    const result = buildScheduleJobId({ ...baseScheduleData, dueAt: '2025-06-15T08:30:45.000Z' })
    expect(result).not.toContain(':')
    expect(result).toContain('2025-06-15T08-30-45.000Z')
  })
})

describe('buildAutoRolloutJobId', () => {
  it('returns string with format process-auto-rollout-{flagEnvironmentId}-{sanitizedDueAt}', () => {
    const result = buildAutoRolloutJobId(baseScheduleData)
    expect(result).toBe(`${AUTO_ROLLOUT_JOB_NAME}-fenv-abc-2025-01-01T12-00-00.000Z`)
  })
})

describe('job ID uniqueness', () => {
  it('buildScheduleJobId and buildAutoRolloutJobId produce different IDs for the same data', () => {
    const scheduleId = buildScheduleJobId(baseScheduleData)
    const autoRolloutId = buildAutoRolloutJobId(baseScheduleData)
    expect(scheduleId).not.toBe(autoRolloutId)
  })

  it('different flagEnvironmentIds with the same dueAt produce different IDs', () => {
    const id1 = buildScheduleJobId({ ...baseScheduleData, flagEnvironmentId: 'fenv-aaa' })
    const id2 = buildScheduleJobId({ ...baseScheduleData, flagEnvironmentId: 'fenv-bbb' })
    expect(id1).not.toBe(id2)
  })
})
