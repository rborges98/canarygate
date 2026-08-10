import datetime
import http.client
import json
import logging
import threading
import time
import urllib.request
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional

from .hash import hash_string
from .sse import parse_sse_block

_logger = logging.getLogger("canarygate")

SNAPSHOT_TIMEOUT_SECONDS = 10.0


@dataclass
class Options:
    base_url: str = "http://localhost:3001"
    environment: Optional[str] = None
    stream: bool = False
    reconnect_delay: float = 5.0
    max_reconnect_delay: float = 30.0
    heartbeat_timeout_ms: float = 65000.0


@dataclass
class FlagEvaluationContext:
    user_id: Optional[str] = None


@dataclass
class FlagData:
    key: str
    type: str
    enabled: bool
    percent: int


@dataclass
class ApiFlagRaw:
    key: str
    type: str
    enabled: bool
    rollout_percent: int
    updated_at: str

    @classmethod
    def from_json(cls, data: Dict[str, object]) -> "ApiFlagRaw":
        return cls(
            key=str(data["key"]),
            type=str(data["type"]),
            enabled=bool(data["enabled"]),
            rollout_percent=int(data["rolloutPercent"]),
            updated_at=str(data["updatedAt"]),
        )


def _parse_timestamp_ms(value: str) -> int:
    try:
        if value.endswith("Z"):
            value = value[:-1] + "+00:00"
        dt = datetime.datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return int(dt.timestamp() * 1000)
    except ValueError:
        return 0


class CanaryGate:
    def __init__(self, api_key: str, options: Optional[Options] = None) -> None:
        options = options or Options()
        self._api_key = api_key
        self._base_url = options.base_url.rstrip("/")
        self._environment = options.environment
        self._stream_enabled = options.stream
        self._reconnect_delay = options.reconnect_delay
        self._max_reconnect_delay = max(
            options.max_reconnect_delay, options.reconnect_delay
        )
        self._heartbeat_timeout_ms = options.heartbeat_timeout_ms
        self._anon_id = str(uuid.uuid4())

        self._cache: Dict[str, ApiFlagRaw] = {}
        self._cache_versions: Dict[str, int] = {}
        self._stale = False
        self._last_sync_at: Optional[str] = None
        self._destroyed = False

        self._stream_retry_delay = options.reconnect_delay
        self._reconnect_attempts = 0
        self._stream_thread: Optional[threading.Thread] = None
        self._stream_response: Optional[http.client.HTTPResponse] = None
        self._stream_stop = threading.Event()
        self._lock = threading.RLock()

    def init(self) -> None:
        self._fetch_flags(raise_on_error=True)
        if self._stream_enabled:
            self._start_stream()

    def get_flag(
        self, key: str, context: Optional[FlagEvaluationContext] = None
    ) -> Optional[FlagData]:
        with self._lock:
            raw = self._cache.get(key)
            if raw is None:
                return None

            evaluation_id = (
                context.user_id if context is not None else None
            ) or self._anon_id

            if raw.type == "rollout":
                in_rollout = (
                    raw.enabled
                    and hash_string(f"{raw.key}:{evaluation_id}")
                    < raw.rollout_percent
                )
                return FlagData(
                    key=raw.key,
                    type="rollout",
                    enabled=in_rollout,
                    percent=raw.rollout_percent,
                )

            return FlagData(
                key=raw.key, type="boolean", enabled=raw.enabled, percent=0
            )

    def get_flags(
        self, context: Optional[FlagEvaluationContext] = None
    ) -> List[FlagData]:
        with self._lock:
            keys = list(self._cache.keys())
        result: List[FlagData] = []
        for key in keys:
            flag = self.get_flag(key, context)
            if flag is not None:
                result.append(flag)
        return result

    def is_stale(self) -> bool:
        return self._stale

    def get_last_sync_at(self) -> Optional[str]:
        return self._last_sync_at

    def disconnect(self) -> None:
        self._destroyed = True
        self._stream_stop.set()
        response = self._stream_response
        if response is not None:
            try:
                response.close()
            except Exception:
                pass
        thread = self._stream_thread
        if thread is not None:
            thread.join(timeout=5.0)

    def _headers(self) -> Dict[str, str]:
        headers: Dict[str, str] = {"X-Api-Key": self._api_key}
        if self._environment:
            headers["X-Environment"] = self._environment
        return headers

    def _fetch_flags(self, raise_on_error: bool = False) -> bool:
        requested_at = int(time.time() * 1000)
        try:
            request = urllib.request.Request(
                self._base_url + "/sdk/flags", headers=self._headers()
            )
            with urllib.request.urlopen(
                request, timeout=SNAPSHOT_TIMEOUT_SECONDS
            ) as response:
                body = json.loads(response.read().decode("utf-8"))
            flags = [
                ApiFlagRaw.from_json(flag) for flag in body.get("flags", [])
            ]
            self._replace_cache_from_snapshot(flags, requested_at)
            return True
        except Exception as err:
            self._log_error(f"Failed to fetch flags: {err}")
            self._stale = True
            if raise_on_error:
                raise RuntimeError(f"Failed to fetch flags: {err}") from err
            return False

    def _replace_cache_from_snapshot(
        self, flags: List[ApiFlagRaw], requested_at: int
    ) -> None:
        with self._lock:
            next_cache: Dict[str, ApiFlagRaw] = {}
            next_versions: Dict[str, int] = {}

            for flag in flags:
                next_version = _parse_timestamp_ms(flag.updated_at)
                current_version = self._cache_versions.get(flag.key, -1)

                if current_version > next_version and current_version > requested_at:
                    current_flag = self._cache.get(flag.key)
                    if current_flag is not None:
                        next_cache[flag.key] = current_flag
                    next_versions[flag.key] = current_version
                    continue

                next_cache[flag.key] = flag
                next_versions[flag.key] = next_version

            for key, current_version in self._cache_versions.items():
                if key in next_versions or current_version <= requested_at:
                    continue
                current_flag = self._cache.get(key)
                if current_flag is not None:
                    next_cache[key] = current_flag
                next_versions[key] = current_version

            self._cache = next_cache
            self._cache_versions = next_versions
            self._stale = False
            self._last_sync_at = datetime.datetime.now(
                datetime.timezone.utc
            ).isoformat()

    def _apply_flag_update(self, raw: ApiFlagRaw) -> None:
        next_version = _parse_timestamp_ms(raw.updated_at)
        with self._lock:
            current_version = self._cache_versions.get(raw.key, -1)
            if next_version < current_version:
                return
            self._cache_versions[raw.key] = next_version
            self._cache[raw.key] = raw

    def _apply_flag_deletion(self, key: str, deleted_at: str) -> None:
        next_version = _parse_timestamp_ms(deleted_at)
        with self._lock:
            current_version = self._cache_versions.get(key, -1)
            if next_version < current_version:
                return
            self._cache_versions[key] = next_version
            self._cache.pop(key, None)

    def _start_stream(self) -> None:
        with self._lock:
            if self._destroyed:
                return
            if (
                self._stream_thread is not None
                and self._stream_thread.is_alive()
            ):
                return
            self._stream_thread = threading.Thread(
                target=self._stream_loop,
                name="canarygate-stream",
                daemon=True,
            )
            self._stream_thread.start()

    def _stream_loop(self) -> None:
        while not self._destroyed:
            try:
                self._consume_stream()
            except Exception as err:
                if not self._destroyed:
                    self._log_error(f"Stream connection failed: {err}")
            if self._destroyed:
                break
            self._stale = True
            if self._stream_stop.wait(self._next_reconnect_delay()):
                break

    def _next_reconnect_delay(self) -> float:
        delay = min(
            self._stream_retry_delay * (2 ** self._reconnect_attempts),
            self._max_reconnect_delay,
        )
        self._reconnect_attempts += 1
        return delay

    def _consume_stream(self) -> None:
        response = None
        try:
            request = urllib.request.Request(
                self._base_url + "/sdk/stream", headers=self._headers()
            )
            response = urllib.request.urlopen(
                request, timeout=self._heartbeat_timeout_ms / 1000.0
            )
            self._stream_response = response
            self._reconnect_attempts = 0

            if self._stale:
                self._fetch_flags(raise_on_error=False)

            buffer = ""
            while not self._destroyed:
                line = response.readline()
                if not line:
                    break
                buffer += line.decode("utf-8", errors="replace").replace(
                    "\r\n", "\n"
                )
                parts = buffer.split("\n\n")
                buffer = parts.pop()
                for part in parts:
                    if part.strip():
                        self._handle_sse_block(part)
            if buffer.strip():
                self._handle_sse_block(buffer)
        except Exception as err:
            if not self._destroyed:
                self._log_error(f"Stream connection failed: {err}")
        finally:
            self._stream_response = None
            if response is not None:
                try:
                    response.close()
                except Exception:
                    pass

    def _handle_sse_block(self, block: str) -> None:
        parsed = parse_sse_block(block)
        if parsed is None:
            return
        if parsed.retry_ms is not None:
            self._stream_retry_delay = parsed.retry_ms
        self._handle_stream_message(parsed.event, parsed.data)

    def _handle_stream_message(self, event: str, data: str) -> None:
        if event in ("connected", "connection-closing"):
            return
        if not data:
            return
        try:
            payload = json.loads(data)
            if event == "flag-deleted":
                self._apply_flag_deletion(
                    str(payload.get("key", "")),
                    str(payload.get("deletedAt", "")),
                )
            elif event in ("flag-updated", "flag-created"):
                self._apply_flag_update(ApiFlagRaw.from_json(payload))
        except Exception as err:
            self._log_error(f"Failed to process {event} event: {err}")

    def _log_error(self, message: str) -> None:
        _logger.error("[canarygate] " + message)
