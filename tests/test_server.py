import json
import unittest
from pathlib import Path

from server import build_council_prompt, format_evidence_package


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

    def test_council_prompts_include_formatted_evidence_claims(self):
        evidence_package = {
            "claims": [
                {
                    "confidence": "primary",
                    "claim": "音乐消费场景于 2021 年 2 月 5 日停止。",
                    "sourceUrl": "https://example.test/shutdown",
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
