export type BooleanFlagData = {
  key: string
  type: 'boolean'
  enabled: boolean
}

export type RolloutFlagData = {
  key: string
  type: 'rollout'
  enabled: boolean
  percent: number
}

export type FlagData = BooleanFlagData | RolloutFlagData

export type CanaryGateOptions = {
  baseUrl?: string
  environment?: string
  stream?: boolean
  reconnectDelay?: number
  maxReconnectDelay?: number
  heartbeatTimeoutMs?: number
}

type ApiFlagRaw = {
  key: string
  type: 'boolean' | 'rollout'
  enabled: boolean
  rolloutPercent: number
  updatedAt: string
}

type ApiResponse = {
  projectId: string
  environment: string
  flags: ApiFlagRaw[]
}

type ParsedSseEvent = {
  event: string
  data: string
  retryMs?: number
}

const ANON_ID_KEY = '__cg_anon_id__'
const DEFAULT_MAX_RECONNECT_DELAY_MS = 30_000
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 65_000

function getOrCreateAnonId(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(ANON_ID_KEY)
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem(ANON_ID_KEY, id)
    return id
  }
  return crypto.randomUUID()
}

function hashString(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
    hash = hash >>> 0
  }
  return hash % 100
}

function toFlagData(raw: ApiFlagRaw, anonId: string): FlagData {
  if (raw.type === 'rollout') {
    const inRollout =
      raw.enabled && hashString(`${raw.key}:${anonId}`) < raw.rolloutPercent
    return {
      key: raw.key,
      type: 'rollout',
      enabled: inRollout,
      percent: raw.rolloutPercent
    }
  }
  return { key: raw.key, type: 'boolean', enabled: raw.enabled }
}

function parseSseEventBlock(block: string): ParsedSseEvent | null {
  let event = 'message'
  const dataLines: string[] = []
  let retryMs: number | undefined

  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    const value =
      separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).trimStart()

    if (field === 'event') {
      event = value || 'message'
      continue
    }

    if (field === 'data') {
      dataLines.push(value)
      continue
    }

    if (field === 'retry') {
      const parsedRetryMs = Number.parseInt(value, 10)
      if (Number.isFinite(parsedRetryMs) && parsedRetryMs > 0) {
        retryMs = parsedRetryMs
      }
    }
  }

  if (dataLines.length === 0 && retryMs === undefined) {
    return null
  }

  return {
    event,
    data: dataLines.join('\n'),
    retryMs
  }
}

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  )
}

function parseTimestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export class CanaryGate {
  private readonly baseUrl: string
  private readonly environment: string | undefined
  private readonly streamEnabled: boolean
  private readonly reconnectDelay: number
  private readonly maxReconnectDelay: number
  private readonly heartbeatTimeoutMs: number

  private cache = new Map<string, FlagData>()
  private cacheVersions = new Map<string, number>()
  private readonly anonId: string
  private streamAbortController: AbortController | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null
  private streamRetryDelay: number
  private reconnectAttempts = 0
  private stale = false
  private lastSyncAt: string | null = null
  private destroyed = false

  constructor(
    private readonly apiKey: string,
    options: CanaryGateOptions = {}
  ) {
    this.baseUrl = (options.baseUrl ?? 'http://localhost:3001').replace(
      /\/$/,
      ''
    )
    this.environment = options.environment
    this.streamEnabled = options.stream ?? true
    this.reconnectDelay = options.reconnectDelay ?? 5_000
    this.maxReconnectDelay = Math.max(
      options.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY_MS,
      this.reconnectDelay
    )
    this.heartbeatTimeoutMs =
      options.heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS
    this.streamRetryDelay = this.reconnectDelay
    this.anonId = getOrCreateAnonId()
  }

  async init(): Promise<void> {
    await this.fetchFlags()
    if (this.streamEnabled) this.connectStream()
  }

  private replaceCacheFromSnapshot(flags: ApiFlagRaw[], requestedAt: number) {
    const nextCache = new Map<string, FlagData>()
    const nextVersions = new Map<string, number>()

    for (const flag of flags) {
      const nextVersion = parseTimestamp(flag.updatedAt)
      const currentVersion = this.cacheVersions.get(flag.key) ?? -1

      if (currentVersion > nextVersion && currentVersion > requestedAt) {
        const currentFlag = this.cache.get(flag.key)
        if (currentFlag) {
          nextCache.set(flag.key, currentFlag)
        }
        nextVersions.set(flag.key, currentVersion)
        continue
      }

      nextCache.set(flag.key, toFlagData(flag, this.anonId))
      nextVersions.set(flag.key, nextVersion)
    }

    for (const [key, currentVersion] of this.cacheVersions) {
      if (nextVersions.has(key) || currentVersion <= requestedAt) {
        continue
      }

      const currentFlag = this.cache.get(key)
      if (currentFlag) {
        nextCache.set(key, currentFlag)
      }
      nextVersions.set(key, currentVersion)
    }

    this.cache = nextCache
    this.cacheVersions = nextVersions
    this.stale = false
    this.lastSyncAt = new Date().toISOString()
  }

  private async fetchFlags(): Promise<boolean> {
    const requestedAt = Date.now()

    try {
      const headers: Record<string, string> = { 'X-Api-Key': this.apiKey }
      if (this.environment) headers['X-Environment'] = this.environment
      const res = await fetch(`${this.baseUrl}/sdk/flags`, { headers })
      if (!res.ok) {
        console.error(
          `[canarygate] Failed to fetch flags: ${res.status} ${res.statusText}`
        )
        this.stale = true
        return false
      }

      const body = (await res.json()) as ApiResponse
      this.replaceCacheFromSnapshot(body.flags, requestedAt)
      return true
    } catch (err) {
      console.error('[canarygate] Error fetching flags:', err)
      this.stale = true
      return false
    }
  }

  private applyFlagUpdate(raw: ApiFlagRaw) {
    const nextVersion = parseTimestamp(raw.updatedAt)
    const currentVersion = this.cacheVersions.get(raw.key) ?? -1

    if (nextVersion < currentVersion) {
      return
    }

    this.cacheVersions.set(raw.key, nextVersion)
    this.cache.set(raw.key, toFlagData(raw, this.anonId))
  }

  private applyFlagDeletion(payload: { key: string; deletedAt: string }) {
    const nextVersion = parseTimestamp(payload.deletedAt)
    const currentVersion = this.cacheVersions.get(payload.key) ?? -1

    if (nextVersion < currentVersion) {
      return
    }

    this.cacheVersions.set(payload.key, nextVersion)
    this.cache.delete(payload.key)
  }

  private handleStreamMessage(event: string, data: string) {
    if (event === 'connected' || event === 'connection-closing') {
      return
    }

    if (!data) return

    try {
      if (event === 'flag-deleted') {
        const payload = JSON.parse(data) as { key: string; deletedAt: string }
        this.applyFlagDeletion(payload)
        return
      }

      if (event === 'flag-updated' || event === 'flag-created') {
        this.applyFlagUpdate(JSON.parse(data) as ApiFlagRaw)
      }
    } catch (err) {
      console.error(`[canarygate] Failed to parse ${event} event:`, err)
    }
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  private bumpHeartbeatTimeout(abortController: AbortController) {
    this.clearHeartbeatTimeout()

    this.heartbeatTimeout = setTimeout(() => {
      if (this.streamAbortController === abortController && !this.destroyed) {
        abortController.abort()
      }
    }, this.heartbeatTimeoutMs)
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimeout) return

    const nextDelay = Math.min(
      this.streamRetryDelay * 2 ** this.reconnectAttempts,
      this.maxReconnectDelay
    )
    this.reconnectAttempts += 1

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connectStream()
    }, nextDelay)
  }

  private async consumeStream(abortController: AbortController) {
    try {
      const headers: Record<string, string> = { 'X-Api-Key': this.apiKey }
      if (this.environment) headers['X-Environment'] = this.environment

      const response = await fetch(`${this.baseUrl}/sdk/stream`, {
        headers,
        signal: abortController.signal,
        cache: 'no-store'
      })

      if (!response.ok) {
        console.error(
          `[canarygate] Failed to connect stream: ${response.status} ${response.statusText}`
        )
        this.stale = true
        return
      }

      if (!response.body) {
        console.error('[canarygate] Stream body is not available in this runtime')
        this.stale = true
        return
      }

      this.reconnectAttempts = 0
      this.bumpHeartbeatTimeout(abortController)

      if (this.stale) {
        await this.fetchFlags()
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!abortController.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break

        this.bumpHeartbeatTimeout(abortController)
        buffer += decoder.decode(value, { stream: true })

        const blocks = buffer.split(/\r?\n\r?\n/)
        buffer = blocks.pop() ?? ''

        for (const block of blocks) {
          const parsedEvent = parseSseEventBlock(block)
          if (!parsedEvent) continue

          if (parsedEvent.retryMs !== undefined) {
            this.streamRetryDelay = parsedEvent.retryMs
          }

          this.handleStreamMessage(parsedEvent.event, parsedEvent.data)
        }
      }

      buffer += decoder.decode()

      if (buffer.trim()) {
        const parsedEvent = parseSseEventBlock(buffer)
        if (parsedEvent) {
          if (parsedEvent.retryMs !== undefined) {
            this.streamRetryDelay = parsedEvent.retryMs
          }

          this.handleStreamMessage(parsedEvent.event, parsedEvent.data)
        }
      }
    } catch (err) {
      if (!isAbortError(err)) {
        console.error('[canarygate] Stream connection failed:', err)
      }
    } finally {
      this.clearHeartbeatTimeout()

      if (this.streamAbortController === abortController) {
        this.streamAbortController = null
      }

      if (!this.destroyed) {
        this.stale = true
        this.scheduleReconnect()
      }
    }
  }

  private connectStream(): void {
    if (this.destroyed || this.streamAbortController) return

    const abortController = new AbortController()
    this.streamAbortController = abortController
    void this.consumeStream(abortController)
  }

  getFlag(key: string): FlagData | undefined {
    return this.cache.get(key)
  }

  getFlags(): FlagData[] {
    return Array.from(this.cache.values())
  }

  isStale(): boolean {
    return this.stale
  }

  getLastSyncAt(): string | null {
    return this.lastSyncAt
  }

  disconnect(): void {
    this.destroyed = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.clearHeartbeatTimeout()
    this.streamAbortController?.abort()
    this.streamAbortController = null
  }
}
