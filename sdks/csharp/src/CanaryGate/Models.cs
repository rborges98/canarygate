using System;

namespace CanaryGate;

public sealed record Options(
    string BaseUrl = "http://localhost:3001",
    string? Environment = null,
    bool Stream = false,
    TimeSpan? ReconnectDelay = null,
    TimeSpan? MaxReconnectDelay = null,
    TimeSpan? HeartbeatTimeout = null);

public sealed record FlagEvaluationContext(string? UserId = null);

public sealed record FlagData(string Key, string Type, bool Enabled, int Percent);

internal sealed record ApiFlagRaw
{
    public ApiFlagRaw(string key, string type, bool enabled, int rolloutPercent, string updatedAt)
    {
        Key = key;
        Type = type;
        Enabled = enabled;
        RolloutPercent = rolloutPercent;
        UpdatedAt = updatedAt;
    }

    public string Key { get; init; }

    public string Type { get; init; }

    public bool Enabled { get; init; }

    public int RolloutPercent { get; init; }

    public string UpdatedAt { get; init; }
}
