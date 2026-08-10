package com.canarygate;

import com.canarygate.Models.FlagData;
import com.canarygate.Models.FlagEvaluationContext;
import com.canarygate.Models.Options;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CanaryGateClientTest {

    private CanaryGateClient newClient() {
        return new CanaryGateClient("test-api-key", Options.defaults());
    }

    private CanaryGateClient.ApiFlagRaw raw(String key, String type, boolean enabled, int percent, String updatedAt) {
        return new CanaryGateClient.ApiFlagRaw(key, type, enabled, percent, updatedAt);
    }

    @Test
    void evaluatesRolloutPercentages() {
        CanaryGateClient client = newClient();
        client.cache.put("rollout-zero", raw("rollout-zero", "rollout", true, 0, "2026-01-01T00:00:00Z"));
        client.cache.put("rollout-full", raw("rollout-full", "rollout", true, 100, "2026-01-01T00:00:00Z"));
        client.cache.put("rollout-half", raw("rollout-half", "rollout", true, 50, "2026-01-01T00:00:00Z"));

        FlagEvaluationContext context = new FlagEvaluationContext("user-42");

        FlagData zero = client.getFlag("rollout-zero", context);
        assertNotNull(zero);
        assertEquals("rollout", zero.type());
        assertFalse(zero.enabled());
        assertEquals(0, zero.percent());

        FlagData full = client.getFlag("rollout-full", context);
        assertNotNull(full);
        assertTrue(full.enabled());
        assertEquals(100, full.percent());

        FlagData half = client.getFlag("rollout-half", context);
        assertNotNull(half);
        assertEquals(50, half.percent());
        assertEquals(Hash.hashString("rollout-half:user-42") < 50, half.enabled());

        assertNull(client.getFlag("missing-flag", context));
    }

    @Test
    void evaluatesBooleanFlags() {
        CanaryGateClient client = newClient();
        client.cache.put("bool-on", raw("bool-on", "boolean", true, 0, "2026-01-01T00:00:00Z"));
        client.cache.put("bool-off", raw("bool-off", "boolean", false, 0, "2026-01-01T00:00:00Z"));

        FlagEvaluationContext context = new FlagEvaluationContext("user-42");
        assertTrue(client.getFlag("bool-on", context).enabled());
        assertFalse(client.getFlag("bool-off", context).enabled());
    }

    @Test
    void rolloutUsesAnonIdWhenNoContext() {
        CanaryGateClient client = newClient();
        client.cache.put("anon-rollout", raw("anon-rollout", "rollout", true, 100, "2026-01-01T00:00:00Z"));
        assertTrue(client.getFlag("anon-rollout", null).enabled());
    }

    @Test
    void versionGuardsApplyUpdateAndDeletion() {
        CanaryGateClient client = newClient();

        client.applyFlagUpdate(raw("flag-a", "boolean", true, 0, "2026-01-01T00:00:00Z"));
        assertTrue(client.cache.get("flag-a").enabled());

        client.applyFlagUpdate(raw("flag-a", "boolean", false, 0, "2025-01-01T00:00:00Z"));
        assertTrue(client.cache.get("flag-a").enabled());

        client.applyFlagUpdate(raw("flag-a", "boolean", false, 0, "2026-02-01T00:00:00Z"));
        assertFalse(client.cache.get("flag-a").enabled());

        client.applyFlagDeletion("flag-a", "2026-01-15T00:00:00Z");
        assertNotNull(client.cache.get("flag-a"));

        client.applyFlagDeletion("flag-a", "2026-03-01T00:00:00Z");
        assertNull(client.cache.get("flag-a"));
    }

    @Test
    void replaceCacheFromSnapshotPreservesNewerLocalFlags() {
        CanaryGateClient client = newClient();
        client.cache.put("a", raw("a", "boolean", false, 0, "2026-06-01T00:00:00Z"));
        client.cacheVersions.put("a", Instant.parse("2026-06-01T00:00:00Z").toEpochMilli());

        long requestedAt = System.currentTimeMillis();
        client.replaceCacheFromSnapshot(
                List.of(
                        raw("a", "boolean", false, 0, "2026-05-01T00:00:00Z"),
                        raw("b", "boolean", true, 0, "2026-05-01T00:00:00Z")
                ),
                requestedAt
        );

        assertNotNull(client.cache.get("a"));
        assertNotNull(client.cache.get("b"));
        assertFalse(client.isStale());
        assertNotNull(client.getLastSyncAt());
    }

    @Test
    void getFlagsReturnsAllEvaluatedFlags() {
        CanaryGateClient client = newClient();
        client.cache.put("x", raw("x", "boolean", true, 0, "2026-01-01T00:00:00Z"));
        client.cache.put("y", raw("y", "rollout", true, 40, "2026-01-01T00:00:00Z"));

        List<FlagData> flags = client.getFlags(new FlagEvaluationContext("user-1"));
        assertEquals(2, flags.size());
        assertTrue(flags.stream().anyMatch(flag -> "x".equals(flag.key()) && flag.enabled()));
        assertTrue(flags.stream().anyMatch(flag -> "y".equals(flag.key()) && 40 == flag.percent()));
    }
}
