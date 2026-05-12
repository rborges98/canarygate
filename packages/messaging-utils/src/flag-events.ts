export type FlagType = 'boolean' | 'rollout'

export type FlagUpsertEventData = {
  key: string
  type: FlagType
  enabled: boolean
  rolloutPercent: number
  updatedAt: string
}

export type FlagDeletedEventData = {
  key: string
  deletedAt: string
}

export type FlagEventName = 'flag-created' | 'flag-updated' | 'flag-deleted'

export type FlagEventEnvelope =
  | {
      event: 'flag-created' | 'flag-updated'
      projectId: string
      environmentId: string
      data: FlagUpsertEventData
    }
  | {
      event: 'flag-deleted'
      projectId: string
      environmentId: string
      data: FlagDeletedEventData
    }

export const FLAG_EVENTS_CHANNEL_PREFIX = 'flag-events'
export const FLAG_EVENTS_CHANNEL_PATTERN = `${FLAG_EVENTS_CHANNEL_PREFIX}:*`

export function buildFlagEventsChannel(
  projectId: string,
  environmentId: string
) {
  return `${FLAG_EVENTS_CHANNEL_PREFIX}:${projectId}:${environmentId}`
}

export function buildLocalFlagStreamKey(
  projectId: string,
  environmentId: string
) {
  return `${projectId}:${environmentId}`
}

export function serializeFlagEventEnvelope(envelope: FlagEventEnvelope) {
  return JSON.stringify(envelope)
}

export function parseFlagEventEnvelope(message: string): FlagEventEnvelope {
  const parsed = JSON.parse(message) as Partial<FlagEventEnvelope>

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.event !== 'string' ||
    typeof parsed.projectId !== 'string' ||
    typeof parsed.environmentId !== 'string' ||
    !parsed.data ||
    typeof parsed.data !== 'object'
  ) {
    throw new Error('Invalid flag event envelope')
  }

  return parsed as FlagEventEnvelope
}
