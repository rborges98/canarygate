import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))

import canarygate.client as client_module
from canarygate.client import ApiFlagRaw, CanaryGate, FlagEvaluationContext


def make_rollout(key="feature-rollout-a", enabled=True, percent=50):
    return ApiFlagRaw(
        key=key,
        type="rollout",
        enabled=enabled,
        rollout_percent=percent,
        updated_at="2026-01-01T00:00:00Z",
    )


def make_boolean(key="dark-mode", enabled=True):
    return ApiFlagRaw(
        key=key,
        type="boolean",
        enabled=enabled,
        rollout_percent=0,
        updated_at="2026-01-01T00:00:00Z",
    )


V2025 = 1735689600000
V2026 = 1767225600000


class GetFlagTest(unittest.TestCase):
    def setUp(self):
        self.client = CanaryGate("test-key")
        self.client._cache = {"feature-rollout-a": make_rollout()}
        self.client._cache_versions = {"feature-rollout-a": V2026}

    def test_rollout_percent_100_in_rollout(self):
        self.client._cache["feature-rollout-a"] = make_rollout(percent=100)
        flag = self.client.get_flag(
            "feature-rollout-a", FlagEvaluationContext(user_id="user-42")
        )
        self.assertEqual(flag.type, "rollout")
        self.assertTrue(flag.enabled)
        self.assertEqual(flag.percent, 100)

    def test_rollout_percent_50_not_in_rollout(self):
        flag = self.client.get_flag(
            "feature-rollout-a", FlagEvaluationContext(user_id="user-42")
        )
        self.assertEqual(flag.type, "rollout")
        self.assertFalse(flag.enabled)
        self.assertEqual(flag.percent, 50)

    def test_rollout_percent_0_never_in_rollout(self):
        self.client._cache["feature-rollout-a"] = make_rollout(percent=0)
        flag = self.client.get_flag(
            "feature-rollout-a", FlagEvaluationContext(user_id="user-42")
        )
        self.assertFalse(flag.enabled)

    def test_rollout_disabled_never_in_rollout(self):
        self.client._cache["feature-rollout-a"] = make_rollout(
            enabled=False, percent=100
        )
        flag = self.client.get_flag(
            "feature-rollout-a", FlagEvaluationContext(user_id="user-42")
        )
        self.assertFalse(flag.enabled)

    def test_boolean_flag(self):
        self.client._cache["dark-mode"] = make_boolean()
        self.client._cache_versions["dark-mode"] = V2026
        flag = self.client.get_flag(
            "dark-mode", FlagEvaluationContext(user_id="user-42")
        )
        self.assertEqual(flag.type, "boolean")
        self.assertTrue(flag.enabled)
        self.assertEqual(flag.percent, 0)

    def test_unknown_key_returns_none(self):
        self.assertIsNone(
            self.client.get_flag(
                "missing-flag", FlagEvaluationContext(user_id="user-42")
            )
        )

    def test_context_user_id_is_used(self):
        other = CanaryGate("test-key")
        other._cache = dict(self.client._cache)
        other._cache_versions = dict(self.client._cache_versions)
        ctx = FlagEvaluationContext(user_id="user-42")
        self.assertEqual(
            self.client.get_flag("feature-rollout-a", ctx),
            other.get_flag("feature-rollout-a", ctx),
        )

    def test_default_context_uses_instance_anon_id(self):
        first = self.client.get_flag("feature-rollout-a")
        second = self.client.get_flag("feature-rollout-a")
        self.assertEqual(first, second)

    def test_get_flags_returns_all(self):
        self.client._cache["dark-mode"] = make_boolean()
        self.client._cache_versions["dark-mode"] = V2026
        flags = self.client.get_flags(FlagEvaluationContext(user_id="user-42"))
        self.assertEqual(len(flags), 2)

    def test_initial_state(self):
        self.assertFalse(self.client.is_stale())
        self.assertIsNone(self.client.get_last_sync_at())


class VersionGuardTest(unittest.TestCase):
    def setUp(self):
        self.client = CanaryGate("test-key")
        self.client._cache = {}
        self.client._cache_versions = {}

    def test_update_older_ignored(self):
        current = make_boolean(enabled=True)
        self.client._cache = {"f": current}
        self.client._cache_versions = {"f": V2026}
        old = make_boolean(enabled=False)
        old.updated_at = "2025-01-01T00:00:00Z"
        self.client._apply_flag_update(old)
        self.assertTrue(self.client._cache["f"].enabled)
        self.assertEqual(self.client._cache_versions["f"], V2026)

    def test_update_same_version_applied(self):
        self.client._cache = {"f": make_boolean(enabled=False)}
        self.client._cache_versions = {"f": V2026}
        new = make_boolean(enabled=True)
        self.client._apply_flag_update(new)
        self.assertTrue(self.client._cache["f"].enabled)

    def test_update_newer_applied(self):
        self.client._cache = {"f": make_boolean(enabled=False)}
        self.client._cache_versions = {"f": V2025}
        new = make_boolean(enabled=True)
        self.client._apply_flag_update(new)
        self.assertTrue(self.client._cache["f"].enabled)
        self.assertEqual(self.client._cache_versions["f"], V2026)

    def test_deletion_older_ignored(self):
        self.client._cache = {"f": make_boolean()}
        self.client._cache_versions = {"f": V2026}
        self.client._apply_flag_deletion("f", "2025-01-01T00:00:00Z")
        self.assertIn("f", self.client._cache)

    def test_deletion_newer_applied(self):
        self.client._cache = {"f": make_boolean()}
        self.client._cache_versions = {"f": V2025}
        self.client._apply_flag_deletion("f", "2026-01-01T00:00:00Z")
        self.assertNotIn("f", self.client._cache)

    def test_snapshot_preserves_newer_flag(self):
        self.client._cache = {"f": make_boolean(enabled=True)}
        self.client._cache_versions = {"f": V2026}
        snapshot_old = make_boolean(enabled=False)
        snapshot_old.updated_at = "2025-01-01T00:00:00Z"
        self.client._replace_cache_from_snapshot([snapshot_old], 1750000000000)
        self.assertTrue(self.client._cache["f"].enabled)
        self.assertFalse(self.client.is_stale())
        self.assertIsNotNone(self.client.get_last_sync_at())

    def test_snapshot_adds_new_flags(self):
        self.client._replace_cache_from_snapshot([make_boolean()], 1750000000000)
        self.assertIn("dark-mode", self.client._cache)
        self.assertEqual(
            self.client._cache_versions["dark-mode"], V2026
        )

    def test_snapshot_drops_old_flag_not_present(self):
        old = make_boolean(key="h")
        old.updated_at = "2025-01-01T00:00:00Z"
        self.client._cache = {"h": old}
        self.client._cache_versions = {"h": V2025}
        self.client._replace_cache_from_snapshot([], 1750000000000)
        self.assertNotIn("h", self.client._cache)

    def test_snapshot_updates_stale_and_last_sync(self):
        self.client._stale = True
        self.client._replace_cache_from_snapshot([], 1750000000000)
        self.assertFalse(self.client.is_stale())
        self.assertIsNotNone(self.client.get_last_sync_at())


class TimestampParseTest(unittest.TestCase):
    def test_iso_with_z_suffix(self):
        self.assertEqual(
            client_module._parse_timestamp_ms("2026-01-01T00:00:00Z"), V2026
        )

    def test_iso_with_offset(self):
        self.assertEqual(
            client_module._parse_timestamp_ms("2025-01-01T00:00:00+00:00"),
            V2025,
        )

    def test_naive_iso_parsed_as_utc(self):
        self.assertEqual(
            client_module._parse_timestamp_ms("2026-01-01T00:00:00"), V2026
        )

    def test_invalid_returns_zero(self):
        self.assertEqual(client_module._parse_timestamp_ms("not-a-date"), 0)


if __name__ == "__main__":
    unittest.main()
