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
  baseUrl?: string
  environment?: string
  /** Browser polling interval in ms. Default: 30000; minimum enforced: 3000. Set 0 to disable. Server always uses SSE instead. */
  pollIntervalMs?: number
  reconnectDelay?: number
  maxReconnectDelay?: number
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
