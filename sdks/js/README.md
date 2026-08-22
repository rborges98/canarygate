# @canarygate/sdk/js

Feature flag client for [CanaryGate](https://github.com/rborges98/canarygate).

- **Server (Node.js)** — snapshot on `init()` + live updates via SSE, with auto-reconnect and heartbeat detection
- **Browser** — flags fetched once and cached; SSE stays off to protect your infrastructure

## Install

```sh
npm install @canarygate/sdk/js
```

## Quick start

### Server — real-time

```ts
import { CanaryGate } from '@canarygate/sdk/js/server'

const gate = new CanaryGate('your-api-key', {
  environment: 'production',
  stream: true
})

await gate.init()
// flags keep updating in the background via SSE

gate.disconnect() // when shutting down
```

### Browser — cached

```ts
import { CanaryGate } from '@canarygate/sdk/js/client'

const gate = new CanaryGate('your-api-key', {
  environment: 'production'
})

await gate.init()
```

## Evaluating flags

```ts
const flag = gate.getFlag('new-checkout', { userId: 'user-123' })

if (flag?.enabled) {
  // boolean flag is on,
  // or user-123 falls inside the rollout percentage
}

const allFlags = gate.getFlags({ userId: 'user-123' })
```

Evaluations return a `FlagData`:

```ts
type FlagData =
  | { key: string; type: 'boolean'; enabled: boolean }
  | { key: string; type: 'rollout'; enabled: boolean; percent: number }
```

Rollout evaluation hashes `userId` deterministically — the same user always gets the same result for the same percentage.

## Options

| Option               | Type      | Default                 | Description                                      |
| -------------------- | --------- | ----------------------- | ------------------------------------------------ |
| `baseUrl`            | `string`  | `http://localhost:3001` | CanaryGate API base URL                          |
| `environment`        | `string`  | —                       | Environment to evaluate flags against            |
| `stream`             | `boolean` | `false`                 | Real-time SSE updates (server mode only)         |
| `reconnectDelay`     | `number`  | `5000`                  | Initial SSE reconnect delay (ms)                 |
| `maxReconnectDelay`  | `number`  | `30000`                 | Reconnect delay cap, exponential backoff (ms)    |
| `heartbeatTimeoutMs` | `number`  | `65000`                 | Silence window before treating the stream as dead |

## Methods

| Method                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `init()`              | Fetches flags and starts the stream when enabled   |
| `getFlag(key, ctx?)`  | Evaluates one flag (`boolean` or `rollout`)        |
| `getFlags(ctx?)`      | Evaluates all cached flags                         |
| `isStale()`           | Whether the last sync attempt failed               |
| `getLastSyncAt()`     | Timestamp of the last successful sync              |
| `disconnect()`        | Stops the stream and clears timers                 |

## How sync works

1. `init()` fetches a full snapshot from `/sdk/flags`.
2. With `stream: true`, an SSE connection receives granular updates per change.
3. On disconnect, the SDK reconnects with exponential backoff and does a full resync over the snapshot endpoint.

## License

[MIT](./LICENSE)
