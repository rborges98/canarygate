package canarygate

import (
	"strings"
	"testing"
)

func TestHashVectors(t *testing.T) {
	vectors := []struct {
		input string
		want  int
	}{
		{"feature-rollout-a:user-42", 59},
		{"new-checkout:vitor-1", 20},
		{"dark-mode:anon-999", 71},
		{"flag-x:", 94},
	}
	for _, v := range vectors {
		if got := Hash(v.input); got != v.want {
			t.Errorf("Hash(%q) = %d, want %d", v.input, got, v.want)
		}
	}
}

func newTestClient(flags ...apiFlagRaw) *Client {
	c := New("test-api-key", Options{})
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache = make(map[string]apiFlagRaw, len(flags))
	c.versions = make(map[string]int64, len(flags))
	for _, flag := range flags {
		c.cache[flag.Key] = flag
		c.versions[flag.Key] = parseTimestamp(flag.UpdatedAt)
	}
	return c
}

func TestApplyFlagUpdateVersionGuard(t *testing.T) {
	c := newTestClient(apiFlagRaw{
		Key: "flag-a", Type: "boolean", Enabled: true, UpdatedAt: "2025-01-02T00:00:00.000Z",
	})

	c.applyFlagUpdate(apiFlagRaw{
		Key: "flag-a", Type: "boolean", Enabled: false, UpdatedAt: "2025-01-01T00:00:00.000Z",
	})

	c.mu.Lock()
	got := c.cache["flag-a"]
	c.mu.Unlock()
	if !got.Enabled {
		t.Error("applyFlagUpdate with an older version must not overwrite the cached flag")
	}
}

func TestApplyFlagDeletionVersionGuard(t *testing.T) {
	c := newTestClient(apiFlagRaw{
		Key: "flag-a", Type: "boolean", Enabled: true, UpdatedAt: "2025-01-02T00:00:00.000Z",
	})

	c.applyFlagDeletion(flagDeletionPayload{
		Key: "flag-a", DeletedAt: "2025-01-01T00:00:00.000Z",
	})

	c.mu.Lock()
	_, ok := c.cache["flag-a"]
	c.mu.Unlock()
	if !ok {
		t.Error("applyFlagDeletion with an older version must not remove the cached flag")
	}
}

func TestRolloutEvaluation(t *testing.T) {
	c := newTestClient(
		apiFlagRaw{Key: "flag-0", Type: "rollout", Enabled: true, RolloutPercent: 0, UpdatedAt: "2025-01-01T00:00:00.000Z"},
		apiFlagRaw{Key: "flag-100", Type: "rollout", Enabled: true, RolloutPercent: 100, UpdatedAt: "2025-01-01T00:00:00.000Z"},
		apiFlagRaw{Key: "new-checkout", Type: "rollout", Enabled: true, RolloutPercent: 50, UpdatedAt: "2025-01-01T00:00:00.000Z"},
	)

	ctx := &FlagEvaluationContext{UserID: "vitor-1"}

	if flag := c.GetFlag("flag-0", ctx); flag == nil || flag.Enabled {
		t.Errorf("rollout with percent 0 must always be off, got %+v", flag)
	}
	if flag := c.GetFlag("flag-100", ctx); flag == nil || !flag.Enabled {
		t.Errorf("rollout with percent 100 must always be on, got %+v", flag)
	}
	if hash := Hash("new-checkout:vitor-1"); hash >= 50 {
		t.Fatalf("test vector hash = %d, expected < 50", hash)
	}
	if flag := c.GetFlag("new-checkout", ctx); flag == nil || !flag.Enabled || flag.Percent != 50 {
		t.Errorf("expected new-checkout enabled with percent 50, got %+v", flag)
	}
	if flag := c.GetFlag("unknown", ctx); flag != nil {
		t.Errorf("GetFlag for unknown key must return nil, got %+v", flag)
	}
}

func TestParseSse(t *testing.T) {
	input := strings.Join([]string{
		"event: flag-updated",
		`data: {"key":"feature-x","type":"boolean","enabled":true,"rolloutPercent":0,"updatedAt":"2025-01-01T00:00:00.000Z"}`,
		`data: {"second":true}`,
		"",
		": heartbeat comment",
		"",
		"event: flag-deleted",
		`data: {"key":"feature-x","deletedAt":"2025-01-02T00:00:00.000Z"}`,
		"",
		"retry: 10000",
		"",
		"",
		"",
		"event: connected",
		"data: {}",
		"",
	}, "\n")

	var events []SseEvent
	if err := ParseSse(strings.NewReader(input), func(ev SseEvent) {
		events = append(events, ev)
	}); err != nil {
		t.Fatalf("ParseSse returned error: %v", err)
	}

	if len(events) != 4 {
		t.Fatalf("expected 4 events, got %d: %+v", len(events), events)
	}
	if events[0].Event != "flag-updated" || !strings.Contains(events[0].Data, "feature-x") {
		t.Errorf("unexpected first event: %+v", events[0])
	}
	if !strings.Contains(events[0].Data, "\n") {
		t.Errorf("multi-line data must be joined with \\n: %q", events[0].Data)
	}
	if events[1].Event != "flag-deleted" || !strings.Contains(events[1].Data, "feature-x") {
		t.Errorf("unexpected second event: %+v", events[1])
	}
	if events[2].RetryMs == nil || *events[2].RetryMs != 10000 {
		t.Errorf("expected retry block with retryMs=10000, got %+v", events[2])
	}
	if events[3].Event != "connected" {
		t.Errorf("expected connected event, got %+v", events[3])
	}
}

func TestParseSseCRLF(t *testing.T) {
	input := "event: flag-updated\r\ndata: {\"key\":\"feature-x\"}\r\n\r\n: comment\r\n\r\n"

	var events []SseEvent
	if err := ParseSse(strings.NewReader(input), func(ev SseEvent) {
		events = append(events, ev)
	}); err != nil {
		t.Fatalf("ParseSse returned error: %v", err)
	}

	if len(events) != 1 || events[0].Event != "flag-updated" {
		t.Fatalf("expected 1 flag-updated event, got %+v", events)
	}
}
