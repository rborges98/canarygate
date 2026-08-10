using System;
using CanaryGate;
using Xunit;

namespace CanaryGate.Tests;

public class CanaryGateClientTests
{
    private static CanaryGateClient CreateSeededClient(params ApiFlagRaw[] flags)
    {
        var client = new CanaryGateClient("test-api-key");
        client.ReplaceCacheFromSnapshot(flags, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        return client;
    }

    [Fact]
    public void GetFlag_Rollout_With_Zero_Percent_Is_Always_Off()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-0", "rollout", true, 0, "2025-01-01T00:00:00.000Z"));

        var flag = client.GetFlag("flag-0", new FlagEvaluationContext("user-42"));

        Assert.NotNull(flag);
        Assert.False(flag!.Enabled);
        Assert.Equal(0, flag.Percent);
    }

    [Fact]
    public void GetFlag_Rollout_With_Hundred_Percent_Is_Always_On()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-100", "rollout", true, 100, "2025-01-01T00:00:00.000Z"));

        var flag = client.GetFlag("flag-100", new FlagEvaluationContext("user-42"));

        Assert.NotNull(flag);
        Assert.True(flag!.Enabled);
        Assert.Equal(100, flag.Percent);
    }

    [Fact]
    public void GetFlag_Disabled_Rollout_Is_Off_Even_At_100_Percent()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-100", "rollout", false, 100, "2025-01-01T00:00:00.000Z"));

        var flag = client.GetFlag("flag-100", new FlagEvaluationContext("user-42"));

        Assert.NotNull(flag);
        Assert.False(flag!.Enabled);
    }

    [Fact]
    public void GetFlag_Rollout_With_Known_Vector_At_50_Percent_Is_On()
    {
        var client = CreateSeededClient(new ApiFlagRaw("new-checkout", "rollout", true, 50, "2025-01-01T00:00:00.000Z"));

        var flag = client.GetFlag("new-checkout", new FlagEvaluationContext("vitor-1"));

        Assert.NotNull(flag);
        Assert.True(flag!.Enabled);
        Assert.Equal(50, flag.Percent);
    }

    [Fact]
    public void GetFlag_Unknown_Key_Returns_Null()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-01T00:00:00.000Z"));

        Assert.Null(client.GetFlag("unknown"));
    }

    [Fact]
    public void GetFlag_Without_Context_Uses_Stable_Anon_Id()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "rollout", true, 50, "2025-01-01T00:00:00.000Z"));

        var first = client.GetFlag("flag-a");
        var second = client.GetFlag("flag-a");

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(first!.Enabled, second!.Enabled);
    }

    [Fact]
    public void GetFlags_Returns_All_Cached_Flags()
    {
        var client = CreateSeededClient(
            new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-01T00:00:00.000Z"),
            new ApiFlagRaw("flag-b", "rollout", true, 50, "2025-01-01T00:00:00.000Z"));

        var flags = client.GetFlags(new FlagEvaluationContext("user-42"));

        Assert.Equal(2, flags.Count);
    }

    [Fact]
    public void ReplaceCacheFromSnapshot_Clears_Stale_And_Sets_LastSyncAt()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-01T00:00:00.000Z"));

        Assert.False(client.IsStale());
        Assert.NotNull(client.GetLastSyncAt());
    }

    [Fact]
    public void ApplyFlagUpdate_With_Older_Version_Does_Not_Overwrite()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-02T00:00:00.000Z"));

        client.ApplyFlagUpdate(new ApiFlagRaw("flag-a", "boolean", false, 0, "2025-01-01T00:00:00.000Z"));

        var flag = client.GetFlag("flag-a");

        Assert.NotNull(flag);
        Assert.True(flag!.Enabled);
    }

    [Fact]
    public void ApplyFlagUpdate_With_Newer_Version_Overwrites()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-01T00:00:00.000Z"));

        client.ApplyFlagUpdate(new ApiFlagRaw("flag-a", "boolean", false, 0, "2025-01-02T00:00:00.000Z"));

        var flag = client.GetFlag("flag-a");

        Assert.NotNull(flag);
        Assert.False(flag!.Enabled);
    }

    [Fact]
    public void ApplyFlagDeletion_With_Older_Version_Does_Not_Remove()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-02T00:00:00.000Z"));

        client.ApplyFlagDeletion("flag-a", "2025-01-01T00:00:00.000Z");

        Assert.NotNull(client.GetFlag("flag-a"));
    }

    [Fact]
    public void ApplyFlagDeletion_With_Newer_Version_Removes()
    {
        var client = CreateSeededClient(new ApiFlagRaw("flag-a", "boolean", true, 0, "2025-01-01T00:00:00.000Z"));

        client.ApplyFlagDeletion("flag-a", "2025-01-02T00:00:00.000Z");

        Assert.Null(client.GetFlag("flag-a"));
    }
}
