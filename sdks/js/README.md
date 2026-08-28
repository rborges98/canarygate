# @canarygate/sdk

Feature flag client for [CanaryGate](https://github.com/rborges98/canarygate).

- **Server (Node.js)** — snapshot on `init()` + live updates via SSE, auto-reconnect and heartbeat
- **Browser** — snapshot + polling via `pollIntervalMs`

## Install

```sh
npm install @canarygate/sdk
```

## Quick start

### Server — real-time

```ts
import { CanaryGate } from '@canarygate/sdk/server'

const gate = new CanaryGate('your-api-key', {
  environment: 'production'
})

await gate.init()
// the snapshot is fetched and SSE opens automatically

gate.disconnect() // when shutting down
```

### Browser — cached

```ts
import { CanaryGate } from '@canarygate/sdk/client'

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

The API base URL is resolved automatically from the `CANARYGATE_BASE_URL` environment variable (in browsers, `NEXT_PUBLIC_CANARYGATE_BASE_URL`), falling back to `http://localhost:3001`.

| Option               | Type      | Default                 | Description                                      |
| -------------------- | --------- | ----------------------- | ------------------------------------------------ |
| `environment`        | `string`  | —                       | Environment to evaluate flags against            |
| `pollIntervalMs`     | `number`  | `30000`                 | Browser polling interval in ms (clamped to a 3000ms minimum). Set `0` to disable. Throws if passed to the server entry |
| `reconnectDelay`     | `number`  | `5000`                  | Initial SSE reconnect delay (ms). Server-only; throws on the browser entry |
| `maxReconnectDelay`  | `number`  | `30000`                 | Reconnect delay cap, exponential backoff (ms). Server-only |
| `heartbeatTimeoutMs` | `number`  | `65000`                 | Silence window before treating the stream as dead. Server-only |

## Methods

| Method                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `init()`              | Fetches the snapshot; the server entry opens SSE, the browser entry starts polling |
| `getFlag(key, ctx?)`  | Evaluates one flag (`boolean` or `rollout`)        |
| `getFlags(ctx?)`      | Evaluates all cached flags                         |
| `isStale()`           | Whether the last sync attempt failed               |
| `getLastSyncAt()`     | Timestamp of the last successful sync              |
| `disconnect()`        | Stops the stream and clears timers                 |

## How sync works

1. `init()` fetches a full snapshot from `/sdk/flags`.
2. The server entry always opens an SSE connection that receives granular updates per change; the browser entry polls the snapshot every `pollIntervalMs`.
3. On disconnect, the SDK reconnects with exponential backoff and does a full resync over the snapshot endpoint.

## Entry-point guards

Each entry point is bound to its environment: the server entry throws `Error('@canarygate/sdk/server is server-only. In browsers import from "@canarygate/sdk/client" instead.')` if used where `window` exists, and the client entry throws a browser-only error if used where there is no `window`.

## License

[MIT](./LICENSE)
