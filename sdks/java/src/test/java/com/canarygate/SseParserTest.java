package com.canarygate;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SseParserTest {

    @Test
    void parsesFlagUpdatedBlock() {
        String data = "{\"key\":\"checkout\",\"type\":\"boolean\",\"enabled\":true,\"rolloutPercent\":0,\"updatedAt\":\"2026-01-01T00:00:00Z\"}";
        SseParser.SseEvent event = SseParser.parseBlock("event: flag-updated\n" + "data: " + data + "\n");
        assertNotNull(event);
        assertEquals("flag-updated", event.event());
        assertEquals(data, event.data());
        assertNull(event.retryMs());
    }

    @Test
    void parsesFlagDeletedBlock() {
        SseParser.SseEvent event = SseParser.parseBlock(
                "event: flag-deleted\ndata: {\"key\":\"old-flag\",\"deletedAt\":\"2026-01-02T00:00:00Z\"}\n");
        assertNotNull(event);
        assertEquals("flag-deleted", event.event());
        assertTrue(event.data().contains("\"key\":\"old-flag\""));
    }

    @Test
    void parsesValidRetry() {
        SseParser.SseEvent event = SseParser.parseBlock("retry: 1500\n");
        assertNotNull(event);
        assertEquals("message", event.event());
        assertEquals("", event.data());
        assertEquals(1500, event.retryMs());
    }

    @Test
    void ignoresInvalidRetry() {
        assertNull(SseParser.parseBlock("retry: 0\n"));
        assertNull(SseParser.parseBlock("retry: abc\n"));
    }

    @Test
    void joinsMultiLineData() {
        SseParser.SseEvent event = SseParser.parseBlock("event: flag-updated\ndata: line1\ndata: line2\n");
        assertNotNull(event);
        assertEquals("line1\nline2", event.data());
    }

    @Test
    void ignoresCommentsAndEmptyBlocks() {
        assertNull(SseParser.parseBlock(": ping\n"));
        assertNull(SseParser.parseBlock(""));
        assertNull(SseParser.parseBlock("\n\n"));
        assertNull(SseParser.parseBlock(": ping\n\n"));
    }

    @Test
    void dataOnlyDefaultsToMessageEvent() {
        SseParser.SseEvent event = SseParser.parseBlock("data: hello\n");
        assertNotNull(event);
        assertEquals("message", event.event());
        assertEquals("hello", event.data());
    }
}
