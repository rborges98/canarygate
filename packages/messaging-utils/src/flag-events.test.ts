import {
  buildFlagEventsChannel,
  buildLocalFlagStreamKey,
  serializeFlagEventEnvelope,
  parseFlagEventEnvelope,
  FLAG_EVENTS_CHANNEL_PREFIX,
} from './flag-events'

describe('FLAG_EVENTS_CHANNEL_PREFIX', () => {
  it('is flag-events', () => {
    expect(FLAG_EVENTS_CHANNEL_PREFIX).toBe('flag-events')
  })
})

describe('buildFlagEventsChannel', () => {
  it('returns flag-events:{projectId}:{environmentId}', () => {
    expect(buildFlagEventsChannel('proj-1', 'env-1')).toBe('flag-events:proj-1:env-1')
  })
})

describe('buildLocalFlagStreamKey', () => {
  it('returns {projectId}:{environmentId}', () => {
    expect(buildLocalFlagStreamKey('proj-1', 'env-1')).toBe('proj-1:env-1')
  })
})

describe('serializeFlagEventEnvelope', () => {
  it('serializes a flag-created envelope to valid JSON with all fields', () => {
    const envelope = {
      event: 'flag-created' as const,
      projectId: 'proj-1',
      environmentId: 'env-1',
      data: {
        key: 'my-flag',
        type: 'boolean' as const,
        enabled: true,
        rolloutPercent: 0,
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    }

    const result = serializeFlagEventEnvelope(envelope)
    const parsed = JSON.parse(result)

    expect(parsed.event).toBe('flag-created')
    expect(parsed.projectId).toBe('proj-1')
    expect(parsed.environmentId).toBe('env-1')
    expect(parsed.data.key).toBe('my-flag')
    expect(parsed.data.type).toBe('boolean')
    expect(parsed.data.enabled).toBe(true)
    expect(parsed.data.rolloutPercent).toBe(0)
  })

  it('serializes a flag-deleted envelope to valid JSON', () => {
    const envelope = {
      event: 'flag-deleted' as const,
      projectId: 'proj-1',
      environmentId: 'env-1',
      data: {
        key: 'my-flag',
        deletedAt: '2025-01-01T00:00:00.000Z',
      },
    }

    const result = serializeFlagEventEnvelope(envelope)
    const parsed = JSON.parse(result)

    expect(parsed.event).toBe('flag-deleted')
    expect(parsed.data.key).toBe('my-flag')
    expect(parsed.data.deletedAt).toBe('2025-01-01T00:00:00.000Z')
  })
})

describe('parseFlagEventEnvelope', () => {
  it('parses a valid flag-updated JSON and returns typed object', () => {
    const json = JSON.stringify({
      event: 'flag-updated',
      projectId: 'proj-1',
      environmentId: 'env-1',
      data: {
        key: 'my-flag',
        type: 'rollout',
        enabled: true,
        rolloutPercent: 50,
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    })

    const result = parseFlagEventEnvelope(json)

    expect(result.event).toBe('flag-updated')
    expect(result.projectId).toBe('proj-1')
    expect(result.environmentId).toBe('env-1')
    expect(result.data.key).toBe('my-flag')
  })

  it('parses a valid flag-deleted JSON and returns typed object', () => {
    const json = JSON.stringify({
      event: 'flag-deleted',
      projectId: 'proj-2',
      environmentId: 'env-2',
      data: {
        key: 'deleted-flag',
        deletedAt: '2025-06-01T00:00:00.000Z',
      },
    })

    const result = parseFlagEventEnvelope(json)

    expect(result.event).toBe('flag-deleted')
    expect(result.data.key).toBe('deleted-flag')
  })

  it('round-trips: parse(serialize(envelope)) deep-equals original envelope', () => {
    const envelope = {
      event: 'flag-created' as const,
      projectId: 'proj-3',
      environmentId: 'env-3',
      data: {
        key: 'round-trip-flag',
        type: 'boolean' as const,
        enabled: false,
        rolloutPercent: 0,
        updatedAt: '2025-03-15T10:30:00.000Z',
      },
    }

    expect(parseFlagEventEnvelope(serializeFlagEventEnvelope(envelope))).toEqual(envelope)
  })

  it('throws Error when event field is missing', () => {
    const json = JSON.stringify({
      projectId: 'proj-1',
      environmentId: 'env-1',
      data: { key: 'my-flag', deletedAt: '2025-01-01T00:00:00.000Z' },
    })

    expect(() => parseFlagEventEnvelope(json)).toThrow('Invalid flag event envelope')
  })

  it('throws Error when projectId field is missing', () => {
    const json = JSON.stringify({
      event: 'flag-deleted',
      environmentId: 'env-1',
      data: { key: 'my-flag', deletedAt: '2025-01-01T00:00:00.000Z' },
    })

    expect(() => parseFlagEventEnvelope(json)).toThrow('Invalid flag event envelope')
  })

  it('throws SyntaxError when input is not valid JSON', () => {
    expect(() => parseFlagEventEnvelope('not-valid-json')).toThrow(SyntaxError)
  })
})
