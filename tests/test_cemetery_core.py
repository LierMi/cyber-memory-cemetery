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

    def test_normalize_score_rejects_non_finite_values(self):
        fallback = 17
        for value in (float("nan"), float("inf"), float("-inf"), "nan", "inf", "-inf"):
            with self.subTest(value=value):
                self.assertEqual(normalize_score(value, fallback), fallback)

    def test_two_live_models_create_live_consensus(self):
        result = aggregate_consensus(
            [
                {
                    "model": "model-a",
                    "requestId": "request-a",
                    "truthScore": 90,
                    "fallback": False,
                },
                {
                    "model": "model-b",
                    "requestId": "request-b",
                    "truthScore": 84,
                    "fallback": False,
                },
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
                {
                    "model": "model-a",
                    "requestId": "request-a",
                    "truthScore": 88,
                    "fallback": False,
                },
                {
                    "model": "model-b",
                    "requestId": "mock_request_b",
                    "truthScore": 93,
                    "fallback": True,
                },
            ],
            evidence_completeness=92,
        )
        self.assertEqual(result["verificationState"], "partial")
        self.assertEqual(archive_eligibility(result["verificationState"]), "draft")

    def test_duplicate_successful_model_ids_cannot_create_live_consensus(self):
        result = aggregate_consensus(
            [
                {
                    "model": "model-a",
                    "requestId": "request-a",
                    "truthScore": 90,
                    "fallback": False,
                },
                {
                    "model": "model-a",
                    "requestId": "request-b",
                    "truthScore": 84,
                    "fallback": False,
                },
            ],
            evidence_completeness=92,
        )

        self.assertEqual(result["verificationState"], "partial")
        self.assertEqual(result["sealEligibility"], "draft")

    def test_only_live_receipts_are_verified_for_archive_sealing(self):
        self.assertEqual(archive_eligibility("live_consensus"), "verified")
        self.assertEqual(archive_eligibility("cached_live"), "verified")
        self.assertEqual(archive_eligibility("partial"), "draft")
        self.assertEqual(archive_eligibility("demo_fallback"), "draft")

    def test_hash_and_cache_key_are_deterministic(self):
        payload = {"case": {"id": "xiami"}, "score": 87}
        self.assertEqual(content_hash(payload), content_hash(payload))
        self.assertEqual(
            cache_key("xiami", "2026-07-15.1", ["model-b", "model-a"]),
            cache_key("xiami", "2026-07-15.1", ["model-a", "model-b"]),
        )


if __name__ == "__main__":
    unittest.main()
