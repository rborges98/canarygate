# CanaryGate Go SDK

Official Go SDK for CanaryGate, mirroring the server-mode JS SDK. Stdlib only, no external dependencies.

## Installation

```sh
go get github.com/canarygate/sdk-go
```

## Usage

```go
package main

import (
	"log"

	"github.com/canarygate/sdk-go"
)

func main() {
	client := canarygate.New("YOUR_API_KEY", canarygate.Options{
		Environment: "production",
	})

	if err := client.Init(); err != nil {
		log.Fatalf("[canarygate] failed to initialize: %v", err)
	}
	defer client.Disconnect()

	flag := client.GetFlag("new-checkout", &canarygate.FlagEvaluationContext{
		UserID: "user-42",
	})
	log.Printf("new-checkout: enabled=%v percent=%d", flag.Enabled, flag.Percent)
}
```

## Real-time updates (optional)

Set `Stream: true` to keep the cache in sync over SSE:

```go
import "time"

client := canarygate.New("YOUR_API_KEY", canarygate.Options{
	Environment:  "production",
	Stream:       true,
	ReconnectDelay: 5 * time.Second,
})
```

## API

- `New(apiKey string, opts Options) *Client`
- `Init() error` — fetches the flag snapshot; starts the SSE stream if enabled.
- `GetFlag(key string, ctx *FlagEvaluationContext) *FlagData` — `nil` if the key is unknown.
- `GetFlags(ctx *FlagEvaluationContext) []FlagData`
- `IsStale() bool`
- `GetLastSyncAt() *string`
- `Disconnect()` — stops the stream and pending reconnections.
