import json
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import Mock, patch

import server
from server import build_council_prompt, format_evidence_package, normalize_evidence_package
from verification_cache import VerificationCache


class ArchiveSealTests(unittest.TestCase):
    def archive_payload(self, verification_state="live_consensus"):
        return {
            "case": {"id": "xiami"},
            "contentCreatedAt": "2026-07-15T12:00:00Z",
            "verification": {
                "verificationState": verification_state,
                "truthScore": 87,
                "requests": [{"requestId": "gonka-a"}, {"requestId": "gonka-b"}],
            },
        }

    def test_retry_keeps_the_same_content_hash(self):
        payload = {
            "case": {"id": "xiami"},
            "contentCreatedAt": "2026-07-15T12:00:00Z",
            "verification": {"verificationState": "live_consensus"},
        }
        with patch.object(server, "PINATA_JWT", ""):
            first = server.seal_archive({"payload": payload})
            second = server.seal_archive({"payload": payload})

        self.assertEqual(first["contentHash"], second["contentHash"])

    def test_mock_archive_is_a_draft(self):
        payload = {
            "case": {"id": "xiami"},
            "contentCreatedAt": "2026-07-15T12:00:00Z",
            "verification": {"verificationState": "demo_fallback"},
        }
        with patch.object(server, "PINATA_JWT", ""):
            result = server.seal_archive({"payload": payload})

        self.assertEqual(result["sealEligibility"], "draft")

    def test_local_receipt_uses_frozen_payload_metadata_and_local_id(self):
        payload = self.archive_payload()
        with patch.object(server, "PINATA_JWT", ""):
            result = server.seal_archive({"payload": payload})

        digest = result["contentHash"].split(":", 1)[1]
        self.assertEqual(result["provider"], "local-sealed")
        self.assertEqual(result["archiveId"], f"local://sha256/{digest}")
        self.assertEqual(result["contentCreatedAt"], payload["contentCreatedAt"])
        self.assertEqual(result["verificationState"], "live_consensus")
        self.assertEqual(result["truthScore"], 87)
        self.assertEqual(result["requestIds"], ["gonka-a", "gonka-b"])

    def test_pinata_uploads_only_the_frozen_payload(self):
        payload = self.archive_payload()
        with patch.object(server, "PINATA_JWT", "test-jwt"), patch.object(
            server, "upload_pinata_json", return_value={"IpfsHash": "bafy-test"}
        ) as upload:
            result = server.seal_archive({"payload": payload})

        uploaded_payload = upload.call_args.args[0]
        self.assertEqual(uploaded_payload, payload)
        self.assertNotIn("receipt", uploaded_payload)
        self.assertEqual(result["provider"], "pinata-ipfs")
        self.assertEqual(result["archiveId"], "ipfs://bafy-test")

    def test_failed_pinata_upload_returns_a_retryable_local_receipt(self):
        payload = self.archive_payload()
        with patch.object(server, "PINATA_JWT", "test-jwt"), patch.object(
            server, "upload_pinata_json", side_effect=RuntimeError("offline")
        ):
            result = server.seal_archive({"payload": payload})

        self.assertEqual(result["provider"], "local-sealed")
        self.assertTrue(result["archiveId"].startswith("local://sha256/"))
        self.assertNotIn("ar://demo", result["archiveId"])

    def test_status_endpoint_reports_service_state_without_secrets(self):
        handler = object.__new__(server.Handler)
        handler.path = "/api/status"
        handler.send_json = Mock()
        with patch.object(server, "GONKA_API_KEY", "gonka-secret"), patch.object(
            server, "PINATA_JWT", "pinata-secret"
        ):
            handler.do_GET()

        response = handler.send_json.call_args.args[1]
        self.assertEqual(response, {"gonka": "live", "ipfs": "configured", "cache": "enabled"})
        self.assertNotIn("gonka-secret", str(response))
        self.assertNotIn("pinata-secret", str(response))

    def test_browser_fallback_uses_the_frozen_payload_canonical_hash(self):
        source = Path("app.js").read_text(encoding="utf-8")

        self.assertIn("function canonicalArchiveJson(value)", source)
        self.assertIn("const canonical = canonicalArchiveJson(basePayload);", source)
        self.assertIn('"local-sealed": "本地封存，不具备永久存储证明"', source)
        self.assertNotIn('provider: "demo-local"', source)
        self.assertNotIn("ar://demo", source)


class VerificationCacheTests(unittest.TestCase):
    def test_round_trip_preserves_request_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            value = {
                "verificationState": "live_consensus",
                "requests": [{"requestId": "gonka-1"}],
            }
            cache.write("abc", value)
            self.assertEqual(cache.read("abc")["requests"][0]["requestId"], "gonka-1")

    def test_latest_for_case_skips_malformed_and_unreadable_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            cache.write(
                "valid",
                {
                    "caseId": "xiami",
                    "verificationState": "live_consensus",
                    "verifiedAt": "2026-07-15T12:00:00Z",
                    "requests": [],
                },
            )
            (Path(directory) / "invalid.json").write_text("{not json", encoding="utf-8")
            (Path(directory) / "array.json").write_text("[]", encoding="utf-8")
            (Path(directory) / "malformed.json").write_text(
                json.dumps(
                    {
                        "caseId": ["xiami"],
                        "verificationState": "live_consensus",
                        "requests": [],
                    }
                ),
                encoding="utf-8",
            )
            unreadable = Path(directory) / "unreadable.json"
            unreadable.write_text("{}", encoding="utf-8")
            original_read_text = Path.read_text

            def read_text(path, *args, **kwargs):
                if path == unreadable:
                    raise OSError("permission denied")
                return original_read_text(path, *args, **kwargs)

            with patch.object(Path, "read_text", new=read_text):
                result = cache.latest_for_case("xiami")

        self.assertEqual(result["verifiedAt"], "2026-07-15T12:00:00Z")

    def test_latest_for_case_breaks_equal_timestamps_by_filename(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            for key in ("alpha", "beta"):
                cache.write(
                    key,
                    {
                        "caseId": "xiami",
                        "verificationState": "live_consensus",
                        "verifiedAt": "2026-07-15T12:00:00Z",
                        "requests": [],
                        "cacheKey": key,
                    },
                )

            result = cache.latest_for_case("xiami")

        self.assertEqual(result["cacheKey"], "beta")

    def test_latest_for_case_treats_missing_or_non_string_timestamps_as_oldest(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            cache.write(
                "missing",
                {
                    "caseId": "xiami",
                    "verificationState": "live_consensus",
                    "requests": [],
                    "cacheKey": "missing",
                },
            )
            cache.write(
                "numeric",
                {
                    "caseId": "xiami",
                    "verificationState": "live_consensus",
                    "verifiedAt": 123,
                    "requests": [],
                    "cacheKey": "numeric",
                },
            )
            cache.write(
                "dated",
                {
                    "caseId": "xiami",
                    "verificationState": "live_consensus",
                    "verifiedAt": "2026-07-15T12:00:00Z",
                    "requests": [],
                    "cacheKey": "dated",
                },
            )

            result = cache.latest_for_case("xiami")

        self.assertEqual(result["cacheKey"], "dated")

    def test_concurrent_same_key_writes_are_atomic_and_leave_no_temporary_files(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))

            def write(index):
                cache.write("shared", {"writer": index, "requests": []})

            with ThreadPoolExecutor(max_workers=12) as executor:
                futures = [executor.submit(write, index) for index in range(24)]
                errors = [future.exception() for future in futures]

            final_payload = json.loads((Path(directory) / "shared.json").read_text(encoding="utf-8"))
            temporary_files = list(Path(directory).glob("*.tmp"))

        self.assertEqual(errors, [None] * 24)
        self.assertIn(final_payload["writer"], range(24))
        self.assertEqual(temporary_files, [])

    def test_two_failed_models_use_real_cache(self):
        cached = {
            "source": "gonka",
            "verificationState": "live_consensus",
            "verifiedAt": "2026-07-15T12:00:00Z",
            "requests": [
                {"model": "archaeologist", "requestId": "gonka-a"},
                {"model": "verifier", "requestId": "gonka-b"},
            ],
        }
        with patch.object(server, "GONKA_API_KEY", "test-key"):
            with patch.object(server, "run_live_council", side_effect=RuntimeError("offline")):
                with patch.object(server.VERIFICATION_CACHE, "latest_for_case", return_value=cached):
                    result = server.run_gonka_verification({"case": {"id": "xiami"}})
        self.assertEqual(result["verificationState"], "cached_live")
        self.assertEqual(result["requests"][0]["requestId"], "gonka-a")
        self.assertEqual(result["requests"][1]["model"], "verifier")
        self.assertEqual(result["verifiedAt"], "2026-07-15T12:00:00Z")
        self.assertEqual(result["cacheStatus"], "restored_after_live_failure")

    def test_two_member_failures_restore_latest_live_cache(self):
        cached = {
            "source": "gonka",
            "verificationState": "live_consensus",
            "verifiedAt": "2026-07-15T12:00:00Z",
            "requests": [{"requestId": "gonka-a"}, {"requestId": "gonka-b"}],
        }
        with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
            server, "resolve_council_models", return_value=("archaeologist", "verifier", [])
        ), patch.object(server, "run_council_member", side_effect=RuntimeError("offline")), patch.object(
            server.VERIFICATION_CACHE, "latest_for_case", return_value=cached
        ):
            result = server.run_gonka_verification({"case": {"id": "xiami"}})

        self.assertEqual(result["verificationState"], "cached_live")
        self.assertEqual(result["requests"][1]["requestId"], "gonka-b")


class GonkaCouncilStateTests(unittest.TestCase):
    def test_two_real_models_normalize_to_live_consensus_and_write_cache(self):
        payload = {
            "case": {"id": "xiami", "epitaph": "test"},
            "evidencePackage": {"version": "2026-07-15.1", "claims": []},
        }
        responses = [
            {
                "role": "digital_archaeologist",
                "model": "archaeologist",
                "requestId": "gonka-a",
                "summary": "archaeologist result",
                "details": {"truthScore": 9.0, "verifiedFacts": "fact", "riskFlags": None},
            },
            {
                "role": "truth_verifier",
                "model": "verifier",
                "requestId": "gonka-b",
                "summary": "verifier result",
                "details": {"truthScore": 84, "uncertainClaims": ["uncertain"]},
            },
        ]
        with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
            server, "resolve_council_models", return_value=("archaeologist", "verifier", [])
        ), patch.object(server, "run_council_member", side_effect=responses), patch.object(
            server.VERIFICATION_CACHE, "write"
        ) as write:
            result = server.run_gonka_verification(payload)

        self.assertEqual(result["source"], "gonka")
        self.assertEqual(result["verificationState"], "live_consensus")
        self.assertEqual(result["truthScore"], 87)
        self.assertEqual(result["scoreSpread"], 6)
        self.assertEqual(result["sealEligibility"], "verified")
        self.assertEqual(result["cacheStatus"], "written_live_consensus")
        self.assertTrue(result["cacheKey"])
        self.assertTrue(result["verifiedAt"].endswith("Z"))
        for request in result["requests"]:
            self.assertTrue(request["requestedAt"].endswith("Z"))
            self.assertIsInstance(request["truthScore"], int)
            self.assertIsInstance(request["verifiedFacts"], list)
            self.assertIsInstance(request["uncertainClaims"], list)
            self.assertIsInstance(request["riskFlags"], list)
            self.assertFalse(request["fallback"])
        write.assert_called_once_with(result["cacheKey"], result)

    def test_one_real_model_remains_partial_and_is_not_cached(self):
        payload = {"case": {"id": "xiami", "truthScore": 86}}
        responses = [
            {
                "role": "digital_archaeologist",
                "model": "archaeologist",
                "requestId": "gonka-a",
                "summary": "archaeologist result",
                "details": {"truthScore": 88},
            },
            server.fallback_request(
                "truth_verifier", "verifier", payload["case"], "forced failure"
            ),
        ]
        with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
            server, "resolve_council_models", return_value=("archaeologist", "verifier", [])
        ), patch.object(server, "run_council_member", side_effect=responses), patch.object(
            server.VERIFICATION_CACHE, "write"
        ) as write:
            result = server.run_gonka_verification(payload)

        self.assertEqual(result["verificationState"], "partial")
        self.assertEqual(result["sealEligibility"], "draft")
        self.assertEqual(result["cacheStatus"], "not_cached_partial")
        self.assertIsInstance(result["requests"][1]["truthScore"], int)
        write.assert_not_called()


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
        ), patch.object(server, "run_council_member", side_effect=RuntimeError("forced failure")), patch.object(
            server.VERIFICATION_CACHE, "latest_for_case", return_value=None
        ):
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
