import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src"))

from canarygate.hash import hash_string


class HashStringTest(unittest.TestCase):
    def test_known_vectors(self):
        vectors = {
            "feature-rollout-a:user-42": 59,
            "new-checkout:vitor-1": 20,
            "dark-mode:anon-999": 71,
            "flag-x:": 94,
        }
        for input_str, expected in vectors.items():
            with self.subTest(input_str=input_str):
                self.assertEqual(hash_string(input_str), expected)

    def test_empty_string(self):
        self.assertEqual(hash_string(""), 81)


if __name__ == "__main__":
    unittest.main()
