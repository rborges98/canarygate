import { CanaryGateBase } from './canary-gate-base'
import { CanaryGateOptions } from './types'

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

export class CanaryGate extends CanaryGateBase {
  constructor(apiKey: string, options: CanaryGateOptions = {}) {
    if (typeof window === 'undefined') {
      throw new Error(
        '@canarygate/sdk/client is browser-only. On server runtimes (Node.js, Deno, Bun, Edge) import from "@canarygate/sdk/server" instead.'
      )
    }
    super(apiKey, options, false, getOrCreateAnonId)
  }
}