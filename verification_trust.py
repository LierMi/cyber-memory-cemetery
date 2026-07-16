import base64
import copy
import hashlib
import hmac
import json
import math
import secrets
import time

from cemetery_core import archive_eligibility, content_hash


EVIDENCE_SCHEMA = "cyber-memory-cemetery/evidence/v1"
RECEIPT_SCHEMA = "cyber-memory-cemetery/verification-receipt/v1"
VERIFICATION_STATES = {"live_consensus", "cached_live", "partial", "demo_fallback"}
MAX_EVIDENCE_CLAIMS = 12


class ReceiptError(ValueError):
    pass


def _bounded_text(value, limit):
    if not isinstance(value, str):
        return ""
    value = value.strip()
    if not value or len(value) > limit:
        return ""
    if any(ord(character) < 32 or ord(character) == 127 for character in value):
        return ""
    return value


def _finite_score(value):
    if isinstance(value, bool):
        return None
    try:
        score = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(score) or score < 0 or score > 100:
        return None
    return round(score)


def _string_list(value, item_limit=12, text_limit=500):
    if not isinstance(value, list):
        return []
    result = []
    for item in value[:item_limit]:
        text = _bounded_text(item, text_limit)
        if text:
            result.append(text)
    return result


def _real_request_id(value):
    return bool(
        isinstance(value, str)
        and value.strip()
        and value != "gonka_req_unknown"
        and not value.startswith("mock_")
    )


def _canonical_request(request):
    if not isinstance(request, dict):
        return {}
    score = _finite_score(request.get("truthScore"))
    return {
        "role": _bounded_text(request.get("role"), 80),
        "model": _bounded_text(request.get("model"), 200),
        "requestId": _bounded_text(request.get("requestId"), 300),
        "requestedAt": _bounded_text(request.get("requestedAt"), 80),
        "truthScore": score,
        "summary": _bounded_text(request.get("summary"), 1000),
        "verifiedFacts": _string_list(request.get("verifiedFacts")),
        "uncertainClaims": _string_list(request.get("uncertainClaims")),
        "riskFlags": _string_list(request.get("riskFlags")),
        "fallback": bool(request.get("fallback")),
    }


def _successful_request(request):
    return bool(
        request
        and not request.get("fallback")
        and request.get("model")
        and _real_request_id(request.get("requestId"))
        and request.get("truthScore") is not None
    )


class VerificationTrust:
    def __init__(self, secret=None, receipt_ttl_seconds=900, now=None):
        self._secret = secret or secrets.token_bytes(32)
        if not isinstance(self._secret, bytes) or len(self._secret) < 16:
            raise ValueError("Receipt secret must contain at least 16 bytes")
        self.receipt_ttl_seconds = max(1, int(receipt_ttl_seconds))
        self._now = now or time.time

    def prepare_evidence(self, case_id, evidence_package):
        case_id = _bounded_text(case_id, 120) or "unknown"
        source = evidence_package if isinstance(evidence_package, dict) else {}
        version = _bounded_text(source.get("version"), 80) or "unversioned"
        curated_at = _bounded_text(source.get("curatedAt"), 80)
        privacy_boundary = _bounded_text(source.get("privacyBoundary"), 500)
        completeness = _finite_score(source.get("evidenceCompleteness"))

        claims = []
        raw_claims = source.get("claims") if isinstance(source.get("claims"), list) else []
        for item in raw_claims[:MAX_EVIDENCE_CLAIMS]:
            if not isinstance(item, dict) or item.get("publicArchiveAllowed") is not True:
                continue
            claim = _bounded_text(item.get("claim"), 500)
            source_title = _bounded_text(item.get("sourceTitle"), 200)
            source_url = _bounded_text(item.get("sourceUrl"), 2048)
            if not claim or not source_title or not source_url.startswith("https://"):
                continue
            confidence = item.get("confidence")
            if confidence not in {"primary", "secondary", "context"}:
                confidence = "context"
            claims.append(
                {
                    "id": _bounded_text(item.get("id"), 120),
                    "claim": claim,
                    "type": _bounded_text(item.get("type"), 80),
                    "sourceTitle": source_title,
                    "sourceUrl": source_url,
                    "sourceDate": _bounded_text(item.get("sourceDate"), 80),
                    "confidence": confidence,
                    "supports": _string_list(item.get("supports"), item_limit=20, text_limit=120),
                    "publicArchiveAllowed": True,
                    "rightsNote": _bounded_text(item.get("rightsNote"), 500),
                }
            )

        package = {
            "schema": EVIDENCE_SCHEMA,
            "caseId": case_id,
            "version": version,
            "curatedAt": curated_at,
            "evidenceCompleteness": completeness if completeness is not None else 0,
            "privacyBoundary": privacy_boundary,
            "claims": claims,
        }
        return {"package": package, "digest": content_hash(package)}

    def issue(self, verification, evidence, max_expires_at=None):
        package = copy.deepcopy(evidence.get("package"))
        digest = evidence.get("digest")
        if not isinstance(package, dict) or digest != content_hash(package):
            raise ReceiptError("Evidence binding mismatch")

        record = self._verification_record(verification, package, digest)
        successful = [request for request in record["requests"] if _successful_request(request)]
        all_models = sorted({request.get("model") for request in record["requests"] if request.get("model")})
        successful_models = sorted({request["model"] for request in successful})
        state = record["verificationState"]
        if state in {"live_consensus", "cached_live"}:
            if len(successful) < 2 or len(successful_models) < 2:
                raise ReceiptError("Live verification requires two distinct successful models")
        elif state == "partial":
            if len(successful) != 1:
                raise ReceiptError("Partial verification requires one successful model")
        elif successful:
            raise ReceiptError("Demo fallback cannot contain successful live requests")

        issued_at = int(self._now())
        expires_at = issued_at + self.receipt_ttl_seconds
        if max_expires_at is not None:
            expires_at = min(expires_at, int(max_expires_at))
        if expires_at <= issued_at:
            raise ReceiptError("Verification receipt expired")

        claims = {
            "schema": RECEIPT_SCHEMA,
            "receiptId": secrets.token_hex(16),
            "caseId": record["caseId"],
            "evidenceSchema": package["schema"],
            "evidenceVersion": package["version"],
            "evidenceDigest": digest,
            "modelSet": successful_models if successful_models else all_models,
            "requests": [
                {
                    "model": request["model"],
                    "requestId": request["requestId"],
                    "truthScore": request["truthScore"],
                    "fallback": request["fallback"],
                }
                for request in record["requests"]
            ],
            "truthScore": record["truthScore"],
            "verificationState": state,
            "verifiedAt": record["verifiedAt"],
            "verificationDigest": content_hash(record),
            "issuedAt": issued_at,
            "expiresAt": expires_at,
        }
        return {
            "evidencePackage": package,
            "evidenceDigest": digest,
            "verificationRecord": record,
            "verificationReceipt": self._encode(claims),
            "verificationReceiptExpiresAt": expires_at,
        }

    def verify_archive(self, request_payload, max_bytes):
        try:
            request_size = len(
                json.dumps(
                    request_payload,
                    ensure_ascii=False,
                    sort_keys=True,
                    separators=(",", ":"),
                ).encode("utf-8")
            )
        except (TypeError, ValueError) as error:
            raise ReceiptError("Archive request is malformed") from error
        if request_size > max_bytes:
            raise ReceiptError("Archive request is too large")
        if not isinstance(request_payload, dict):
            raise ReceiptError("Archive request is malformed")

        token = request_payload.get("verificationReceipt")
        if not isinstance(token, str) or not token:
            raise ReceiptError("Verification receipt is required")
        claims = self._decode(token)
        if int(self._now()) >= claims["expiresAt"]:
            raise ReceiptError("Verification receipt expired")

        payload = request_payload.get("payload")
        if not isinstance(payload, dict) or not payload:
            raise ReceiptError("Archive payload is malformed")
        case = payload.get("case")
        if not isinstance(case, dict) or not _bounded_text(case.get("id"), 120):
            raise ReceiptError("Archive case is malformed")
        if not _bounded_text(payload.get("schema"), 120) or not _bounded_text(
            payload.get("contentCreatedAt"), 80
        ):
            raise ReceiptError("Archive payload is malformed")
        if case["id"] != claims["caseId"]:
            raise ReceiptError("Receipt case mismatch")

        evidence_source = payload.get("evidencePackage")
        evidence = self.prepare_evidence(case["id"], evidence_source)
        if evidence_source != evidence["package"]:
            raise ReceiptError("Evidence package mismatch")
        if (
            payload.get("evidenceDigest") != evidence["digest"]
            or evidence["digest"] != claims["evidenceDigest"]
            or evidence["package"]["schema"] != claims["evidenceSchema"]
            or evidence["package"]["version"] != claims["evidenceVersion"]
        ):
            raise ReceiptError("Evidence digest or version mismatch")

        supplied_record = payload.get("verification")
        if not isinstance(supplied_record, dict):
            raise ReceiptError("Verification record mismatch")
        expected_record = self._verification_record(
            supplied_record, evidence["package"], evidence["digest"]
        )
        if supplied_record != expected_record or content_hash(expected_record) != claims["verificationDigest"]:
            raise ReceiptError("Verification record mismatch")
        if (
            expected_record["verificationState"] != claims["verificationState"]
            or expected_record["truthScore"] != claims["truthScore"]
        ):
            raise ReceiptError("Verification state or score mismatch")

        successful_models = sorted(
            {
                request["model"]
                for request in expected_record["requests"]
                if _successful_request(request)
            }
        )
        expected_models = successful_models or sorted(
            {
                request["model"]
                for request in expected_record["requests"]
                if request.get("model")
            }
        )
        if expected_models != claims["modelSet"]:
            raise ReceiptError("Verification model set mismatch")
        return copy.deepcopy(payload), claims

    def _verification_record(self, verification, evidence_package, evidence_digest):
        if not isinstance(verification, dict):
            raise ReceiptError("Verification result is malformed")
        state = verification.get("verificationState")
        if state not in VERIFICATION_STATES:
            raise ReceiptError("Verification state is malformed")
        truth_score = _finite_score(verification.get("truthScore"))
        if truth_score is None:
            raise ReceiptError("Verification Truth Score is malformed")
        verified_at = _bounded_text(verification.get("verifiedAt"), 80)
        if not verified_at:
            raise ReceiptError("Verification time is malformed")
        raw_requests = verification.get("requests")
        if not isinstance(raw_requests, list):
            raise ReceiptError("Verification record is malformed")
        requests = [
            canonical
            for canonical in (_canonical_request(request) for request in raw_requests)
            if canonical
        ]
        record = {
            "source": _bounded_text(verification.get("source"), 80),
            "caseId": evidence_package["caseId"],
            "verifiedAt": verified_at,
            "verificationState": state,
            "truthScore": truth_score,
            "scoreSpread": _finite_score(verification.get("scoreSpread")),
            "consensusConfidence": _finite_score(verification.get("consensusConfidence")) or 0,
            "sealEligibility": archive_eligibility(state),
            "cacheStatus": _bounded_text(verification.get("cacheStatus"), 120),
            "requests": requests,
            "notes": _string_list(verification.get("notes"), item_limit=30, text_limit=1000),
            "evidenceSchema": evidence_package["schema"],
            "evidenceVersion": evidence_package["version"],
            "evidenceDigest": evidence_digest,
        }
        cache_key = _bounded_text(verification.get("cacheKey"), 128)
        if cache_key:
            record["cacheKey"] = cache_key
        cache_age = verification.get("cacheAgeSeconds")
        if isinstance(cache_age, int) and cache_age >= 0:
            record["cacheAgeSeconds"] = cache_age
        return record

    def _encode(self, claims):
        payload = json.dumps(
            claims,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        signature = hmac.new(self._secret, payload, hashlib.sha256).digest()
        return f"{self._b64encode(payload)}.{self._b64encode(signature)}"

    def _decode(self, token):
        try:
            payload_segment, signature_segment = token.split(".", 1)
            payload = self._b64decode(payload_segment)
            supplied_signature = self._b64decode(signature_segment)
        except (TypeError, ValueError) as error:
            raise ReceiptError("Verification receipt is malformed") from error
        expected_signature = hmac.new(self._secret, payload, hashlib.sha256).digest()
        if not hmac.compare_digest(supplied_signature, expected_signature):
            raise ReceiptError("Verification receipt is unrecognized")
        try:
            claims = json.loads(payload.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ReceiptError("Verification receipt is malformed") from error
        required = {
            "schema",
            "receiptId",
            "caseId",
            "evidenceSchema",
            "evidenceVersion",
            "evidenceDigest",
            "modelSet",
            "requests",
            "truthScore",
            "verificationState",
            "verifiedAt",
            "verificationDigest",
            "issuedAt",
            "expiresAt",
        }
        if not isinstance(claims, dict) or not required.issubset(claims):
            raise ReceiptError("Verification receipt is malformed")
        if claims.get("schema") != RECEIPT_SCHEMA:
            raise ReceiptError("Verification receipt is unrecognized")
        if not isinstance(claims.get("expiresAt"), int):
            raise ReceiptError("Verification receipt is malformed")
        return claims

    @staticmethod
    def _b64encode(value):
        return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")

    @classmethod
    def _b64decode(cls, value):
        if not isinstance(value, str) or not value:
            raise ValueError("empty base64")
        decoded = base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
        if cls._b64encode(decoded) != value:
            raise ValueError("non-canonical base64")
        return decoded
