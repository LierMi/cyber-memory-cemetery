import json
import unittest
from pathlib import Path
from unittest.mock import patch

import server
from server import build_council_prompt, format_evidence_package, normalize_evidence_package


class XiamiEvidenceTests(unittest.TestCase):
    def test_evidence_package_is_versioned_and_public(self):
        payload = json.loads(Path("data/xiami-evidence.json").read_text(encoding="utf-8"))
        self.assertEqual(payload["caseId"], "xiami")
        self.assertRegex(payload["version"], r"^\d{4}-\d{2}-\d{2}\.\d+$")
        self.assertGreaterEqual(len(payload["claims"]), 6)
        for claim in payload["claims"]:
            self.assertTrue(claim["id"])
            self.assertTrue(claim["sourceUrl"].startswith("https://"))
            self.assertIn(claim["confidence"], {"primary", "secondary", "context"})
            self.assertIn("publicArchiveAllowed", claim)

    def test_press_shutdown_claims_are_secondary_but_wayback_metadata_is_primary(self):
        payload = json.loads(Path("data/xiami-evidence.json").read_text(encoding="utf-8"))
        press_claims = [
            claim
            for claim in payload["claims"]
            if "xinhuanet.com" in claim["sourceUrl"] or "eeo.com.cn" in claim["sourceUrl"]
        ]
        wayback_claim = next(
            claim for claim in payload["claims"] if claim["id"] == "xiami-wayback-snapshots"
        )

        self.assertTrue(press_claims)
        self.assertTrue(all(claim["confidence"] == "secondary" for claim in press_claims))
        self.assertEqual(wayback_claim["confidence"], "primary")

    def test_council_prompt_keeps_only_short_public_https_evidence_claims(self):
        oversized_claim = "OVERSIZED_MARKER " * 80
        evidence_package = {
            "claims": [
                {
                    "confidence": "primary",
                    "claim": "NON_PUBLIC_MARKER",
                    "sourceTitle": "Public-looking source",
                    "sourceUrl": "https://example.test/non-public",
                    "publicArchiveAllowed": False,
                },
                {
                    "confidence": "primary",
                    "claim": "NON_HTTPS_MARKER",
                    "sourceTitle": "HTTP source",
                    "sourceUrl": "http://example.test/http",
                    "publicArchiveAllowed": True,
                },
                {
                    "confidence": "primary",
                    "claim": ["NON_STRING_MARKER"],
                    "sourceTitle": "Malformed claim",
                    "sourceUrl": "https://example.test/malformed",
                    "publicArchiveAllowed": True,
                },
                {
                    "confidence": "primary",
                    "claim": oversized_claim,
                    "sourceTitle": "Oversized claim",
                    "sourceUrl": "https://example.test/oversized",
                    "publicArchiveAllowed": True,
                },
                {
                    "confidence": "primary",
                    "claim": "NON_STRING_TITLE_MARKER",
                    "sourceTitle": ["not a title"],
                    "sourceUrl": "https://example.test/non-string-title",
                    "publicArchiveAllowed": True,
                },
                {
                    "confidence": "primary",
                    "claim": "OVERSIZED_TITLE_MARKER",
                    "sourceTitle": "OVERSIZED_TITLE " * 40,
                    "sourceUrl": "https://example.test/oversized-title",
                    "publicArchiveAllowed": True,
                },
                {
                    "confidence": "primary",
                    "claim": "VALID_PUBLIC_SUMMARY",
                    "sourceTitle": "Valid public source",
                    "sourceUrl": "https://example.test/valid",
                    "publicArchiveAllowed": True,
                },
            ]
        }
        payload = {"case": {"name": "虾米音乐"}, "archive": {}, "evidencePackage": evidence_package}
        prompt = build_council_prompt(payload, "数字考古员")
        normalized = normalize_evidence_package(evidence_package)

        self.assertEqual(normalized["claims"][0]["sourceTitle"], "Valid public source")
        self.assertIn("VALID_PUBLIC_SUMMARY", prompt)
        self.assertNotIn("NON_PUBLIC_MARKER", prompt)
        self.assertNotIn("NON_HTTPS_MARKER", prompt)
        self.assertNotIn("NON_STRING_MARKER", prompt)
        self.assertNotIn("OVERSIZED_MARKER", prompt)
        self.assertNotIn("NON_STRING_TITLE_MARKER", prompt)
        self.assertNotIn("OVERSIZED_TITLE_MARKER", prompt)

    def test_evidence_normalizer_bounds_public_claim_count(self):
        evidence_package = {
            "claims": [
                {
                    "confidence": "secondary",
                    "claim": f"PUBLIC_CLAIM_{index}",
                    "sourceTitle": "Public source",
                    "sourceUrl": f"https://example.test/{index}",
                    "publicArchiveAllowed": True,
                }
                for index in range(20)
            ]
        }
        normalized = normalize_evidence_package(evidence_package)
        formatted = format_evidence_package(evidence_package)

        self.assertLess(len(normalized["claims"]), len(evidence_package["claims"]))
        self.assertIn("PUBLIC_CLAIM_0", formatted)
        self.assertNotIn("PUBLIC_CLAIM_19", formatted)

    def test_evidence_normalizer_defaults_malformed_confidence(self):
        formatted = format_evidence_package(
            {
                "claims": [
                    {
                        "confidence": ["not a confidence"],
                        "claim": "VALID_MALFORMED_CONFIDENCE_SUMMARY",
                        "sourceTitle": "Valid public source",
                        "sourceUrl": "https://example.test/confidence",
                        "publicArchiveAllowed": True,
                    }
                ]
            }
        )

        self.assertIn("[context] VALID_MALFORMED_CONFIDENCE_SUMMARY", formatted)

    def test_all_fallback_council_results_are_labeled_mock(self):
        payload = {"case": {"id": "xiami", "truthScore": 93, "epitaph": "test"}}

        with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
            server, "resolve_council_models", return_value=("archaeologist", "verifier", [])
        ), patch.object(server, "run_council_member", side_effect=RuntimeError("forced failure")):
            result = server.run_gonka_verification(payload)

        self.assertEqual(result["source"], "mock")
        self.assertEqual(len(result["requests"]), 2)
        for request in result["requests"]:
            self.assertTrue(request["details"]["fallback"])
            self.assertTrue(request["requestId"].startswith("mock_gonka_"))

    def test_council_prompts_include_formatted_evidence_claims(self):
        evidence_package = {
            "claims": [
                {
                    "confidence": "primary",
                    "claim": "音乐消费场景于 2021 年 2 月 5 日停止。",
                    "sourceTitle": "公开来源",
                    "sourceUrl": "https://example.test/shutdown",
                    "publicArchiveAllowed": True,
                }
            ]
        }
        payload = {
            "case": {"name": "虾米音乐"},
            "archive": {},
            "evidencePackage": evidence_package,
        }
        expected = format_evidence_package(evidence_package)

        self.assertIn(expected, build_council_prompt(payload, "数字考古员"))
        self.assertIn(expected, build_council_prompt(payload, "真相校验员"))

    def test_frontend_loads_and_sends_xiami_evidence_package(self):
        source = Path("app.js").read_text(encoding="utf-8")

        self.assertIn("const evidencePackages = new Map();", source)
        self.assertIn("async function loadEvidencePackage(caseId)", source)
        self.assertIn('fetch("./data/xiami-evidence.json")', source)
        self.assertIn("evidencePackage: await loadEvidencePackage(item.id),", source)


if __name__ == "__main__":
    unittest.main()
