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

export type FlagEvaluationContext = {
  userId?: string
}

export type CanaryGateOptions = {
  environment?: string
  /** Browser polling interval in ms. Default: 30000; minimum enforced: 3000. Set 0 to disable. Throws if set on the server entry. */
  pollIntervalMs?: number
  /** Initial stream reconnect delay in ms. Default: 5000. Server-only. */
  reconnectDelay?: number
  /** Maximum stream reconnect delay in ms. Default: 30000. Server-only. */
  maxReconnectDelay?: number
  /** Time in ms without a server heartbeat before reconnecting the stream. Default: 65000. Server-only. */
  heartbeatTimeoutMs?: number
}

export type ApiFlagRaw = {
  key: string
  type: 'boolean' | 'rollout'
  enabled: boolean
  rolloutPercent: number
  updatedAt: string
}

export type ApiResponse = {
  projectId: string
  environment: string
  flags: ApiFlagRaw[]
}
