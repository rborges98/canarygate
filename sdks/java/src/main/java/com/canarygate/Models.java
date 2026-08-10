package com.canarygate;

public final class Models {

    private Models() {
    }

    public record Options(
            String baseUrl,
            String environment,
            boolean stream,
            long reconnectDelayMs,
            long maxReconnectDelayMs,
            long heartbeatTimeoutMs
    ) {
        public static Options defaults() {
            return new Options("http://localhost:3001", null, false, 5_000L, 30_000L, 65_000L);
        }
    }

    public record FlagEvaluationContext(String userId) {
    }

    public record FlagData(String key, String type, boolean enabled, int percent) {
    }
}
