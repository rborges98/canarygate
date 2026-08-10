using System;
using System.Collections.Generic;
using System.Globalization;

namespace CanaryGate;

public sealed record SseEvent(string Event, string Data, int? RetryMs);

public static class SseParser
{
    public static SseEvent? ParseBlock(string block)
    {
        var eventName = "message";
        var dataLines = new List<string>();
        int? retryMs = null;

        foreach (var line in SplitLines(block))
        {
            if (line.Length == 0 || line.StartsWith(':'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf(':');
            var field = separatorIndex == -1 ? line : line[..separatorIndex];
            var value = separatorIndex == -1 ? string.Empty : line[(separatorIndex + 1)..].TrimStart();

            if (field == "event")
            {
                eventName = value.Length > 0 ? value : "message";
                continue;
            }

            if (field == "data")
            {
                dataLines.Add(value);
                continue;
            }

            if (field == "retry" &&
                int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedRetry) &&
                parsedRetry > 0)
            {
                retryMs = parsedRetry;
            }
        }

        if (dataLines.Count == 0 && !retryMs.HasValue)
        {
            return null;
        }

        return new SseEvent(eventName, string.Join("\n", dataLines), retryMs);
    }

    private static string[] SplitLines(string block)
    {
        return block.Split(new[] { "\r\n", "\n", "\r" }, StringSplitOptions.None);
    }
}
