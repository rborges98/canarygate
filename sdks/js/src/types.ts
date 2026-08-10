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
  stream?: boolean
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
