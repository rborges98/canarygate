// Package canarygate is the official Go SDK for the CanaryGate feature flag
// service. It mirrors the behavior of the server-mode JavaScript SDK.
package canarygate

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	defaultBaseURL           = "http://localhost:3001"
	defaultReconnectDelay    = 5 * time.Second
	defaultMaxReconnectDelay = 30 * time.Second
	defaultHeartbeatTimeout  = 65 * time.Second
)

// Options configures a CanaryGate client.
type Options struct {
	BaseURL            string
	Environment        string
	Stream             bool
	ReconnectDelay     time.Duration
	MaxReconnectDelay  time.Duration
	HeartbeatTimeoutMs time.Duration
}

// FlagEvaluationContext identifies the user a flag is evaluated for.
type FlagEvaluationContext struct {
	UserID string
}

// FlagData is the evaluated result of a single flag. Type is "boolean" or
// "rollout"; Percent is only meaningful for rollout flags.
type FlagData struct {
	Key     string
	Type    string
	Enabled bool
	Percent int
}

// apiFlagRaw is the raw representation of a flag returned by the API.
type apiFlagRaw struct {
	Key            string
	Type           string
	Enabled        bool
	RolloutPercent int
	UpdatedAt      string
}

type flagDeletionPayload struct {
	Key       string `json:"key"`
	DeletedAt string `json:"deletedAt"`
}

// Client is a CanaryGate client. Create one with New and call Init to load
// the initial flag snapshot. All methods are safe for concurrent use.
type Client struct {
	apiKey      string
	baseURL     string
	environment string
	stream      bool

	reconnectDelay     time.Duration
	maxReconnectDelay  time.Duration
	heartbeatTimeoutMs time.Duration

	mu         sync.Mutex
	cache      map[string]apiFlagRaw
	versions   map[string]int64
	anonID     string
	stale      bool
	lastSyncAt *string

	destroyed bool
	cancel    func()
	wg        sync.WaitGroup

	streamRetryDelay  time.Duration
	reconnectAttempts int
}

// New creates a CanaryGate client with the given api key and options.
func New(apiKey string, opts Options) *Client {
	baseURL := strings.TrimRight(opts.BaseURL, "/")
	if baseURL == "" {
		baseURL = defaultBaseURL
	}

	reconnectDelay := opts.ReconnectDelay
	if reconnectDelay <= 0 {
		reconnectDelay = defaultReconnectDelay
	}
	maxReconnectDelay := opts.MaxReconnectDelay
	if maxReconnectDelay <= 0 {
		maxReconnectDelay = defaultMaxReconnectDelay
	}
	if maxReconnectDelay < reconnectDelay {
		maxReconnectDelay = reconnectDelay
	}
	heartbeatTimeout := opts.HeartbeatTimeoutMs
	if heartbeatTimeout <= 0 {
		heartbeatTimeout = defaultHeartbeatTimeout
	}

	return &Client{
		apiKey:             apiKey,
		baseURL:            baseURL,
		environment:        opts.Environment,
		stream:             opts.Stream,
		reconnectDelay:     reconnectDelay,
		maxReconnectDelay:  maxReconnectDelay,
		heartbeatTimeoutMs: heartbeatTimeout,
		cache:              make(map[string]apiFlagRaw),
		versions:           make(map[string]int64),
		anonID:             newUUIDv4(),
		streamRetryDelay:   reconnectDelay,
	}
}

// Init fetches the initial snapshot of flags and, if Stream is enabled, starts
// the SSE stream. It returns an error only if the initial fetch fails; a later
// stream failure never makes Init return an error.
func (c *Client) Init() error {
	if err := c.fetchFlags(); err != nil {
		return err
	}
	if c.stream {
		c.connectStream()
	}
	return nil
}

// GetFlag evaluates the flag with the given key. If ctx is nil or its UserID
// is empty, the client's anonymous ID is used as the evaluation ID. It returns
// nil if the key is not in the cache.
func (c *Client) GetFlag(key string, ctx *FlagEvaluationContext) *FlagData {
	evalID := c.anonID
	if ctx != nil && ctx.UserID != "" {
		evalID = ctx.UserID
	}

	c.mu.Lock()
	raw, ok := c.cache[key]
	c.mu.Unlock()
	if !ok {
		return nil
	}

	if raw.Type == "rollout" {
		inRollout := raw.Enabled && Hash(key+":"+evalID) < raw.RolloutPercent
		return &FlagData{
			Key:     raw.Key,
			Type:    raw.Type,
			Enabled: inRollout,
			Percent: raw.RolloutPercent,
		}
	}
	return &FlagData{Key: raw.Key, Type: raw.Type, Enabled: raw.Enabled}
}

// GetFlags evaluates all cached flags for the given context.
func (c *Client) GetFlags(ctx *FlagEvaluationContext) []FlagData {
	c.mu.Lock()
	keys := make([]string, 0, len(c.cache))
	for key := range c.cache {
		keys = append(keys, key)
	}
	c.mu.Unlock()

	sort.Strings(keys)

	flags := make([]FlagData, 0, len(keys))
	for _, key := range keys {
		if flag := c.GetFlag(key, ctx); flag != nil {
			flags = append(flags, *flag)
		}
	}
	return flags
}

// IsStale reports whether the last snapshot fetch failed.
func (c *Client) IsStale() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.stale
}

// GetLastSyncAt returns the ISO timestamp of the last successful snapshot
// sync, or nil if no sync has succeeded.
func (c *Client) GetLastSyncAt() *string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.lastSyncAt
}

// Disconnect stops the SSE stream, cancels pending reconnections and waits for
// the stream goroutine to finish.
func (c *Client) Disconnect() {
	c.mu.Lock()
	c.destroyed = true
	cancel := c.cancel
	c.cancel = nil
	c.mu.Unlock()

	if cancel != nil {
		cancel()
	}
	c.wg.Wait()
}

func (c *Client) fetchFlags() error {
	requestedAt := time.Now().UnixMilli()

	req, err := http.NewRequest(http.MethodGet, c.baseURL+"/sdk/flags", nil)
	if err != nil {
		c.setStale()
		return fmt.Errorf("canarygate: failed to create flags request: %w", err)
	}
	req.Header.Set("X-Api-Key", c.apiKey)
	if c.environment != "" {
		req.Header.Set("X-Environment", c.environment)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("[canarygate] Error fetching flags: %v", err)
		c.setStale()
		return fmt.Errorf("canarygate: failed to fetch flags: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[canarygate] Failed to fetch flags: %d %s", resp.StatusCode, resp.Status)
		c.setStale()
		return fmt.Errorf("canarygate: failed to fetch flags: status %d", resp.StatusCode)
	}

	var snapshot struct {
		Flags []apiFlagRaw `json:"flags"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&snapshot); err != nil {
		log.Printf("[canarygate] Failed to decode flags response: %v", err)
		c.setStale()
		return fmt.Errorf("canarygate: failed to decode flags response: %w", err)
	}

	c.replaceCacheFromSnapshot(snapshot.Flags, requestedAt)
	return nil
}

func (c *Client) replaceCacheFromSnapshot(flags []apiFlagRaw, requestedAt int64) {
	c.mu.Lock()
	defer c.mu.Unlock()

	nextCache := make(map[string]apiFlagRaw, len(flags))
	nextVersions := make(map[string]int64, len(flags))

	for _, flag := range flags {
		nextVersion := parseTimestamp(flag.UpdatedAt)
		if currentVersion, ok := c.versions[flag.Key]; ok && currentVersion > nextVersion && currentVersion > requestedAt {
			if current, ok := c.cache[flag.Key]; ok {
				nextCache[flag.Key] = current
			}
			nextVersions[flag.Key] = currentVersion
			continue
		}
		nextCache[flag.Key] = flag
		nextVersions[flag.Key] = nextVersion
	}

	for key, currentVersion := range c.versions {
		if _, ok := nextVersions[key]; ok || currentVersion <= requestedAt {
			continue
		}
		if current, ok := c.cache[key]; ok {
			nextCache[key] = current
			nextVersions[key] = currentVersion
		}
	}

	c.cache = nextCache
	c.versions = nextVersions
	c.stale = false
	now := time.Now().Format(time.RFC3339)
	c.lastSyncAt = &now
}

func (c *Client) applyFlagUpdate(raw apiFlagRaw) {
	nextVersion := parseTimestamp(raw.UpdatedAt)

	c.mu.Lock()
	defer c.mu.Unlock()
	currentVersion, ok := c.versions[raw.Key]
	if ok && nextVersion < currentVersion {
		return
	}
	c.versions[raw.Key] = nextVersion
	c.cache[raw.Key] = raw
}

func (c *Client) applyFlagDeletion(payload flagDeletionPayload) {
	nextVersion := parseTimestamp(payload.DeletedAt)

	c.mu.Lock()
	defer c.mu.Unlock()
	currentVersion, ok := c.versions[payload.Key]
	if ok && nextVersion < currentVersion {
		return
	}
	c.versions[payload.Key] = nextVersion
	delete(c.cache, payload.Key)
}

func (c *Client) handleStreamMessage(event, data string) {
	if event == "connected" || event == "connection-closing" || data == "" {
		return
	}

	switch event {
	case "flag-deleted":
		var payload flagDeletionPayload
		if err := json.Unmarshal([]byte(data), &payload); err != nil {
			log.Printf("[canarygate] Failed to parse flag-deleted event: %v", err)
			return
		}
		c.applyFlagDeletion(payload)
	case "flag-updated", "flag-created":
		var raw apiFlagRaw
		if err := json.Unmarshal([]byte(data), &raw); err != nil {
			log.Printf("[canarygate] Failed to parse %s event: %v", event, err)
			return
		}
		c.applyFlagUpdate(raw)
	}
}

func (c *Client) handleSseEvent(ev SseEvent) {
	if ev.RetryMs != nil {
		c.mu.Lock()
		c.streamRetryDelay = time.Duration(*ev.RetryMs) * time.Millisecond
		c.mu.Unlock()
	}
	c.handleStreamMessage(ev.Event, ev.Data)
}

func (c *Client) connectStream() {
	c.mu.Lock()
	if c.destroyed || c.cancel != nil {
		c.mu.Unlock()
		return
	}
	ctx, cancel := context.WithCancel(context.Background())
	c.cancel = cancel
	c.mu.Unlock()

	c.wg.Add(1)
	go func() {
		defer c.wg.Done()
		c.consumeStream(ctx, cancel)
	}()
}

func (c *Client) consumeStream(ctx context.Context, cancel context.CancelFunc) {
	defer c.finishStream()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/sdk/stream", nil)
	if err != nil {
		log.Printf("[canarygate] Failed to create stream request: %v", err)
		return
	}
	req.Header.Set("X-Api-Key", c.apiKey)
	if c.environment != "" {
		req.Header.Set("X-Environment", c.environment)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		if ctx.Err() == nil {
			log.Printf("[canarygate] Stream connection failed: %v", err)
		}
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("[canarygate] Failed to connect stream: %d %s", resp.StatusCode, resp.Status)
		c.setStale()
		return
	}

	c.mu.Lock()
	c.reconnectAttempts = 0
	c.mu.Unlock()

	if c.isStale() {
		if err := c.fetchFlags(); err != nil {
			log.Printf("[canarygate] Failed to refetch flags on reconnect: %v", err)
		}
	}

	timer := time.NewTimer(c.heartbeatTimeoutMs)
	defer timer.Stop()

	streamDone := make(chan struct{})
	go func() {
		select {
		case <-timer.C:
		case <-streamDone:
			return
		}
		c.mu.Lock()
		destroyed := c.destroyed
		c.mu.Unlock()
		if !destroyed {
			log.Printf("[canarygate] Stream heartbeat timeout, reconnecting")
			cancel()
		}
	}()

	reader := &heartbeatReader{r: resp.Body, timer: timer, timeout: c.heartbeatTimeoutMs}

	parseErr := ParseSse(reader, c.handleSseEvent)
	close(streamDone)

	if parseErr != nil && ctx.Err() == nil {
		log.Printf("[canarygate] Stream connection failed: %v", parseErr)
	}
}

func (c *Client) finishStream() {
	c.mu.Lock()
	c.cancel = nil
	reconnect := !c.destroyed
	var delay time.Duration
	if reconnect {
		c.stale = true
		delay = c.streamRetryDelay
		for i := 0; i < c.reconnectAttempts; i++ {
			if delay >= c.maxReconnectDelay {
				break
			}
			delay *= 2
			if delay > c.maxReconnectDelay {
				delay = c.maxReconnectDelay
			}
		}
		c.reconnectAttempts++
	}
	c.mu.Unlock()

	if reconnect {
		time.AfterFunc(delay, func() {
			c.connectStream()
		})
	}
}

func (c *Client) setStale() {
	c.mu.Lock()
	c.stale = true
	c.mu.Unlock()
}

func (c *Client) isStale() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.stale
}

func parseTimestamp(value string) int64 {
	t, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return 0
	}
	return t.UnixMilli()
}

func newUUIDv4() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		log.Printf("[canarygate] Failed to generate anon id: %v", err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}

type heartbeatReader struct {
	r       io.Reader
	timer   *time.Timer
	timeout time.Duration
}

func (h *heartbeatReader) Read(p []byte) (int, error) {
	n, err := h.r.Read(p)
	if n > 0 {
		if !h.timer.Stop() {
			select {
			case <-h.timer.C:
			default:
			}
		}
		h.timer.Reset(h.timeout)
	}
	return n, err
}
