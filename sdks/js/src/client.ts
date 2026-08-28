import { CanaryGateBase } from './canary-gate-base'
import { CanaryGateOptions } from './types'

const ANON_ID_KEY = '__cg_anon_id__'

const SERVER_ONLY_OPTIONS = [
  'reconnectDelay',
  'maxReconnectDelay',
  'heartbeatTimeoutMs'
] as const

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

export class CanaryGate extends CanaryGateBase {
  constructor(apiKey: string, options: CanaryGateOptions = {}) {
    if (typeof window === 'undefined') {
      throw new Error(
        '@canarygate/sdk/client is browser-only. On server runtimes (Node.js, Deno, Bun, Edge) import from "@canarygate/sdk/server" instead.'
      )
    }
    for (const key of SERVER_ONLY_OPTIONS) {
      if (options[key] !== undefined) {
        throw new Error(
          `"${key}" is a server-only option and has no effect on @canarygate/sdk/client. Remove it, or use @canarygate/sdk/server.`
        )
      }
    }
    super(apiKey, options, false, getOrCreateAnonId)
  }
}