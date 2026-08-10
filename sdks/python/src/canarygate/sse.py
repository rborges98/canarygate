from dataclasses import dataclass
from typing import List, Optional


@dataclass
class SseEvent:
    event: str
    data: str
    retry_ms: Optional[int] = None


def parse_sse_block(block: str) -> Optional[SseEvent]:
    event = "message"
    data_lines: List[str] = []
    retry_ms: Optional[int] = None

    for raw_line in block.replace("\r\n", "\n").split("\n"):
        if not raw_line or raw_line.startswith(":"):
            continue

        if ":" in raw_line:
            field, _, value = raw_line.partition(":")
        else:
            field, value = raw_line, ""

        value = value.lstrip()

        if field == "event":
            event = value or "message"
            continue

        if field == "data":
            data_lines.append(value)
            continue

        if field == "retry":
            try:
                parsed = int(value.strip())
            except ValueError:
                parsed = 0
            if parsed > 0:
                retry_ms = parsed

    if not data_lines and retry_ms is None:
        return None

    return SseEvent(event=event, data="\n".join(data_lines), retry_ms=retry_ms)
