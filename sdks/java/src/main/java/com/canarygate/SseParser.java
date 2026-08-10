package com.canarygate;

import java.util.ArrayList;
import java.util.List;

public final class SseParser {

    private SseParser() {
    }

    public record SseEvent(String event, String data, Integer retryMs) {
    }

    public static SseEvent parseBlock(String block) {
        String event = "message";
        List<String> dataLines = new ArrayList<>();
        Integer retryMs = null;

        for (String line : block.split("\\r?\\n")) {
            if (line.isEmpty() || line.startsWith(":")) continue;

            int separatorIndex = line.indexOf(':');
            String field = separatorIndex == -1 ? line : line.substring(0, separatorIndex);
            String value = separatorIndex == -1 ? "" : line.substring(separatorIndex + 1).stripLeading();

            switch (field) {
                case "event" -> event = value.isEmpty() ? "message" : value;
                case "data" -> dataLines.add(value);
                case "retry" -> {
                    try {
                        int parsed = Integer.parseInt(value);
                        if (parsed > 0) {
                            retryMs = parsed;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
                default -> {
                }
            }
        }

        if (dataLines.isEmpty() && retryMs == null) {
            return null;
        }
        return new SseEvent(event, String.join("\n", dataLines), retryMs);
    }
}
