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
    super(apiKey, options, false, getOrCreateAnonId)
    if (options.stream === true) {
      this.warnStreamDisabled()
    }
  }
}
