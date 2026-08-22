# @canarygate/sdk/js

CanaryGate feature flags SDK for JavaScript/TypeScript. Real-time SSE streaming on server, cached polling on client.

## Installation

```
npm install @canarygate/sdk/js
```

## Client mode (browser)

Flags are fetched once and cached. SSE streams are disabled in the browser to protect the network architecture.

```ts
import { CanaryGate } from '@canarygate/sdk/js/client'

const gate = new CanaryGate('your-api-key', {
  environment: 'production'
})

await gate.init()

const flag = gate.getFlag('feature-rollout-a', { userId: 'user-123' })
if (flag && flag.enabled) {
  console.log(`flag ativo (${flag.type})`)
}

const flags = gate.getFlags()
```

## Server mode (Node.js)

Real-time updates via SSE are enabled by default.

```ts
import { CanaryGate } from '@canarygate/sdk/js/server'

const gate = new CanaryGate('your-api-key', {
  environment: 'production',
  stream: true
})

await gate.init()
// flags are updated in the background via SSE

gate.disconnect()
```

## API

### `new CanaryGate(apiKey, options?)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `http://localhost:3001` | CanaryGate API base URL |
| `environment` | `string` | — | Environment to evaluate flags against |
| `stream` | `boolean` | `false` | Enable real-time SSE updates (server mode only) |
| `reconnectDelay` | `number` | `5000` | Initial SSE reconnect delay (ms) |
| `maxReconnectDelay` | `number` | `30000` | Maximum SSE reconnect delay (ms) |
| `heartbeatTimeoutMs` | `number` | `65000` | Heartbeat timeout before reconnecting (ms) |

### Methods

| Method | Description |
| --- | --- |
| `init()` | Fetch flags and start stream when enabled |
| `getFlag(key, context?)` | Evaluate a single flag (`boolean` or `rollout`) |
| `getFlags(context?)` | Evaluate all cached flags |
| `isStale()` | Whether the last sync failed |
| `getLastSyncAt()` | Timestamp of the last successful sync |
| `disconnect()` | Stop the stream and clear timers |

## License

MIT