package com.canarygate;

import com.canarygate.Models.FlagData;
import com.canarygate.Models.FlagEvaluationContext;
import com.canarygate.Models.Options;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class CanaryGateClient implements AutoCloseable {

    private static final String DEFAULT_BASE_URL = "http://localhost:3001";
    private static final long DEFAULT_RECONNECT_DELAY_MS = 5_000L;
    private static final long DEFAULT_MAX_RECONNECT_DELAY_MS = 30_000L;
    private static final long DEFAULT_HEARTBEAT_TIMEOUT_MS = 65_000L;

    private final String apiKey;
    private final String baseUrl;
    private final String environment;
    private final boolean streamEnabled;
    private final long reconnectDelay;
    private final long maxReconnectDelay;
    private final long heartbeatTimeoutMs;
    private final String anonId = UUID.randomUUID().toString();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    final ConcurrentHashMap<String, ApiFlagRaw> cache = new ConcurrentHashMap<>();
    final ConcurrentHashMap<String, Long> cacheVersions = new ConcurrentHashMap<>();

    private volatile Thread streamThread;
    private volatile Thread heartbeatThread;
    private volatile InputStream streamInput;
    private volatile boolean destroyed;
    private volatile boolean stale;
    private volatile String lastSyncAt;
    private volatile long streamRetryDelay;
    private long lastActivityMs;
    private int reconnectAttempts;

    record ApiFlagRaw(String key, String type, boolean enabled, int rolloutPercent, String updatedAt) {
    }

    public CanaryGateClient(String apiKey, Options options) {
        this.apiKey = Objects.requireNonNull(apiKey, "apiKey");
        Options opts = options != null ? options : Options.defaults();
        String base = opts.baseUrl() == null || opts.baseUrl().isBlank()
                ? DEFAULT_BASE_URL : opts.baseUrl();
        this.baseUrl = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        this.environment = opts.environment();
        this.streamEnabled = opts.stream();
        this.reconnectDelay = opts.reconnectDelayMs() > 0 ? opts.reconnectDelayMs() : DEFAULT_RECONNECT_DELAY_MS;
        long max = opts.maxReconnectDelayMs() > 0 ? opts.maxReconnectDelayMs() : DEFAULT_MAX_RECONNECT_DELAY_MS;
        this.maxReconnectDelay = Math.max(max, this.reconnectDelay);
        this.heartbeatTimeoutMs = opts.heartbeatTimeoutMs() > 0 ? opts.heartbeatTimeoutMs() : DEFAULT_HEARTBEAT_TIMEOUT_MS;
        this.streamRetryDelay = this.reconnectDelay;
    }

    public void init() throws IOException {
        if (!fetchFlags()) {
            throw new IOException("Failed to fetch flags from " + baseUrl + "/sdk/flags");
        }
        if (streamEnabled) {
            connectStream();
        }
    }

    public FlagData getFlag(String key, FlagEvaluationContext context) {
        ApiFlagRaw raw = cache.get(key);
        if (raw == null) return null;

        String evaluationId = context != null && context.userId() != null && !context.userId().isEmpty()
                ? context.userId() : anonId;

        if ("rollout".equals(raw.type())) {
            boolean inRollout = raw.enabled()
                    && Hash.hashString(raw.key() + ":" + evaluationId) < raw.rolloutPercent();
            return new FlagData(raw.key(), "rollout", inRollout, raw.rolloutPercent());
        }
        return new FlagData(raw.key(), "boolean", raw.enabled(), 0);
    }

    public List<FlagData> getFlags(FlagEvaluationContext context) {
        List<FlagData> flags = new ArrayList<>(cache.size());
        for (String key : cache.keySet()) {
            FlagData data = getFlag(key, context);
            if (data != null) {
                flags.add(data);
            }
        }
        return flags;
    }

    public boolean isStale() {
        return stale;
    }

    public String getLastSyncAt() {
        return lastSyncAt;
    }

    public void disconnect() {
        destroyed = true;
        abortStream();
        Thread t = streamThread;
        if (t != null && t != Thread.currentThread()) {
            t.interrupt();
            try {
                t.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        streamThread = null;
    }

    @Override
    public void close() {
        disconnect();
    }

    private void connectStream() {
        if (destroyed) return;
        Thread thread = new Thread(this::streamLoop, "canarygate-stream");
        thread.setDaemon(true);
        streamThread = thread;
        thread.start();
    }

    private void streamLoop() {
        while (!destroyed) {
            connectOnce();
            if (destroyed) break;
            stale = true;
            long delay = backoffDelay();
            reconnectAttempts++;
            if (sleepQuietly(delay)) break;
        }
    }

    private long backoffDelay() {
        long delay = streamRetryDelay;
        for (int i = 0; i < reconnectAttempts && delay < maxReconnectDelay; i++) {
            if (delay > maxReconnectDelay / 2) {
                delay = maxReconnectDelay;
                break;
            }
            delay *= 2;
        }
        return Math.min(delay, maxReconnectDelay);
    }

    private void connectOnce() {
        try {
            HttpResponse<InputStream> response = httpClient.send(
                    buildRequest("/sdk/stream"),
                    HttpResponse.BodyHandlers.ofInputStream()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                System.err.println("[canarygate] Failed to connect stream: HTTP " + response.statusCode());
                return;
            }
            reconnectAttempts = 0;
            startHeartbeat();
            if (stale) {
                fetchFlags();
            }
            InputStream input = response.body();
            streamInput = input;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
                StringBuilder block = new StringBuilder();
                String line;
                while (!destroyed && (line = reader.readLine()) != null) {
                    bumpHeartbeat();
                    if (line.isEmpty()) {
                        if (block.length() > 0) {
                            processBlock(block.toString());
                            block.setLength(0);
                        }
                    } else {
                        if (block.length() > 0) block.append('\n');
                        block.append(line);
                    }
                }
                if (block.length() > 0 && !destroyed) {
                    processBlock(block.toString());
                }
            }
        } catch (IOException e) {
            if (!destroyed) {
                System.err.println("[canarygate] Stream connection failed: " + e.getMessage());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            stopHeartbeat();
            streamInput = null;
        }
    }

    private void processBlock(String block) {
        SseParser.SseEvent parsed = SseParser.parseBlock(block);
        if (parsed == null) return;
        if (parsed.retryMs() != null) {
            streamRetryDelay = parsed.retryMs();
        }
        handleStreamMessage(parsed.event(), parsed.data());
    }

    private void handleStreamMessage(String event, String data) {
        if ("connected".equals(event) || "connection-closing".equals(event)) return;
        if (data == null || data.isEmpty()) return;
        try {
            if ("flag-deleted".equals(event)) {
                applyFlagDeletion(fieldString(data, "key"), fieldString(data, "deletedAt"));
                return;
            }
            if ("flag-updated".equals(event) || "flag-created".equals(event)) {
                applyFlagUpdate(parseFlag(data));
            }
        } catch (RuntimeException e) {
            System.err.println("[canarygate] Failed to parse " + event + " event: " + e.getMessage());
        }
    }

    boolean applyFlagUpdate(ApiFlagRaw raw) {
        long nextVersion = parseTimestamp(raw.updatedAt());
        long currentVersion = cacheVersions.getOrDefault(raw.key(), -1L);
        if (nextVersion < currentVersion) return false;
        cacheVersions.put(raw.key(), nextVersion);
        cache.put(raw.key(), raw);
        return true;
    }

    boolean applyFlagDeletion(String key, String deletedAt) {
        if (key == null || deletedAt == null) return false;
        long nextVersion = parseTimestamp(deletedAt);
        long currentVersion = cacheVersions.getOrDefault(key, -1L);
        if (nextVersion < currentVersion) return false;
        cacheVersions.put(key, nextVersion);
        cache.remove(key);
        return true;
    }

    void replaceCacheFromSnapshot(List<ApiFlagRaw> flags, long requestedAt) {
        Map<String, ApiFlagRaw> nextCache = new ConcurrentHashMap<>();
        Map<String, Long> nextVersions = new ConcurrentHashMap<>();

        for (ApiFlagRaw flag : flags) {
            long nextVersion = parseTimestamp(flag.updatedAt());
            long currentVersion = cacheVersions.getOrDefault(flag.key(), -1L);
            if (currentVersion > nextVersion && currentVersion > requestedAt) {
                ApiFlagRaw current = cache.get(flag.key());
                if (current != null) {
                    nextCache.put(flag.key(), current);
                    nextVersions.put(flag.key(), currentVersion);
                }
                continue;
            }
            nextCache.put(flag.key(), flag);
            nextVersions.put(flag.key(), nextVersion);
        }

        for (Map.Entry<String, Long> entry : cacheVersions.entrySet()) {
            String key = entry.getKey();
            long currentVersion = entry.getValue();
            if (nextVersions.containsKey(key) || currentVersion <= requestedAt) continue;
            ApiFlagRaw current = cache.get(key);
            if (current != null) {
                nextCache.put(key, current);
                nextVersions.put(key, currentVersion);
            }
        }

        cache.clear();
        cache.putAll(nextCache);
        cacheVersions.clear();
        cacheVersions.putAll(nextVersions);
        stale = false;
        lastSyncAt = Instant.now().toString();
    }

    private boolean fetchFlags() {
        long requestedAt = System.currentTimeMillis();
        try {
            HttpResponse<String> response = httpClient.send(
                    buildRequest("/sdk/flags"),
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                System.err.println("[canarygate] Failed to fetch flags: HTTP " + response.statusCode());
                stale = true;
                return false;
            }
            replaceCacheFromSnapshot(parseFlags(response.body()), requestedAt);
            return true;
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            System.err.println("[canarygate] Error fetching flags: " + e.getMessage());
            stale = true;
            return false;
        }
    }

    private HttpRequest buildRequest(String path) {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + path))
                .header("X-Api-Key", apiKey)
                .GET();
        if (environment != null && !environment.isEmpty()) {
            builder.header("X-Environment", environment);
        }
        return builder.build();
    }

    private synchronized void startHeartbeat() {
        lastActivityMs = System.currentTimeMillis();
        if (heartbeatThread != null) return;
        Thread thread = new Thread(() -> {
            synchronized (this) {
                while (!destroyed) {
                    long remaining = heartbeatTimeoutMs - (System.currentTimeMillis() - lastActivityMs);
                    if (remaining <= 0) {
                        abortStream();
                        break;
                    }
                    try {
                        wait(remaining);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }, "canarygate-heartbeat");
        thread.setDaemon(true);
        heartbeatThread = thread;
        thread.start();
    }

    private synchronized void bumpHeartbeat() {
        lastActivityMs = System.currentTimeMillis();
        notifyAll();
    }

    private synchronized void stopHeartbeat() {
        heartbeatThread = null;
        notifyAll();
    }

    private void abortStream() {
        InputStream input = streamInput;
        if (input != null) {
            try {
                input.close();
            } catch (IOException ignored) {
            }
        }
    }

    private static boolean sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return true;
        }
    }

    private static List<ApiFlagRaw> parseFlags(String body) {
        List<ApiFlagRaw> flags = new ArrayList<>();
        int flagsKey = body.indexOf("\"flags\"");
        if (flagsKey == -1) return flags;
        int arrayStart = body.indexOf('[', flagsKey);
        if (arrayStart == -1) return flags;
        int arrayEnd = findArrayEnd(body, arrayStart);
        if (arrayEnd == -1) return flags;

        int i = arrayStart;
        while (true) {
            int open = body.indexOf('{', i);
            if (open == -1 || open > arrayEnd) break;
            int close = findObjectEnd(body, open);
            if (close == -1 || close > arrayEnd) break;
            ApiFlagRaw raw = parseFlag(body.substring(open, close + 1));
            if (raw.key() != null && raw.type() != null && raw.updatedAt() != null) {
                flags.add(raw);
            }
            i = close + 1;
        }
        return flags;
    }

    private static ApiFlagRaw parseFlag(String object) {
        return new ApiFlagRaw(
                fieldString(object, "key"),
                fieldString(object, "type"),
                fieldBool(object, "enabled"),
                (int) fieldLong(object, "rolloutPercent"),
                fieldString(object, "updatedAt")
        );
    }

    private static int findArrayEnd(String json, int start) {
        int depth = 0;
        boolean inString = false;
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (inString) {
                if (c == '\\') {
                    i++;
                } else if (c == '"') {
                    inString = false;
                }
            } else if (c == '"') {
                inString = true;
            } else if (c == '[') {
                depth++;
            } else if (c == ']') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private static int findObjectEnd(String json, int start) {
        int depth = 0;
        boolean inString = false;
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (inString) {
                if (c == '\\') {
                    i++;
                } else if (c == '"') {
                    inString = false;
                }
            } else if (c == '"') {
                inString = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private static String fieldString(String json, String field) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
                .matcher(json);
        if (!matcher.find()) return null;
        return matcher.group(1).replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private static long fieldLong(String json, String field) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*(-?\\d+)").matcher(json);
        return matcher.find() ? Long.parseLong(matcher.group(1)) : 0L;
    }

    private static boolean fieldBool(String json, String field) {
        Matcher matcher = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*(true|false)").matcher(json);
        return matcher.find() && "true".equals(matcher.group(1));
    }

    private static long parseTimestamp(String value) {
        if (value == null) return 0L;
        try {
            return Instant.parse(value).toEpochMilli();
        } catch (DateTimeParseException e) {
            return 0L;
        }
    }
}
