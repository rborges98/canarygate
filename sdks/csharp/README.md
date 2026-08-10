# CanaryGate C# SDK

Official C# SDK for CanaryGate feature flags (server mode), mirroring the server-mode JavaScript SDK. Requires .NET 8+.

## Installation

```bash
dotnet add package CanaryGate
```

## Quick start

```csharp
using CanaryGate;

var client = new CanaryGateClient("cg_api_key", new Options
{
    Environment = "production",
    Stream = true,
});

await client.InitAsync();

var flag = client.GetFlag("new-checkout", new FlagEvaluationContext
{
    UserId = "user-42",
});

if (flag?.Enabled == true)
{
    // Enabled for this user
}

client.Disconnect();
```

## API

| Member | Description |
| --- | --- |
| `CanaryGateClient(string apiKey, Options? options = null)` | Creates a client. |
| `Task InitAsync()` | Fetches the flag snapshot; starts the SSE stream when `Options.Stream` is true. Throws `InvalidOperationException` if the initial fetch fails. |
| `FlagData? GetFlag(string key, FlagEvaluationContext? context = null)` | Evaluates a flag; `null` if the key is unknown. |
| `IReadOnlyList<FlagData> GetFlags(FlagEvaluationContext? context = null)` | Evaluates all cached flags. |
| `bool IsStale()` | `true` when the last sync failed or the stream is down. |
| `string? GetLastSyncAt()` | ISO timestamp of the last successful sync, or `null`. |
| `void Disconnect()` | Stops the stream, cancels pending reconnects and releases resources. |

The client implements `IDisposable`.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `BaseUrl` | `http://localhost:3001` | API base URL. |
| `Environment` | `null` | Sent via the `X-Environment` header. |
| `Stream` | `false` | Opt in to real-time SSE updates. |
| `ReconnectDelay` | `5s` | Initial reconnect backoff. |
| `MaxReconnectDelay` | `30s` | Maximum backoff (never below `ReconnectDelay`). |
| `HeartbeatTimeout` | `65s` | Time without data before the stream is considered dead and reconnects. |

## Evaluation

Rollout flags hash `${key}:${evaluationId}` with djb2 (32-bit wrap) and compare the result (0-99) against the rollout percentage. `evaluationId` is the `UserId` from the context or a per-instance anonymous id.

## Tests

```bash
dotnet test sdks/csharp/tests/CanaryGate.Tests
```
