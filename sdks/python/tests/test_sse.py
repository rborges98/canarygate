import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))

from canarygate.sse import SseEvent, parse_sse_block


class ParseSseBlockTest(unittest.TestCase):
    def test_flag_updated_block(self):
        block = (
            "event: flag-updated\n"
            'data: {"key":"checkout-v2","type":"boolean","enabled":true,'
            '"rolloutPercent":100,"updatedAt":"2026-01-01T00:00:00Z"}\n'
            "\n"
        )
        event = parse_sse_block(block)
        self.assertIsInstance(event, SseEvent)
        self.assertEqual(event.event, "flag-updated")
        self.assertEqual(event.retry_ms, None)
        self.assertIn('"key":"checkout-v2"', event.data)

    def test_flag_deleted_block(self):
        block = (
            "event: flag-deleted\n"
            'data: {"key":"checkout-v2","deletedAt":"2026-01-01T00:00:00Z"}\n'
            "\n"
        )
        event = parse_sse_block(block)
        self.assertIsInstance(event, SseEvent)
        self.assertEqual(event.event, "flag-deleted")
        self.assertIn("checkout-v2", event.data)

    def test_multiline_data_joined_with_newline(self):
        event = parse_sse_block("data: line one\ndata: line two\n\n")
        self.assertIsInstance(event, SseEvent)
        self.assertEqual(event.event, "message")
        self.assertEqual(event.data, "line one\nline two")

    def test_comment_lines_are_ignored(self):
        event = parse_sse_block(": ping\n: keep-alive\n\ndata: x\n\n")
        self.assertIsInstance(event, SseEvent)
        self.assertEqual(event.data, "x")

    def test_comment_only_block_returns_none(self):
        self.assertIsNone(parse_sse_block(": ping\n\n"))
        self.assertIsNone(parse_sse_block(""))

    def test_retry_block(self):
        event = parse_sse_block("retry: 5000\n\n")
        self.assertIsInstance(event, SseEvent)
        self.assertEqual(event.event, "message")
        self.assertEqual(event.data, "")
        self.assertEqual(event.retry_ms, 5000)

    def test_retry_zero_or_invalid_ignored(self):
        self.assertIsNone(parse_sse_block("retry: 0\n\n"))
        self.assertIsNone(parse_sse_block("retry: abc\n\n"))

    def test_retry_with_event(self):
        event = parse_sse_block("retry: 2500\nevent: flag-updated\n\n")
        self.assertIsInstance(event, SseEvent)
        self.assertEqual(event.event, "flag-updated")
        self.assertEqual(event.retry_ms, 2500)


if __name__ == "__main__":
    unittest.main()
