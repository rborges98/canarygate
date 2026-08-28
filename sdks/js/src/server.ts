import { CanaryGateBase } from './canary-gate-base'
import { CanaryGateOptions } from './types'

export class CanaryGate extends CanaryGateBase {
  constructor(apiKey: string, options: CanaryGateOptions = {}) {
    if (typeof window !== 'undefined') {
      throw new Error(
        '@canarygate/sdk/server is server-only. In browsers import from "@canarygate/sdk/client" instead.'
      )
    }
    if (options.pollIntervalMs !== undefined) {
      throw new Error(
        '"pollIntervalMs" is a browser-only option and has no effect on @canarygate/sdk/server. Remove it, or use @canarygate/sdk/client.'
      )
    }
    super(apiKey, options, true, () => crypto.randomUUID())
  }
}