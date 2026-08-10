using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace CanaryGate;

public sealed class CanaryGateClient : IDisposable
{
    private static readonly HttpClient SharedHttpClient = new();

    private static readonly TimeSpan DefaultReconnectDelay = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan DefaultMaxReconnectDelay = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan DefaultHeartbeatTimeout = TimeSpan.FromSeconds(65);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly string apiKey;
    private readonly string baseUrl;
    private readonly string? environment;
    private readonly bool streamEnabled;
    private readonly TimeSpan reconnectDelay;
    private readonly TimeSpan maxReconnectDelay;
    private readonly TimeSpan heartbeatTimeout;
    private readonly string anonId = Guid.NewGuid().ToString();

    private readonly object syncLock = new();

    private Dictionary<string, ApiFlagRaw> cache = new();
    private Dictionary<string, long> cacheVersions = new();
    private TimeSpan streamRetryDelay;
    private int reconnectAttempts;
    private bool stale;
    private string? lastSyncAt;
    private bool destroyed;
    private CancellationTokenSource? streamCts;
    private Task? streamTask;

    public CanaryGateClient(string apiKey, Options? options = null)
    {
        if (string.IsNullOrEmpty(apiKey))
        {
            throw new ArgumentException("apiKey must not be null or empty", nameof(apiKey));
        }

        this.apiKey = apiKey;
        var opts = options ?? new Options();
        baseUrl = opts.BaseUrl.TrimEnd('/');
        environment = opts.Environment;
        streamEnabled = opts.Stream;
        reconnectDelay = opts.ReconnectDelay ?? DefaultReconnectDelay;
        maxReconnectDelay = opts.MaxReconnectDelay ?? DefaultMaxReconnectDelay;
        if (maxReconnectDelay < reconnectDelay)
        {
            maxReconnectDelay = reconnectDelay;
        }
        heartbeatTimeout = opts.HeartbeatTimeout ?? DefaultHeartbeatTimeout;
        streamRetryDelay = reconnectDelay;
    }

    public async Task InitAsync()
    {
        if (!await FetchSnapshotAsync())
        {
            throw new InvalidOperationException("[canarygate] Failed to fetch flags during initialization");
        }

        if (streamEnabled)
        {
            StartStream();
        }
    }

    public FlagData? GetFlag(string key, FlagEvaluationContext? context = null)
    {
        var evaluationId = string.IsNullOrEmpty(context?.UserId) ? anonId : context!.UserId!;

        ApiFlagRaw? raw;
        lock (syncLock)
        {
            cache.TryGetValue(key, out raw);
        }

        if (raw == null)
        {
            return null;
        }

        if (raw.Type == "rollout")
        {
            var inRollout = raw.Enabled && Hash.HashString($"{raw.Key}:{evaluationId}") < raw.RolloutPercent;
            return new FlagData(raw.Key, raw.Type, inRollout, raw.RolloutPercent);
        }

        return new FlagData(raw.Key, raw.Type, raw.Enabled, 0);
    }

    public IReadOnlyList<FlagData> GetFlags(FlagEvaluationContext? context = null)
    {
        List<string> keys;
        lock (syncLock)
        {
            keys = new List<string>(cache.Keys);
        }
        keys.Sort();

        var flags = new List<FlagData>(keys.Count);
        foreach (var key in keys)
        {
            var flag = GetFlag(key, context);
            if (flag != null)
            {
                flags.Add(flag);
            }
        }
        return flags;
    }

    public bool IsStale()
    {
        lock (syncLock)
        {
            return stale;
        }
    }

    public string? GetLastSyncAt()
    {
        lock (syncLock)
        {
            return lastSyncAt;
        }
    }

    public void Disconnect()
    {
        Task? task;
        lock (syncLock)
        {
            if (destroyed)
            {
                return;
            }

            destroyed = true;
            streamCts?.Cancel();
            streamCts = null;
            task = streamTask;
            streamTask = null;
        }

        try
        {
            task?.Wait();
        }
        catch (AggregateException)
        {
        }
    }

    public void Dispose()
    {
        Disconnect();
        GC.SuppressFinalize(this);
    }

    private async Task<bool> FetchSnapshotAsync()
    {
        var requestedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/sdk/flags");
            request.Headers.Add("X-Api-Key", apiKey);
            if (environment != null)
            {
                request.Headers.Add("X-Environment", environment);
            }

            using var response = await SharedHttpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                Console.Error.WriteLine($"[canarygate] Failed to fetch flags: {(int)response.StatusCode} {response.ReasonPhrase}");
                lock (syncLock)
                {
                    stale = true;
                }
                return false;
            }

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            if (!document.RootElement.TryGetProperty("flags", out var flagsElement))
            {
                Console.Error.WriteLine("[canarygate] Failed to decode flags response: missing flags field");
                lock (syncLock)
                {
                    stale = true;
                }
                return false;
            }

            var flags = flagsElement.Deserialize<List<ApiFlagRaw>>(JsonOptions) ?? new List<ApiFlagRaw>();
            ReplaceCacheFromSnapshot(flags, requestedAt);
            return true;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[canarygate] Error fetching flags: {ex.Message}");
            lock (syncLock)
            {
                stale = true;
            }
            return false;
        }
    }

    internal void ReplaceCacheFromSnapshot(IEnumerable<ApiFlagRaw> flags, long requestedAt)
    {
        lock (syncLock)
        {
            var nextCache = new Dictionary<string, ApiFlagRaw>();
            var nextVersions = new Dictionary<string, long>();

            foreach (var flag in flags)
            {
                var nextVersion = ParseTimestamp(flag.UpdatedAt);
                var hasCurrent = cacheVersions.TryGetValue(flag.Key, out var currentVersion);

                if (hasCurrent && currentVersion > nextVersion && currentVersion > requestedAt)
                {
                    if (cache.TryGetValue(flag.Key, out var currentFlag))
                    {
                        nextCache[flag.Key] = currentFlag;
                    }
                    nextVersions[flag.Key] = currentVersion;
                    continue;
                }

                nextCache[flag.Key] = flag;
                nextVersions[flag.Key] = nextVersion;
            }

            foreach (var pair in cacheVersions)
            {
                if (nextVersions.ContainsKey(pair.Key) || pair.Value <= requestedAt)
                {
                    continue;
                }

                if (cache.TryGetValue(pair.Key, out var currentFlag))
                {
                    nextCache[pair.Key] = currentFlag;
                    nextVersions[pair.Key] = pair.Value;
                }
            }

            cache = nextCache;
            cacheVersions = nextVersions;
            stale = false;
            lastSyncAt = DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture);
        }
    }

    internal void ApplyFlagUpdate(ApiFlagRaw raw)
    {
        var nextVersion = ParseTimestamp(raw.UpdatedAt);

        lock (syncLock)
        {
            var hasCurrent = cacheVersions.TryGetValue(raw.Key, out var currentVersion);
            if (hasCurrent && nextVersion < currentVersion)
            {
                return;
            }

            cacheVersions[raw.Key] = nextVersion;
            cache[raw.Key] = raw;
        }
    }

    internal void ApplyFlagDeletion(string key, string deletedAt)
    {
        var nextVersion = ParseTimestamp(deletedAt);

        lock (syncLock)
        {
            var hasCurrent = cacheVersions.TryGetValue(key, out var currentVersion);
            if (hasCurrent && nextVersion < currentVersion)
            {
                return;
            }

            cacheVersions[key] = nextVersion;
            cache.Remove(key);
        }
    }

    private void StartStream()
    {
        lock (syncLock)
        {
            if (destroyed || streamCts != null)
            {
                return;
            }

            streamCts = new CancellationTokenSource();
            var cts = streamCts;
            streamTask = RunStreamAsync(cts);
        }
    }

    private async Task RunStreamAsync(CancellationTokenSource streamCts)
    {
        var token = streamCts.Token;
        var firstAttempt = true;

        try
        {
            while (!destroyed && !token.IsCancellationRequested)
            {
                if (!firstAttempt)
                {
                    var delay = ComputeReconnectDelay();
                    try
                    {
                        await Task.Delay(delay, token);
                    }
                    catch (OperationCanceledException)
                    {
                        return;
                    }
                }
                firstAttempt = false;

                if (destroyed || token.IsCancellationRequested)
                {
                    return;
                }

                try
                {
                    await ConsumeStreamAttemptAsync(token);
                }
                catch (OperationCanceledException)
                {
                    if (token.IsCancellationRequested)
                    {
                        return;
                    }
                    Console.Error.WriteLine("[canarygate] Stream heartbeat timeout, reconnecting");
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"[canarygate] Stream connection failed: {ex.Message}");
                }

                if (!destroyed && !token.IsCancellationRequested)
                {
                    lock (syncLock)
                    {
                        stale = true;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[canarygate] Stream loop failed: {ex.Message}");
        }
    }

    private async Task ConsumeStreamAttemptAsync(CancellationToken token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/sdk/stream");
        request.Headers.Add("X-Api-Key", apiKey);
        if (environment != null)
        {
            request.Headers.Add("X-Environment", environment);
        }

        using var response = await SharedHttpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token);
        if (!response.IsSuccessStatusCode)
        {
            Console.Error.WriteLine($"[canarygate] Failed to connect stream: {(int)response.StatusCode} {response.ReasonPhrase}");
            return;
        }

        lock (syncLock)
        {
            reconnectAttempts = 0;
        }

        if (IsStale())
        {
            await FetchSnapshotAsync();
        }

        using var stream = await response.Content.ReadAsStreamAsync(token);
        using var reader = new StreamReader(stream);
        using var heartbeatCts = CancellationTokenSource.CreateLinkedTokenSource(token);

        var blockLines = new List<string>();
        while (!token.IsCancellationRequested)
        {
            heartbeatCts.CancelAfter(heartbeatTimeout);

            var line = await reader.ReadLineAsync(heartbeatCts.Token);
            if (line == null)
            {
                break;
            }

            if (line.Length == 0)
            {
                if (blockLines.Count > 0)
                {
                    ProcessBlock(string.Join("\n", blockLines));
                    blockLines.Clear();
                }
                continue;
            }

            blockLines.Add(line);
        }

        if (blockLines.Count > 0)
        {
            ProcessBlock(string.Join("\n", blockLines));
        }
    }

    private void ProcessBlock(string block)
    {
        var parsed = SseParser.ParseBlock(block);
        if (parsed == null)
        {
            return;
        }

        if (parsed.RetryMs.HasValue)
        {
            lock (syncLock)
            {
                streamRetryDelay = TimeSpan.FromMilliseconds(parsed.RetryMs.Value);
            }
        }

        HandleStreamMessage(parsed.Event, parsed.Data);
    }

    private void HandleStreamMessage(string eventName, string data)
    {
        if (eventName == "connected" || eventName == "connection-closing" || string.IsNullOrEmpty(data))
        {
            return;
        }

        try
        {
            if (eventName == "flag-deleted")
            {
                using var document = JsonDocument.Parse(data);
                var root = document.RootElement;
                if (root.TryGetProperty("key", out var keyElement) &&
                    root.TryGetProperty("deletedAt", out var deletedAtElement) &&
                    keyElement.ValueKind == JsonValueKind.String &&
                    deletedAtElement.ValueKind == JsonValueKind.String)
                {
                    ApplyFlagDeletion(keyElement.GetString()!, deletedAtElement.GetString()!);
                }
                return;
            }

            if (eventName == "flag-updated" || eventName == "flag-created")
            {
                var raw = JsonSerializer.Deserialize<ApiFlagRaw>(data, JsonOptions);
                if (raw != null)
                {
                    ApplyFlagUpdate(raw);
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[canarygate] Failed to parse {eventName} event: {ex.Message}");
        }
    }

    private static long ParseTimestamp(string value)
    {
        if (DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed))
        {
            return parsed.ToUnixTimeMilliseconds();
        }
        return 0;
    }

    private TimeSpan ComputeReconnectDelay()
    {
        lock (syncLock)
        {
            var maxMs = maxReconnectDelay.TotalMilliseconds;
            long current = (long)streamRetryDelay.TotalMilliseconds;

            for (var i = 0; i < reconnectAttempts; i++)
            {
                if (current >= maxMs || current > maxMs / 2)
                {
                    current = (long)maxMs;
                    break;
                }
                current *= 2;
            }

            reconnectAttempts++;
            return TimeSpan.FromMilliseconds(current);
        }
    }
}
