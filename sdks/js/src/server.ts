import { CanaryGateBase } from './canary-gate-base'
import { CanaryGateOptions } from './types'

export class CanaryGate extends CanaryGateBase {
  constructor(apiKey: string, options: CanaryGateOptions = {}) {
    if (typeof window !== 'undefined') {
      throw new Error(
        '@canarygate/sdk/server is server-only. In browsers import from "@canarygate/sdk/client" instead.'
      )
    }
    super(apiKey, options, true, () => crypto.randomUUID())
  }
}