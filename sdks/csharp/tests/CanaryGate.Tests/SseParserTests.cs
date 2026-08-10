using CanaryGate;
using Xunit;

namespace CanaryGate.Tests;

public class SseParserTests
{
    [Fact]
    public void ParseBlock_Parses_FlagUpdated_With_Json_Data()
    {
        var block = "event: flag-updated\n" +
            "data: {\"key\":\"feature-x\",\"type\":\"boolean\",\"enabled\":true,\"rolloutPercent\":0,\"updatedAt\":\"2025-01-01T00:00:00.000Z\"}";

        var evt = SseParser.ParseBlock(block);

        Assert.NotNull(evt);
        Assert.Equal("flag-updated", evt!.Event);
        Assert.Contains("\"key\":\"feature-x\"", evt.Data);
    }

    [Fact]
    public void ParseBlock_Joins_MultiLine_Data_With_Newline()
    {
        var block = "event: flag-updated\n" +
            "data: {\"key\":\"feature-x\",\n" +
            "data: \"extra\":true}";

        var evt = SseParser.ParseBlock(block);

        Assert.NotNull(evt);
        Assert.Contains("\n", evt!.Data);
    }

    [Fact]
    public void ParseBlock_Parses_FlagDeleted_With_Json_Data()
    {
        var block = "event: flag-deleted\n" +
            "data: {\"key\":\"feature-x\",\"deletedAt\":\"2025-01-02T00:00:00.000Z\"}";

        var evt = SseParser.ParseBlock(block);

        Assert.NotNull(evt);
        Assert.Equal("flag-deleted", evt!.Event);
        Assert.Contains("\"deletedAt\"", evt.Data);
    }

    [Fact]
    public void ParseBlock_Comment_Only_Block_Returns_Null()
    {
        Assert.Null(SseParser.ParseBlock(": ping"));
    }

    [Fact]
    public void ParseBlock_Parses_Retry_Field()
    {
        var evt = SseParser.ParseBlock("retry: 10000");

        Assert.NotNull(evt);
        Assert.Equal(10000, evt!.RetryMs);
    }

    [Fact]
    public void ParseBlock_NonPositive_Retry_Is_Ignored()
    {
        Assert.Null(SseParser.ParseBlock("retry: 0"));
    }

    [Fact]
    public void ParseBlock_Empty_Block_Returns_Null()
    {
        Assert.Null(SseParser.ParseBlock(string.Empty));
    }

    [Fact]
    public void ParseBlock_Handles_CrLf_Line_Endings()
    {
        var block = "event: flag-updated\r\ndata: {\"key\":\"feature-x\"}\r\n";

        var evt = SseParser.ParseBlock(block);

        Assert.NotNull(evt);
        Assert.Equal("flag-updated", evt!.Event);
    }
}
