import json
import os
import subprocess
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import Mock, patch

import server
from server import build_council_prompt, format_evidence_package, normalize_evidence_package
from verification_cache import VerificationCache
from verification_trust import VerificationTrust


class DeploymentConfigurationTests(unittest.TestCase):
    def test_serverless_receipts_use_the_configured_signing_secret(self):
        with patch.dict(
            os.environ,
            {"VERCEL": "1", "VERIFICATION_SIGNING_SECRET": "stable-vercel-secret"},
            clear=False,
        ):
            self.assertEqual(
                server.verification_signing_secret(),
                b"stable-vercel-secret",
            )

    def test_serverless_deployment_requires_a_signing_secret(self):
        with patch.dict(os.environ, {"VERCEL": "1"}, clear=False):
            with patch.dict(os.environ, {}, clear=False):
                os.environ.pop("VERIFICATION_SIGNING_SECRET", None)
                with self.assertRaisesRegex(RuntimeError, "VERIFICATION_SIGNING_SECRET"):
                    server.verification_signing_secret()

    def test_serverless_cache_uses_the_writable_tmp_directory(self):
        with patch.dict(os.environ, {"VERCEL": "1"}, clear=False):
            os.environ.pop("VERIFICATION_CACHE_DIR", None)
            self.assertEqual(
                server.verification_cache_directory(),
                "/tmp/cyber-memory-cemetery-cache",
            )

    def test_vercel_python_routes_expose_the_existing_handler(self):
        from api.archive.seal import handler as archive_handler
        from api.gonka.verify import handler as verify_handler
        from api.status import handler as status_handler

        for route_handler in (status_handler, verify_handler, archive_handler):
            self.assertTrue(issubclass(route_handler, server.Handler))
            self.assertIsNot(route_handler, server.Handler)


class ArchiveSealTests(unittest.TestCase):
    def setUp(self):
        self.trust = VerificationTrust(
            secret=b"archive-test-receipt-secret",
            receipt_ttl_seconds=60,
            now=lambda: 1000,
        )

    def archive_request(self, verification_state="live_consensus"):
        evidence = self.trust.prepare_evidence(
            "xiami",
            {
                "schema": "cyber-memory-cemetery/evidence/v1",
                "caseId": "xiami",
                "version": "2026-07-15.1",
                "evidenceCompleteness": 92,
                "claims": [
                    {
                        "id": "claim-a",
                        "claim": "Short public fact.",
                        "sourceTitle": "Public source",
                        "sourceUrl": "https://example.test/source",
                        "confidence": "primary",
                        "publicArchiveAllowed": True,
                    }
                ],
            },
        )
        live_requests = [
            {
                "role": "digital_archaeologist",
                "model": "model-a",
                "requestId": "gonka-a",
                "requestedAt": "2026-07-15T12:00:00Z",
                "truthScore": 90,
                "summary": "A",
                "verifiedFacts": [],
                "uncertainClaims": [],
                "riskFlags": [],
                "fallback": False,
            },
            {
                "role": "truth_verifier",
                "model": "model-b",
                "requestId": "gonka-b",
                "requestedAt": "2026-07-15T12:00:01Z",
                "truthScore": 84,
                "summary": "B",
                "verifiedFacts": [],
                "uncertainClaims": [],
                "riskFlags": [],
                "fallback": False,
            },
        ]
        if verification_state == "partial":
            live_requests[1].update(
                {"requestId": "mock_verifier", "truthScore": None, "fallback": True}
            )
        if verification_state == "demo_fallback":
            for index, request in enumerate(live_requests):
                request.update(
                    {
                        "model": f"mock-model-{index}",
                        "requestId": f"mock_request_{index}",
                        "truthScore": None,
                        "fallback": True,
                    }
                )
        truth_score = 87 if verification_state == "live_consensus" else 90 if verification_state == "partial" else 86
        verification = {
            "source": "mock" if verification_state == "demo_fallback" else "gonka",
            "caseId": "xiami",
            "verifiedAt": "2026-07-15T12:00:02Z",
            "verificationState": verification_state,
            "truthScore": truth_score,
            "scoreSpread": 6 if verification_state == "live_consensus" else None,
            "consensusConfidence": 90 if verification_state == "live_consensus" else 0,
            "sealEligibility": "verified" if verification_state == "live_consensus" else "draft",
            "cacheStatus": "test",
            "requests": live_requests,
            "notes": [],
        }
        issued = self.trust.issue(verification, evidence)
        return {
            "verificationReceipt": issued["verificationReceipt"],
            "payload": {
                "schema": "cyber-memory-cemetery/v0.2",
                "case": {"id": "xiami"},
                "contentCreatedAt": "2026-07-15T12:00:00Z",
                "evidencePackage": issued["evidencePackage"],
                "evidenceDigest": issued["evidenceDigest"],
                "verification": issued["verificationRecord"],
            },
        }

    def test_retry_keeps_the_same_content_hash(self):
        request = self.archive_request()
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", ""
        ):
            first = server.seal_archive(request)
            second = server.seal_archive(request)

        self.assertEqual(first["contentHash"], second["contentHash"])

    def test_mock_archive_is_a_draft(self):
        request = self.archive_request("demo_fallback")
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", ""
        ):
            result = server.seal_archive(request)

        self.assertEqual(result["sealEligibility"], "draft")

    def test_local_receipt_uses_frozen_payload_metadata_and_local_id(self):
        request = self.archive_request()
        payload = request["payload"]
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", ""
        ):
            result = server.seal_archive(request)

        digest = result["contentHash"].split(":", 1)[1]
        self.assertEqual(result["provider"], "local-sealed")
        self.assertEqual(result["archiveId"], f"local://sha256/{digest}")
        self.assertEqual(result["contentCreatedAt"], payload["contentCreatedAt"])
        self.assertEqual(result["verificationState"], "live_consensus")
        self.assertEqual(result["truthScore"], 87)
        self.assertEqual(result["requestIds"], ["gonka-a", "gonka-b"])

    def test_pinata_uploads_only_the_frozen_payload(self):
        request = self.archive_request()
        payload = request["payload"]
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(
            server, "upload_pinata_json", return_value={"IpfsHash": "bafy-test"}
        ) as upload:
            result = server.seal_archive(request)

        uploaded_payload = upload.call_args.args[0]
        self.assertEqual(uploaded_payload, payload)
        self.assertNotIn("receipt", uploaded_payload)
        self.assertEqual(result["provider"], "pinata-ipfs")
        self.assertEqual(result["archiveId"], "ipfs://bafy-test")

    def test_failed_pinata_upload_returns_a_retryable_local_receipt(self):
        request = self.archive_request()
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(
            server, "upload_pinata_json", side_effect=RuntimeError("offline")
        ):
            result = server.seal_archive(request)

        self.assertEqual(result["provider"], "local-sealed")
        self.assertTrue(result["archiveId"].startswith("local://sha256/"))
        self.assertNotIn("ar://demo", result["archiveId"])

    def test_pinata_response_without_cid_returns_a_retryable_local_receipt(self):
        request = self.archive_request()
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(
            server, "upload_pinata_json", return_value={}
        ):
            result = server.seal_archive(request)
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", ""
        ):
            local_result = server.seal_archive(request)

        self.assertEqual(result["provider"], "local-sealed")
        self.assertEqual(result["status"], "pinata-response-missing-cid")
        self.assertEqual(result["archiveId"], local_result["archiveId"])
        self.assertEqual(result["contentHash"], local_result["contentHash"])
        self.assertEqual(result["gatewayUrl"], "")
        self.assertTrue(result["notes"])

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

    def test_archive_handler_rejects_oversized_body_before_reading_it(self):
        handler = object.__new__(server.Handler)
        handler.path = "/api/archive/seal"
        handler.headers = {"Content-Length": str(server.MAX_ARCHIVE_REQUEST_BYTES + 1)}
        handler.rfile = Mock()
        handler.send_json = Mock()

        handler.do_POST()

        handler.rfile.read.assert_not_called()
        handler.send_json.assert_called_once_with(413, {"error": "Archive request is too large"})

    def test_archive_handler_rejects_a_negative_body_length_before_reading_it(self):
        handler = object.__new__(server.Handler)
        handler.path = "/api/archive/seal"
        handler.headers = {"Content-Length": "-1"}
        handler.rfile = Mock()
        handler.send_json = Mock()

        handler.do_POST()

        handler.rfile.read.assert_not_called()
        handler.send_json.assert_called_once_with(400, {"error": "Invalid Content-Length"})

    def test_browser_fallback_uses_the_frozen_payload_canonical_hash(self):
        script = r"""
const { webcrypto } = require("node:crypto");
const core = require("./core.js");
const payload = {
  case: { id: "xiami", originalUrl: "https://www.xiami.com" },
  contentCreatedAt: "2026-07-15T12:00:00Z",
  verification: {
    verificationState: "cached_live",
    truthScore: 87,
    requests: [{ requestId: "gonka-a" }, { requestId: "gonka-b" }],
  },
};
core.createLocalArchiveSeal(payload, { cryptoProvider: webcrypto }).then((seal) => {
  process.stdout.write(JSON.stringify(seal));
});
"""
        completed = subprocess.run(
            ["node", "-e", script],
            check=True,
            capture_output=True,
            text=True,
        )
        seal = json.loads(completed.stdout)
        digest = "dcd88d688b543883ad651ef7a542993450bc9ffd25f8290891a98874214bb02b"

        self.assertEqual(seal["provider"], "local-sealed")
        self.assertEqual(seal["contentHash"], f"sha256:{digest}")
        self.assertEqual(seal["archiveId"], f"local://sha256/{digest}")

    def test_server_rejects_a_missing_or_forged_verification_receipt(self):
        request = self.archive_request()
        missing = {"payload": request["payload"]}
        forged = {**request, "verificationReceipt": "forged.receipt"}

        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(
            server, "upload_pinata_json", return_value={}
        ) as upload:
            with self.assertRaisesRegex(ValueError, "receipt"):
                server.seal_archive(missing)
            with self.assertRaisesRegex(ValueError, "receipt"):
                server.seal_archive(forged)

        upload.assert_not_called()

    def test_server_rejects_an_oversized_archive_before_pinata(self):
        request = self.archive_request()
        request["payload"]["padding"] = "x" * 600_000

        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(
            server, "upload_pinata_json", return_value={}
        ) as upload:
            with self.assertRaisesRegex(ValueError, "too large"):
                server.seal_archive(request)

        upload.assert_not_called()

    def test_server_rejects_a_valid_receipt_bound_to_different_archive_content(self):
        request = self.archive_request()
        request["payload"]["verification"]["truthScore"] = 99

        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(server, "upload_pinata_json", return_value={}) as upload:
            with self.assertRaisesRegex(ValueError, "mismatch"):
                server.seal_archive(request)

        upload.assert_not_called()

    def test_duplicate_valid_pinata_retry_reuses_the_existing_seal(self):
        request = self.archive_request()
        with patch.object(server, "VERIFICATION_TRUST", self.trust, create=True), patch.object(
            server, "PINATA_JWT", "test-jwt"
        ), patch.object(server, "ARCHIVE_SEAL_RESULTS", {}, create=True), patch.object(
            server, "upload_pinata_json", return_value={"IpfsHash": "bafy-test"}
        ) as upload:
            first = server.seal_archive(request)
            second = server.seal_archive(request)

        self.assertEqual(second, first)
        upload.assert_called_once()


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
            "caseId": "xiami",
            "verificationState": "live_consensus",
            "verifiedAt": "2026-07-15T12:00:00Z",
            "truthScore": 87,
            "scoreSpread": 6,
            "consensusConfidence": 90,
            "sealEligibility": "verified",
            "cacheAgeSeconds": 30,
            "requests": [
                {
                    "role": "digital_archaeologist",
                    "model": "archaeologist",
                    "requestId": "gonka-a",
                    "requestedAt": "2026-07-15T11:59:58Z",
                    "truthScore": 90,
                    "fallback": False,
                },
                {
                    "role": "truth_verifier",
                    "model": "verifier",
                    "requestId": "gonka-b",
                    "requestedAt": "2026-07-15T11:59:59Z",
                    "truthScore": 84,
                    "fallback": False,
                },
            ],
        }
        with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
            server,
            "resolve_council_models",
            return_value=("archaeologist", "verifier", ["archaeologist", "verifier"]),
        ), patch.object(server, "run_live_council", side_effect=RuntimeError("offline")), patch.object(
            server.VERIFICATION_CACHE, "latest_compatible", return_value=cached
        ):
            result = server.run_gonka_verification({"case": {"id": "xiami"}})
        self.assertEqual(result["verificationState"], "cached_live")
        self.assertEqual(result["requests"][0]["requestId"], "gonka-a")
        self.assertEqual(result["requests"][1]["model"], "verifier")
        self.assertEqual(result["verifiedAt"], "2026-07-15T12:00:00Z")
        self.assertEqual(result["cacheStatus"], "restored_after_live_failure")

    def test_two_member_failures_restore_latest_live_cache(self):
        cached = {
            "source": "gonka",
            "caseId": "xiami",
            "verificationState": "live_consensus",
            "verifiedAt": "2026-07-15T12:00:00Z",
            "truthScore": 87,
            "scoreSpread": 6,
            "consensusConfidence": 90,
            "sealEligibility": "verified",
            "cacheAgeSeconds": 30,
            "requests": [
                {
                    "role": "digital_archaeologist",
                    "model": "archaeologist",
                    "requestId": "gonka-a",
                    "requestedAt": "2026-07-15T11:59:58Z",
                    "truthScore": 90,
                    "fallback": False,
                },
                {
                    "role": "truth_verifier",
                    "model": "verifier",
                    "requestId": "gonka-b",
                    "requestedAt": "2026-07-15T11:59:59Z",
                    "truthScore": 84,
                    "fallback": False,
                },
            ],
        }
        with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
            server,
            "resolve_council_models",
            return_value=("archaeologist", "verifier", ["archaeologist", "verifier"]),
        ), patch.object(server, "run_council_member", side_effect=RuntimeError("offline")), patch.object(
            server.VERIFICATION_CACHE, "latest_compatible", return_value=cached
        ):
            result = server.run_gonka_verification({"case": {"id": "xiami"}})

        self.assertEqual(result["verificationState"], "cached_live")
        self.assertEqual(result["requests"][1]["requestId"], "gonka-b")

    def test_cache_recovery_requires_matching_evidence_version_digest_and_model_set(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            cache.write(
                "compatible",
                {
                    "caseId": "xiami",
                    "verificationState": "live_consensus",
                    "verifiedAt": "1970-01-01T00:15:50Z",
                    "evidenceVersion": "2026-07-15.1",
                    "evidenceDigest": "sha256:expected",
                    "modelSet": ["model-a", "model-b"],
                    "requests": [],
                },
            )
            incompatible_records = [
                ("wrong-version", "2026-07-15.2", "sha256:expected", ["model-a", "model-b"]),
                ("wrong-digest", "2026-07-15.1", "sha256:other", ["model-a", "model-b"]),
                ("wrong-models", "2026-07-15.1", "sha256:expected", ["model-a", "model-c"]),
            ]
            for key, version, digest, models in incompatible_records:
                cache.write(
                    key,
                    {
                        "caseId": "xiami",
                        "verificationState": "live_consensus",
                        "verifiedAt": "1970-01-01T00:16:30Z",
                        "evidenceVersion": version,
                        "evidenceDigest": digest,
                        "modelSet": models,
                        "requests": [],
                    },
                )

            result = cache.latest_compatible(
                case_id="xiami",
                evidence_version="2026-07-15.1",
                evidence_digest="sha256:expected",
                models=["model-b", "model-a"],
                ttl_seconds=60,
                now=1000,
            )

        self.assertEqual(result["cacheKey"], "compatible")
        self.assertEqual(result["cacheAgeSeconds"], 50)

    def test_cache_recovery_rejects_expired_entries(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            cache.write(
                "expired",
                {
                    "caseId": "xiami",
                    "verificationState": "live_consensus",
                    "verifiedAt": "1970-01-01T00:15:40Z",
                    "evidenceVersion": "2026-07-15.1",
                    "evidenceDigest": "sha256:expected",
                    "modelSet": ["model-a", "model-b"],
                    "requests": [],
                },
            )

            result = cache.latest_compatible(
                case_id="xiami",
                evidence_version="2026-07-15.1",
                evidence_digest="sha256:expected",
                models=["model-a", "model-b"],
                ttl_seconds=60,
                now=1000,
            )

        self.assertIsNone(result)


class GonkaCouncilStateTests(unittest.TestCase):
    def test_duplicate_explicit_models_are_rejected_before_dispatch(self):
        with patch.object(server, "GONKA_ARCHAEOLOGIST_MODEL", "model-a"), patch.object(
            server, "GONKA_VERIFIER_MODEL", "model-a"
        ), patch.object(server, "ordered_models", return_value=["model-a", "model-b"]):
            with self.assertRaisesRegex(ValueError, "distinct"):
                server.resolve_council_models()

    def test_model_pool_with_fewer_than_two_distinct_models_is_rejected(self):
        with patch.object(server, "GONKA_MODEL", "auto"), patch.object(
            server, "GONKA_ARCHAEOLOGIST_MODEL", "auto"
        ), patch.object(server, "GONKA_VERIFIER_MODEL", "auto"), patch.object(
            server, "ordered_models", return_value=["model-a", "model-a"]
        ):
            with self.assertRaisesRegex(ValueError, "two distinct"):
                server.resolve_council_models()

    def test_missing_or_malformed_request_id_cannot_count_as_success(self):
        for request_id in (None, "", "gonka_req_unknown", ["not-a-string"]):
            with self.subTest(request_id=request_id):
                normalized = server.normalize_council_request(
                    {
                        "role": "digital_archaeologist",
                        "model": "model-a",
                        "requestId": request_id,
                        "details": {"truthScore": 88},
                    },
                    86,
                )
                self.assertTrue(normalized["fallback"])
                self.assertIsNone(normalized["truthScore"])

    def test_missing_malformed_or_non_finite_score_cannot_count_as_success(self):
        for score in (None, True, False, "not-a-score", float("nan"), float("inf"), float("-inf")):
            with self.subTest(score=score):
                normalized = server.normalize_council_request(
                    {
                        "role": "truth_verifier",
                        "model": "model-b",
                        "requestId": "devshard-real-request",
                        "details": {"truthScore": score},
                    },
                    86,
                )
                self.assertTrue(normalized["fallback"])
                self.assertIsNone(normalized["truthScore"])

    def test_invalid_raw_scores_cannot_reach_live_consensus_or_cache(self):
        payload = {
            "case": {"id": "xiami", "truthScore": 86},
            "evidencePackage": {"version": "2026-07-15.1", "claims": []},
        }

        for raw_score in (-1, 101, float("nan"), float("inf"), float("-inf")):
            with self.subTest(raw_score=raw_score):
                def council_response(role, model, _payload, _temperature):
                    return {
                        "role": role,
                        "model": model,
                        "requestId": f"request-{model}",
                        "summary": "strict score probe",
                        "details": {"truthScore": raw_score if model == "archaeologist" else 84},
                    }

                with patch.object(server, "GONKA_API_KEY", "test-key"), patch.object(
                    server,
                    "resolve_council_models",
                    return_value=("archaeologist", "verifier", ["archaeologist", "verifier"]),
                ), patch.object(
                    server, "run_council_member", side_effect=council_response
                ), patch.object(server.VERIFICATION_CACHE, "write") as write:
                    result = server.run_gonka_verification(payload)

                self.assertEqual(result["verificationState"], "partial")
                self.assertEqual(result["sealEligibility"], "draft")
                self.assertTrue(result["requests"][0]["fallback"])
                self.assertIsNone(result["requests"][0]["truthScore"])
                self.assertEqual(result["verificationRecord"]["verificationState"], "partial")
                write.assert_not_called()

    def test_malformed_model_json_cannot_count_as_success(self):
        payload = {"case": {"id": "xiami", "truthScore": 86}}
        with patch.object(
            server,
            "chat_completion",
            return_value={"requestId": "devshard-real-request", "content": "not-json"},
        ):
            request = server.run_council_member(
                "digital_archaeologist", "model-a", payload, 0.2
            )
        normalized = server.normalize_council_request(request, 86)

        self.assertTrue(normalized["fallback"])
        self.assertIsNone(normalized["truthScore"])

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
        self.assertIsNone(result["requests"][1]["truthScore"])
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
            server.VERIFICATION_CACHE, "latest_compatible", return_value=None
        ) as latest_compatible:
            result = server.run_gonka_verification(payload)

        self.assertEqual(result["source"], "mock")
        self.assertEqual(len(result["requests"]), 2)
        for request in result["requests"]:
            self.assertTrue(request["details"]["fallback"])
            self.assertTrue(request["requestId"].startswith("mock_gonka_"))
        latest_compatible.assert_called_once()

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
