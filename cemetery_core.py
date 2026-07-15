import hashlib
import json
import math


def normalize_score(value, fallback):
    try:
        score = float(value)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(score):
        return fallback
    if 0 < score <= 10:
        score *= 10
    return max(0, min(round(score), 100))


def aggregate_consensus(requests, evidence_completeness):
    scores = [
        normalize_score(request.get("truthScore"), 0)
        for request in requests
        if not request.get("fallback") and request.get("truthScore") is not None
    ]
    if len(scores) >= 2:
        spread = abs(scores[0] - scores[1])
        state = "live_consensus"
        confidence = round((100 - spread) * 0.7 + normalize_score(evidence_completeness, 0) * 0.3)
    elif len(scores) == 1:
        spread = None
        state = "partial"
        confidence = round(normalize_score(evidence_completeness, 0) * 0.45)
    else:
        spread = None
        state = "demo_fallback"
        confidence = 0
    return {
        "truthScore": round(sum(scores) / len(scores)) if scores else 0,
        "scoreSpread": spread,
        "consensusConfidence": max(0, min(confidence, 100)),
        "verificationState": state,
        "sealEligibility": archive_eligibility(state),
    }


def archive_eligibility(state):
    return "verified" if state in {"live_consensus", "cached_live"} else "draft"


def cache_key(case_id, evidence_version, models):
    seed = json.dumps(
        {"caseId": case_id, "evidenceVersion": evidence_version, "models": sorted(models)},
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()


def canonical_json(payload):
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def content_hash(payload):
    return "sha256:" + hashlib.sha256(canonical_json(payload).encode("utf-8")).hexdigest()
