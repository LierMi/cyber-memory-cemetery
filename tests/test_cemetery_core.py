import unittest

from cemetery_core import (
    aggregate_consensus,
    archive_eligibility,
    cache_key,
    content_hash,
    normalize_score,
)


class CemeteryCoreTests(unittest.TestCase):
    def test_normalize_score_accepts_ten_and_hundred_point_scales(self):
        self.assertEqual(normalize_score(8.6, 0), 86)
        self.assertEqual(normalize_score(91, 0), 91)

    def test_two_live_models_create_live_consensus(self):
        result = aggregate_consensus(
            [
                {"truthScore": 90, "fallback": False},
                {"truthScore": 84, "fallback": False},
            ],
            evidence_completeness=92,
        )
        self.assertEqual(result["verificationState"], "live_consensus")
        self.assertEqual(result["truthScore"], 87)
        self.assertEqual(result["scoreSpread"], 6)
        self.assertGreaterEqual(result["consensusConfidence"], 80)

    def test_one_live_model_is_partial(self):
        result = aggregate_consensus(
            [
                {"truthScore": 88, "fallback": False},
                {"truthScore": 93, "fallback": True},
            ],
            evidence_completeness=92,
        )
        self.assertEqual(result["verificationState"], "partial")
        self.assertEqual(archive_eligibility(result["verificationState"]), "draft")

    def test_hash_and_cache_key_are_deterministic(self):
        payload = {"case": {"id": "xiami"}, "score": 87}
        self.assertEqual(content_hash(payload), content_hash(payload))
        self.assertEqual(
            cache_key("xiami", "2026-07-15.1", ["model-b", "model-a"]),
            cache_key("xiami", "2026-07-15.1", ["model-a", "model-b"]),
        )


if __name__ == "__main__":
    unittest.main()
