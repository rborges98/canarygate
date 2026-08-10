import { CanaryGateBase } from './canary-gate-base'
import { CanaryGateOptions } from './types'

export class CanaryGate extends CanaryGateBase {
  constructor(apiKey: string, options: CanaryGateOptions = {}) {
    super(apiKey, options, options.stream ?? false, () => crypto.randomUUID())
  }
}
