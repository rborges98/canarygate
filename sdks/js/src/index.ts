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
}

type ApiFlagRaw = {
  key: string
  type: 'boolean' | 'rollout'
  enabled: boolean
  rolloutPercent: number
}

type ApiResponse = {
  projectId: string
  flags: ApiFlagRaw[]
}

type ParsedSseEvent = {
  event: string
  data: string
  retryMs?: number
}

const ANON_ID_KEY = '__cg_anon_id__'

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
  return error instanceof DOMException && error.name === 'AbortError'
}

export class CanaryGate {
  private readonly baseUrl: string
  private readonly environment: string | undefined
  private readonly streamEnabled: boolean
  private readonly reconnectDelay: number

  private cache = new Map<string, FlagData>()
  private readonly anonId: string
  private streamAbortController: AbortController | null = null
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private streamRetryDelay: number
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
    this.streamRetryDelay = this.reconnectDelay
    this.anonId = getOrCreateAnonId()
  }

  async init(): Promise<void> {
    await this.fetchFlags()
    if (this.streamEnabled) this.connectStream()
  }

  private async fetchFlags(): Promise<void> {
    try {
      const headers: Record<string, string> = { 'X-Api-Key': this.apiKey }
      if (this.environment) headers['X-Environment'] = this.environment
      const res = await fetch(`${this.baseUrl}/sdk/flags`, { headers })
      if (!res.ok) {
        console.error(
          `[canarygate] Failed to fetch flags: ${res.status} ${res.statusText}`
        )
        return
      }
      const body = (await res.json()) as ApiResponse
      this.cache.clear()
      for (const f of body.flags) {
        this.cache.set(f.key, toFlagData(f, this.anonId))
      }
    } catch (err) {
      console.error('[canarygate] Error fetching flags:', err)
    }
  }

  private handleStreamMessage(event: string, data: string) {
    if (!data) return

    try {
      if (event === 'flag-deleted') {
        const payload = JSON.parse(data) as { key: string }
        this.cache.delete(payload.key)
        return
      }

      if (event === 'flag-updated' || event === 'flag-created') {
        const flag = toFlagData(JSON.parse(data) as ApiFlagRaw, this.anonId)
        this.cache.set(flag.key, flag)
      }
    } catch (err) {
      console.error(`[canarygate] Failed to parse ${event} event:`, err)
    }
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimeout) return

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connectStream()
    }, this.streamRetryDelay)
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
        return
      }

      if (!response.body) {
        console.error('[canarygate] Stream body is not available in this runtime')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!abortController.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break

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
      if (this.streamAbortController === abortController) {
        this.streamAbortController = null
      }

      if (!this.destroyed && !abortController.signal.aborted) {
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

  disconnect(): void {
    this.destroyed = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.streamAbortController?.abort()
    this.streamAbortController = null
  }
}
