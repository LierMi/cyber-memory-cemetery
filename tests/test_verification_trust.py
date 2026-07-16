import copy
import unittest

from verification_trust import ReceiptError, VerificationTrust


class VerificationTrustTests(unittest.TestCase):
    def setUp(self):
        self.clock = [1000]
        self.trust = VerificationTrust(
            secret=b"test-receipt-secret",
            receipt_ttl_seconds=60,
            now=lambda: self.clock[0],
        )
        self.evidence = {
            "schema": "cyber-memory-cemetery/evidence/v1",
            "caseId": "xiami",
            "version": "2026-07-15.1",
            "curatedAt": "2026-07-15T12:00:00Z",
            "evidenceCompleteness": 92,
            "privacyBoundary": "Public metadata and short factual summaries only.",
            "claims": [
                {
                    "id": "public-claim",
                    "claim": "A short public factual summary.",
                    "type": "timeline",
                    "sourceTitle": "Public source",
                    "sourceUrl": "https://example.test/public",
                    "sourceDate": "2021-02-05",
                    "confidence": "primary",
                    "supports": ["timeline"],
                    "publicArchiveAllowed": True,
                    "rightsNote": "Summary and URL only.",
                },
                {
                    "id": "private-claim",
                    "claim": "This must not be archived.",
                    "sourceTitle": "Private source",
                    "sourceUrl": "https://example.test/private",
                    "confidence": "context",
                    "publicArchiveAllowed": False,
                },
            ],
        }
        self.verification = {
            "source": "gonka",
            "caseId": "xiami",
            "verifiedAt": "2026-07-15T12:01:00Z",
            "verificationState": "live_consensus",
            "truthScore": 87,
            "scoreSpread": 6,
            "consensusConfidence": 90,
            "sealEligibility": "verified",
            "cacheStatus": "written_live_consensus",
            "requests": [
                {
                    "role": "digital_archaeologist",
                    "model": "model-a",
                    "requestId": "request-a",
                    "requestedAt": "2026-07-15T12:00:30Z",
                    "truthScore": 90,
                    "summary": "A",
                    "verifiedFacts": ["fact"],
                    "uncertainClaims": [],
                    "riskFlags": [],
                    "fallback": False,
                },
                {
                    "role": "truth_verifier",
                    "model": "model-b",
                    "requestId": "request-b",
                    "requestedAt": "2026-07-15T12:00:31Z",
                    "truthScore": 84,
                    "summary": "B",
                    "verifiedFacts": ["fact"],
                    "uncertainClaims": [],
                    "riskFlags": [],
                    "fallback": False,
                },
            ],
            "notes": [],
        }

    def issue(self):
        evidence = self.trust.prepare_evidence("xiami", self.evidence)
        return self.trust.issue(self.verification, evidence)

    @staticmethod
    def archive_request(issued):
        return {
            "verificationReceipt": issued["verificationReceipt"],
            "payload": {
                "schema": "cyber-memory-cemetery/v0.2",
                "contentCreatedAt": "2026-07-15T12:02:00Z",
                "case": {"id": "xiami", "name": "Xiami Music"},
                "evidencePackage": issued["evidencePackage"],
                "evidenceDigest": issued["evidenceDigest"],
                "verification": issued["verificationRecord"],
            },
        }

    def test_evidence_binding_keeps_only_canonical_public_source_metadata(self):
        first = self.trust.prepare_evidence("xiami", self.evidence)
        second = self.trust.prepare_evidence("xiami", copy.deepcopy(self.evidence))

        self.assertEqual(first["digest"], second["digest"])
        self.assertEqual(first["package"]["schema"], "cyber-memory-cemetery/evidence/v1")
        self.assertEqual(first["package"]["version"], "2026-07-15.1")
        self.assertEqual([claim["id"] for claim in first["package"]["claims"]], ["public-claim"])
        self.assertNotIn("This must not be archived", str(first["package"]))

    def test_receipt_binds_evidence_models_request_ids_scores_and_state(self):
        issued = self.issue()
        payload, claims = self.trust.verify_archive(self.archive_request(issued), max_bytes=500_000)

        self.assertEqual(payload["case"]["id"], "xiami")
        self.assertEqual(claims["evidenceDigest"], issued["evidenceDigest"])
        self.assertEqual(claims["modelSet"], ["model-a", "model-b"])
        self.assertEqual([request["requestId"] for request in claims["requests"]], ["request-a", "request-b"])
        self.assertEqual(claims["truthScore"], 87)
        self.assertEqual(claims["verificationState"], "live_consensus")

    def test_live_receipt_issuance_requires_two_unique_real_request_ids(self):
        verification = copy.deepcopy(self.verification)
        verification["requests"][1]["requestId"] = "request-a"
        evidence = self.trust.prepare_evidence("xiami", self.evidence)

        with self.assertRaisesRegex(ReceiptError, "Request IDs"):
            self.trust.issue(verification, evidence)

    def test_archive_verification_rejects_signed_duplicate_request_id_claims(self):
        issued = self.issue()
        request = self.archive_request(issued)
        claims = self.trust._decode(request["verificationReceipt"])
        claims["requests"][1]["requestId"] = "request-a"
        request["verificationReceipt"] = self.trust._encode(claims)

        with self.assertRaisesRegex(ReceiptError, "request claims"):
            self.trust.verify_archive(request, max_bytes=500_000)

    def test_forged_expired_and_mismatched_receipts_are_rejected(self):
        issued = self.issue()
        valid_request = self.archive_request(issued)
        forged = copy.deepcopy(valid_request)
        token = forged["verificationReceipt"]
        payload_segment, signature_segment = token.split(".", 1)
        forged_signature = ("A" if signature_segment[0] != "A" else "B") + signature_segment[1:]
        forged["verificationReceipt"] = f"{payload_segment}.{forged_signature}"
        with self.assertRaisesRegex(ReceiptError, "unrecognized"):
            self.trust.verify_archive(forged, max_bytes=500_000)

        mismatches = []
        wrong_case = copy.deepcopy(valid_request)
        wrong_case["payload"]["case"]["id"] = "renren"
        mismatches.append(wrong_case)
        wrong_digest = copy.deepcopy(valid_request)
        wrong_digest["payload"]["evidenceDigest"] = "sha256:forged"
        mismatches.append(wrong_digest)
        wrong_version = copy.deepcopy(valid_request)
        wrong_version["payload"]["evidencePackage"]["version"] = "2026-07-15.2"
        mismatches.append(wrong_version)
        wrong_model = copy.deepcopy(valid_request)
        wrong_model["payload"]["verification"]["requests"][1]["model"] = "model-c"
        mismatches.append(wrong_model)

        for request in mismatches:
            with self.subTest(request=request):
                with self.assertRaisesRegex(ReceiptError, "mismatch"):
                    self.trust.verify_archive(request, max_bytes=500_000)

        malformed_record = copy.deepcopy(valid_request)
        malformed_record["payload"]["verification"]["requests"] = None
        with self.assertRaisesRegex(ReceiptError, "record"):
            self.trust.verify_archive(malformed_record, max_bytes=500_000)

        self.clock[0] = 1060
        with self.assertRaisesRegex(ReceiptError, "expired"):
            self.trust.verify_archive(valid_request, max_bytes=500_000)


if __name__ == "__main__":
    unittest.main()
