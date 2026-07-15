# Gonka Truth Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Cyber Memory Cemetery into a Gonka-first, verifiable archive for Xiami Music with transparent consensus states, deterministic sealing, memorial credentials, and a reliable one-click presentation flow.

**Architecture:** Keep the existing static HTML/CSS/JavaScript frontend and Python `ThreadingHTTPServer`. Extract deterministic scoring and archive rules into `cemetery_core.py`, extract browser-safe state and credential rules into `core.js`, and keep network orchestration in `server.py` and `app.js`. Curated evidence is versioned JSON; live Wayback and Gonka results enrich it without becoming single points of failure.

**Tech Stack:** Python 3 standard library, Node.js built-in test runner, vanilla HTML/CSS/JavaScript, Gonka Router REST API, Wayback CDX API, optional Pinata IPFS API.

## Global Constraints

- Keep the existing application framework-free at runtime.
- The complete case is Xiami Music; Renren and other cases remain browseable exhibits.
- Do not add wallet connection, Kite, real payment, real NFT/SBT minting, or video recording.
- Never present mock, cached, partial, or local results as live verified results.
- Do not archive full copyrighted audio, private playlists, private account data, or full user comments.
- Preserve the Digital Pompeii dark museum visual language.
- The app continues to run at `http://127.0.0.1:5177/`.

---

## File Map

- Create `cemetery_core.py`: deterministic score normalization, consensus aggregation, archive eligibility, cache key, and canonical hashing.
- Create `core.js`: browser and Node-compatible verification labels, memorial credential generation, readiness rules, and demo state transitions.
- Create `data/xiami-evidence.json`: versioned public evidence package for Xiami Music.
- Create `tests/test_cemetery_core.py`: Python unit tests for pure server logic.
- Create `tests/test_server.py`: server orchestration, cache, and sealing tests with network calls mocked.
- Create `tests/core.test.cjs`: Node tests for frontend core logic.
- Create `tests/browser-smoke.mjs`: Playwright smoke path for desktop and mobile.
- Create `package.json`: test scripts and Playwright development dependency only.
- Create `playwright.config.mjs`: fixed desktop and mobile Chromium projects and local server lifecycle.
- Create `render.yaml`: deployment-ready Python web service definition.
- Create `docs/SUBMISSION_CHECKLIST.md`: Gonka track completion and truthfulness checklist.
- Modify `server.py`: use core logic, normalize model responses, cache live consensus, expose status, and produce deterministic archive receipts.
- Modify `index.html`: load `core.js`, add verification state and one-click demo controls, and remove Kite/payment copy.
- Modify `app.js`: load curated evidence, render consensus, replace NFT claims with memorial credentials, remove Kite logic, and run the demo state machine.
- Modify `styles.css`: style evidence confidence, consensus spread, verification states, credentials, and demo progress.
- Modify `.gitignore`: ignore generated cache and browser artifacts.
- Modify `README.md`: document exact states, tests, Pinata configuration, and presentation flow.

---

### Task 1: Deterministic Python Verification Core

**Files:**
- Create: `cemetery_core.py`
- Create: `tests/test_cemetery_core.py`

**Interfaces:**
- Consumes: normalized request dictionaries with `truthScore` and `fallback`.
- Produces: `normalize_score(value, fallback)`, `aggregate_consensus(requests, evidence_completeness)`, `archive_eligibility(state)`, `cache_key(case_id, evidence_version, models)`, and `content_hash(payload)`.

- [ ] **Step 1: Write failing core tests**

```python
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
```

- [ ] **Step 2: Run the tests and confirm the missing module failure**

Run: `python3 -m unittest tests/test_cemetery_core.py -v`

Expected: FAIL with `ModuleNotFoundError: No module named 'cemetery_core'`.

- [ ] **Step 3: Implement the pure core**

```python
import hashlib
import json


def normalize_score(value, fallback):
    try:
        score = float(value)
    except (TypeError, ValueError):
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
```

- [ ] **Step 4: Run the core tests**

Run: `python3 -m unittest tests/test_cemetery_core.py -v`

Expected: 4 tests pass.

- [ ] **Step 5: Commit Task 1**

```bash
git add cemetery_core.py tests/test_cemetery_core.py
git commit -m "feat: add deterministic verification core"
```

---

### Task 2: Browser-Safe Core and State Machine

**Files:**
- Create: `core.js`
- Create: `tests/core.test.cjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: verification result, archive receipt, case metadata, and demo events.
- Produces: `CemeteryCore.verificationPresentation`, `CemeteryCore.createCredential`, `CemeteryCore.archiveReadiness`, and `CemeteryCore.nextDemoState`.

- [ ] **Step 1: Write failing Node tests**

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../core.js");

test("labels cached live results honestly", () => {
  const result = core.verificationPresentation({ verificationState: "cached_live" });
  assert.equal(result.label, "CACHED LIVE");
  assert.equal(result.verified, true);
});

test("credential is derived from the archive receipt", () => {
  const credential = core.createCredential(
    { id: "xiami", name: "虾米音乐", image: "./assets/case-xiami.png" },
    {
      contentHash: "sha256:abc",
      archiveId: "ipfs://cid",
      contentCreatedAt: "2026-07-15T12:00:00Z",
      verificationState: "live_consensus",
      truthScore: 89,
      requestIds: ["request-a", "request-b"],
    },
  );
  assert.equal(credential.id, "witness-sha256abc");
  assert.equal(credential.status, "ready_for_onchain_claim");
  assert.equal(credential.issuedAt, "2026-07-15T12:00:00Z");
});

test("demo state stops on failure and resumes on retry", () => {
  const failed = core.nextDemoState({ step: 2, status: "running" }, "failure");
  assert.deepEqual(failed, { step: 2, status: "failed" });
  const retried = core.nextDemoState(failed, "retry");
  assert.deepEqual(retried, { step: 2, status: "running" });
});
```

- [ ] **Step 2: Run tests and confirm the missing module failure**

Run: `node --test tests/core.test.cjs`

Expected: FAIL because `core.js` does not exist.

- [ ] **Step 3: Implement `core.js` as a UMD module**

```javascript
(function expose(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CemeteryCore = api;
})(typeof window !== "undefined" ? window : globalThis, function buildCore() {
  const states = {
    live_consensus: { label: "LIVE CONSENSUS", verified: true, tone: "verified" },
    cached_live: { label: "CACHED LIVE", verified: true, tone: "cached" },
    partial: { label: "PARTIAL", verified: false, tone: "warning" },
    demo_fallback: { label: "DEMO FALLBACK", verified: false, tone: "mock" },
  };

  function verificationPresentation(verification) {
    return states[verification?.verificationState] || states.demo_fallback;
  }

  function createCredential(item, seal) {
    const compact = String(seal.contentHash).replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    return {
      schema: "cyber-memory-cemetery/credential/v1",
      id: `witness-${compact}`,
      name: `Cyber Memory Witness - ${item.name}`,
      caseId: item.id,
      image: item.image,
      status: "ready_for_onchain_claim",
      truthScore: seal.truthScore,
      verificationState: seal.verificationState,
      contentHash: seal.contentHash,
      archiveId: seal.archiveId,
      gonkaRequestIds: seal.requestIds || [],
      issuedAt: seal.contentCreatedAt,
    };
  }

  function archiveReadiness({ evidenceCount, requestCount, archiveSeal, credential }) {
    return [
      { label: "公开证据", ready: evidenceCount > 0 },
      { label: "模型会诊", ready: requestCount >= 2 },
      { label: "永久封存", ready: Boolean(archiveSeal) },
      { label: "纪念凭证", ready: Boolean(credential) },
    ];
  }

  function nextDemoState(state, event) {
    if (event === "failure") return { ...state, status: "failed" };
    if (event === "retry") return { ...state, status: "running" };
    if (event === "complete") return { step: state.step + 1, status: "running" };
    if (event === "finish") return { ...state, status: "complete" };
    return state;
  }

  return { verificationPresentation, createCredential, archiveReadiness, nextDemoState };
});
```

- [ ] **Step 4: Load the core before the application**

Add before `app.js` in `index.html`:

```html
<script src="./core.js" defer></script>
<script src="./app.js" defer></script>
```

- [ ] **Step 5: Run Node tests and syntax checks**

Run: `node --test tests/core.test.cjs`

Expected: 3 tests pass.

Run: `node --check core.js`

Expected: exit 0.

Run: `node --check app.js`

Expected: exit 0.

- [ ] **Step 6: Commit Task 2**

```bash
git add core.js tests/core.test.cjs index.html
git commit -m "feat: add frontend verification core"
```

---

### Task 3: Versioned Xiami Evidence Package

**Files:**
- Create: `data/xiami-evidence.json`
- Modify: `app.js`
- Modify: `server.py`
- Test: `tests/test_server.py`

**Interfaces:**
- Consumes: `GET /data/xiami-evidence.json` and the existing Xiami case.
- Produces: `loadEvidencePackage(caseId)` in the browser and an `evidencePackage` field in `/api/gonka/verify` requests.

- [ ] **Step 1: Write a failing evidence schema test**

```python
import json
import unittest
from pathlib import Path


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
```

- [ ] **Step 2: Run the evidence test and confirm it fails**

Run: `python3 -m unittest tests/test_server.py -v`

Expected: FAIL because `data/xiami-evidence.json` does not exist.

- [ ] **Step 3: Create the evidence package**

Create a JSON document with this exact top-level shape and at least six individually sourced claims:

```json
{
  "schema": "cyber-memory-cemetery/evidence/v1",
  "caseId": "xiami",
  "version": "2026-07-15.1",
  "curatedAt": "2026-07-15T12:00:00Z",
  "evidenceCompleteness": 92,
  "privacyBoundary": "Only public metadata and short factual summaries are archived.",
  "claims": [
    {
      "id": "xiami-founded",
      "claim": "虾米网于 2007 年创立。",
      "type": "timeline",
      "sourceTitle": "虾米音乐公开历史资料",
      "sourceUrl": "https://zh.wikipedia.org/wiki/%E8%99%BE%E7%B1%B3%E9%9F%B3%E4%B9%90",
      "sourceDate": "2007",
      "confidence": "secondary",
      "supports": ["lifespan", "timeline"],
      "publicArchiveAllowed": true,
      "rightsNote": "Archive the factual summary and URL only."
    }
  ]
}
```

Before finalizing the file, verify the shutdown dates and acquisition timeline against at least two accessible public sources. Store only summaries and links.

- [ ] **Step 4: Load and send evidence from the frontend**

Add to `app.js`:

```javascript
const evidencePackages = new Map();

async function loadEvidencePackage(caseId) {
  if (evidencePackages.has(caseId)) return evidencePackages.get(caseId);
  if (caseId !== "xiami") return null;
  const response = await fetch("./data/xiami-evidence.json");
  if (!response.ok) throw new Error(`Evidence HTTP ${response.status}`);
  const payload = await response.json();
  evidencePackages.set(caseId, payload);
  return payload;
}
```

Pass `evidencePackage` alongside `case` and `archive` in `verifyWithGonka`.

- [ ] **Step 5: Include evidence claims in server prompts**

Add a formatter in `server.py`:

```python
def format_evidence_package(evidence_package):
    claims = evidence_package.get("claims") or []
    return "\n".join(
        f"- [{item.get('confidence')}] {item.get('claim')} 来源:{item.get('sourceUrl')}"
        for item in claims
    ) or "- 无独立策展证据包"
```

Append the formatted evidence to both council prompts.

- [ ] **Step 6: Run evidence and syntax tests**

Run: `python3 -m unittest tests/test_server.py -v`

Expected: evidence schema test passes.

Run: `node --check app.js`

Expected: exit 0.

Run: `python3 -m py_compile server.py`

Expected: exit 0.

- [ ] **Step 7: Commit Task 3**

```bash
git add data/xiami-evidence.json app.js server.py tests/test_server.py
git commit -m "feat: add curated Xiami evidence package"
```

---

### Task 4: Gonka Normalization, Consensus States, and Live Cache

**Files:**
- Create: `verification_cache.py`
- Modify: `server.py`
- Modify: `.gitignore`
- Test: `tests/test_server.py`

**Interfaces:**
- Consumes: two Gonka completion responses and evidence package metadata.
- Produces: normalized requests, `verificationState`, `scoreSpread`, `consensusConfidence`, `sealEligibility`, `cacheStatus`, and original Request IDs.

- [ ] **Step 1: Write failing cache and state tests**

```python
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import server
from verification_cache import VerificationCache


class VerificationCacheTests(unittest.TestCase):
    def test_round_trip_preserves_request_ids(self):
        with tempfile.TemporaryDirectory() as directory:
            cache = VerificationCache(Path(directory))
            value = {"verificationState": "live_consensus", "requests": [{"requestId": "gonka-1"}]}
            cache.write("abc", value)
            self.assertEqual(cache.read("abc")["requests"][0]["requestId"], "gonka-1")

    def test_two_failed_models_use_real_cache(self):
        cached = {
            "source": "gonka",
            "verificationState": "live_consensus",
            "requests": [{"requestId": "gonka-a"}, {"requestId": "gonka-b"}],
        }
        with patch.object(server, "GONKA_API_KEY", "test-key"):
            with patch.object(server, "run_live_council", side_effect=RuntimeError("offline")):
                with patch.object(server.VERIFICATION_CACHE, "latest_for_case", return_value=cached):
                    result = server.run_gonka_verification({"case": {"id": "xiami"}})
        self.assertEqual(result["verificationState"], "cached_live")
        self.assertEqual(result["requests"][0]["requestId"], "gonka-a")
```

- [ ] **Step 2: Run tests and confirm missing cache behavior**

Run: `python3 -m unittest tests/test_server.py -v`

Expected: FAIL because `verification_cache.py` and `run_live_council` do not exist.

- [ ] **Step 3: Implement atomic JSON cache**

```python
import json
import os
from pathlib import Path


class VerificationCache:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)

    def read(self, key):
        path = self.directory / f"{key}.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def write(self, key, value):
        path = self.directory / f"{key}.json"
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temporary, path)

    def latest_for_case(self, case_id):
        candidates = []
        for path in self.directory.glob("*.json"):
            payload = json.loads(path.read_text(encoding="utf-8"))
            if payload.get("caseId") == case_id and payload.get("verificationState") == "live_consensus":
                candidates.append((payload.get("verifiedAt", ""), payload))
        return max(candidates, default=(None, None))[1]
```

- [ ] **Step 4: Refactor server council orchestration**

In `server.py`, add `VERIFICATION_CACHE = VerificationCache("tmp/cache")`, make `run_live_council(payload)` responsible only for network calls, and make `run_gonka_verification(payload)` apply these rules:

```python
def run_gonka_verification(payload):
    if not GONKA_API_KEY:
        return mock_verification(payload)
    try:
        result = run_live_council(payload)
    except Exception:
        cached = VERIFICATION_CACHE.latest_for_case((payload.get("case") or {}).get("id"))
        if cached:
            restored = dict(cached)
            restored["verificationState"] = "cached_live"
            restored["sealEligibility"] = "verified"
            restored["cacheStatus"] = "restored_after_live_failure"
            return restored
        return mock_verification(payload, reason="Gonka unavailable and no live cache exists.")
    if result["verificationState"] == "live_consensus":
        VERIFICATION_CACHE.write(result["cacheKey"], result)
    return result
```

Ensure each normalized request includes `requestedAt`, `truthScore`, arrays for facts and risks, and `fallback`.

- [ ] **Step 5: Ignore generated cache**

Append to `.gitignore`:

```gitignore
tmp/cache/
test-results/
playwright-report/
```

- [ ] **Step 6: Run all server tests**

Run: `python3 -m unittest tests/test_cemetery_core.py tests/test_server.py -v`

Expected: all tests pass, including preservation of original Request IDs.

- [ ] **Step 7: Commit Task 4**

```bash
git add verification_cache.py server.py .gitignore tests/test_server.py
git commit -m "feat: add honest Gonka consensus caching"
```

---

### Task 5: Deterministic Archive and IPFS Status

**Files:**
- Modify: `cemetery_core.py`
- Modify: `server.py`
- Modify: `app.js`
- Test: `tests/test_cemetery_core.py`
- Test: `tests/test_server.py`

**Interfaces:**
- Consumes: frozen archive content with `contentCreatedAt` and verification state.
- Produces: stable `contentHash`, `provider`, `status`, `archiveId`, `gatewayUrl`, `sealEligibility`, and retryable local receipt.

- [ ] **Step 1: Write failing deterministic seal tests**

```python
class ArchiveSealTests(unittest.TestCase):
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
```

- [ ] **Step 2: Run the archive tests and confirm current contract failure**

Run: `python3 -m unittest tests/test_server.py -v`

Expected: FAIL because the current response does not expose `sealEligibility` and uses a misleading demo archive ID.

- [ ] **Step 3: Make local and IPFS receipts explicit**

Update `seal_archive` so the content hash is computed only from the frozen payload. Use:

```python
verification_state = (payload.get("verification") or {}).get("verificationState", "demo_fallback")
eligibility = archive_eligibility(verification_state)
local_id = f"local://sha256/{content_hash_value.split(':', 1)[1]}"
```

Return `local_id` when Pinata is not configured or fails. Preserve the same `contentHash` across retries, and include `contentCreatedAt`, `verificationState`, `truthScore`, and `requestIds` in the browser response.

- [ ] **Step 4: Expose service status**

Override `Handler.do_GET` for `/api/status` and otherwise delegate to `super().do_GET()`:

```python
def do_GET(self):
    if self.path == "/api/status":
        self.send_json(200, {
            "gonka": "live" if GONKA_API_KEY else "demo_fallback",
            "ipfs": "configured" if PINATA_JWT else "local_only",
            "cache": "enabled",
        })
        return
    super().do_GET()
```

- [ ] **Step 5: Render honest provider copy and retry action**

In `app.js`, map:

```javascript
const archiveProviderCopy = {
  "pinata-ipfs": "IPFS 永久档案",
  "local-sealed": "本地封存，不具备永久存储证明",
};
```

Use the same `sealCurrentArchive()` action for “重新上传 IPFS”.

- [ ] **Step 6: Run archive, API, and syntax tests**

Run: `python3 -m unittest tests/test_cemetery_core.py tests/test_server.py -v`

Expected: all tests pass.

Run: `python3 -m py_compile server.py cemetery_core.py`

Expected: exit 0.

Run: `node --check app.js`

Expected: exit 0.

- [ ] **Step 7: Commit Task 5**

```bash
git add cemetery_core.py server.py app.js tests/test_cemetery_core.py tests/test_server.py
git commit -m "feat: make archive sealing deterministic"
```

---

### Task 6: Replace Kite and NFT Claims with Evidence and Memorial Credentials

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Test: `tests/core.test.cjs`

**Interfaces:**
- Consumes: normalized verification, evidence package, archive receipt, and `CemeteryCore.createCredential`.
- Produces: evidence confidence view, model comparison, consensus meter, credential preview, credential JSON, and NFT-ready metadata JSON.

- [ ] **Step 1: Add frontend tests for honest readiness and metadata**

```javascript
test("readiness does not require Kite or a wallet", () => {
  const items = core.archiveReadiness({
    evidenceCount: 6,
    requestCount: 2,
    archiveSeal: { contentHash: "sha256:abc" },
    credential: { id: "witness-sha256abc" },
  });
  assert.deepEqual(items.map((item) => item.label), ["公开证据", "模型会诊", "永久封存", "纪念凭证"]);
  assert.equal(items.every((item) => item.ready), true);
});

test("NFT-ready metadata describes a future claim, not a mint", () => {
  const credential = {
    id: "witness-sha256abc",
    name: "Cyber Memory Witness - 虾米音乐",
    contentHash: "sha256:abc",
    archiveId: "ipfs://cid",
    truthScore: 89,
    verificationState: "live_consensus",
  };
  const metadata = core.createNftReadyMetadata(credential, { image: "./assets/case-xiami.png" });
  assert.equal(metadata.attributes.find((item) => item.trait_type === "Claim Status").value, "Pending on-chain claim");
  assert.equal(metadata.attributes.find((item) => item.trait_type === "Archive Hash").value, "sha256:abc");
});
```

- [ ] **Step 2: Run Node tests and confirm the current UI contract is incomplete**

Run: `node --test tests/core.test.cjs`

Expected: FAIL because `createNftReadyMetadata` does not exist.

- [ ] **Step 3: Remove payment and fake mint behavior**

Remove `burialPlans`, `state.invoices`, `renderCommercePanel`, `kiteLedgerFor`, `renderKiteLedgerPanel`, `renderBusinessFunnel`, `selectBurialPlan`, and payment fields in `buildArchivePayload`.

Remove the corresponding Kite ledger, payment funnel, pricing card, and USDC selectors from `styles.css`.

Rename these concepts:

```text
state.nftClaims -> state.credentials
renderNftPanel -> renderCredentialPanel
claimWitnessNft -> generateMemorialCredential
downloadNftMetadata -> downloadCredentialMetadata
```

No rendered text may say that a token was minted or a payment occurred.

- [ ] **Step 4: Render the model comparison and consensus meter**

Add a model card for each request with model name, role, score, Request ID, facts, uncertainties, and errors. Add a consensus summary using:

```javascript
function renderConsensusMeter(verification) {
  const presentation = CemeteryCore.verificationPresentation(verification);
  const confidence = Number(verification?.consensusConfidence || 0);
  return `<section class="consensus-meter ${presentation.tone}">
    <span>${escapeHtml(presentation.label)}</span>
    <strong>${confidence}% 共识置信度</strong>
    <div class="consensus-track"><i style="width:${confidence}%"></i></div>
    <p>模型评分差 ${escapeHtml(verification?.scoreSpread ?? "不可计算")} 分</p>
  </section>`;
}
```

- [ ] **Step 5: Render public evidence confidence**

For each claim, render the confidence label, factual summary, source title, source date, and external source link. Never render full copyrighted content.

- [ ] **Step 6: Generate and download memorial credentials**

Require an archive receipt before enabling the button. Generate the credential with `CemeteryCore.createCredential(item, archiveSeal)`, store it in `state.credentials[item.id]`, and provide separate downloads for credential JSON and NFT-ready metadata.

Add `createNftReadyMetadata(credential, item)` to `core.js`. It returns ERC-721 compatible metadata whose attributes include `Claim Status: Pending on-chain claim`, `Archive Hash`, `Verification State`, and `Truth Score`. It must not include a transaction hash, token ID, owner, or mint receipt.

- [ ] **Step 7: Update archive and roadmap copy**

Replace “链上安葬”, “Kite 账单”, “安葬套餐”, and “纪念 NFT 已认领” with “可验证封存”, “纪念凭证”, “IPFS 状态”, and “待链上认领”.

- [ ] **Step 8: Add responsive styles**

Style `.verification-state`, `.model-council-grid`, `.consensus-meter`, `.evidence-confidence-grid`, and `.credential-panel`. At widths below 720px, use one column and ensure long Request IDs wrap with `overflow-wrap: anywhere`.

- [ ] **Step 9: Run tests and text scans**

Run: `node --test tests/core.test.cjs`

Expected: Node tests pass.

Run: `node --check app.js`

Expected: exit 0.

Run: `rg -n "Kite|USDC|mint_receipt|认领见证 NFT|已 Mint" index.html app.js styles.css`

Expected: no matches.

- [ ] **Step 10: Commit Task 6**

```bash
git add index.html app.js styles.css core.js tests/core.test.cjs
git commit -m "feat: focus archive UI on Gonka proof"
```

---

### Task 7: One-Click Presentation Flow and Browser Smoke Test

**Files:**
- Create: `package.json`
- Create: `playwright.config.mjs`
- Create: `tests/browser-smoke.mjs`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing analysis, tab, seal, and credential actions.
- Produces: `runDemoFlow()`, retryable progress UI, and a reproducible Playwright smoke path.

- [ ] **Step 1: Add the browser test contract**

```javascript
import { test, expect } from "@playwright/test";

test("Xiami presentation reaches a sealed credential", async ({ page }) => {
  await page.goto("http://127.0.0.1:5177/");
  await page.getByRole("button", { name: "进入公墓" }).click();
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.locator("[data-verification-state]")).toContainText(/LIVE CONSENSUS|CACHED LIVE|DEMO FALLBACK/);
  await expect(page.locator("[data-archive-status]")).toBeVisible();
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toBeVisible();
});
```

- [ ] **Step 2: Add Playwright test configuration through `package.json`**

```json
{
  "name": "cyber-memory-cemetery",
  "private": true,
  "scripts": {
    "test:core": "node --test tests/core.test.cjs",
    "test:browser": "playwright test tests/browser-smoke.mjs --reporter=line"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.0"
  }
}
```

Create `playwright.config.mjs`:

```javascript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 90000,
  webServer: {
    command: "python3 server.py",
    url: "http://127.0.0.1:5177/api/status",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
  ],
});
```

- [ ] **Step 3: Install the test-only dependency and observe the browser test fail**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

Run: `npx playwright install chromium`

Expected: Chromium is available for Playwright.

Run: `npm run test:browser`

Expected: browser test fails because the one-click button and flow do not exist.

- [ ] **Step 4: Add the fixed one-click progress UI**

Add a button named `一键演示` and six progress items: select Xiami, load evidence, query Wayback, run council, seal archive, generate credential. Give the progress container `aria-live="polite"` and stable row heights.

- [ ] **Step 5: Implement the orchestrator**

```javascript
async function runDemoFlow() {
  if (state.running) return;
  state.demo = { step: 0, status: "running" };
  try {
    selectCase("xiami");
    advanceDemo();
    const evidencePackage = await withTimeout(loadEvidencePackage("xiami"), 5000);
    advanceDemo();
    const liveArchive = await withTimeout(lookupWayback("https://www.xiami.com"), 8000);
    advanceDemo();
    const verification = await withTimeout(verifyWithGonka(cases.find((item) => item.id === "xiami"), liveArchive, evidencePackage), 45000);
    advanceDemo();
    renderMemorial(cases.find((item) => item.id === "xiami"), liveArchive, verification);
    await sealCurrentArchive();
    advanceDemo();
    generateMemorialCredential();
    state.demo = CemeteryCore.nextDemoState(state.demo, "finish");
    renderDemoProgress();
  } catch (error) {
    state.demo = CemeteryCore.nextDemoState(state.demo, "failure");
    state.demo.error = error.message;
    renderDemoProgress();
  }
}
```

Implement `withTimeout`, `advanceDemo`, and retry from the failed step without rerunning successful work.

- [ ] **Step 6: Run desktop and mobile smoke tests**

Run: `npm run test:browser`

Expected: both `desktop-chromium` and `mobile-chromium` reach archive and credential controls with no failed assertions.

- [ ] **Step 7: Inspect desktop and mobile screenshots**

Use Playwright at 1366x900 and 390x844. Verify the page is nonblank, no text overlaps, Request IDs wrap, and the demo progress does not resize the layout.

- [ ] **Step 8: Commit Task 7**

```bash
git add package.json package-lock.json playwright.config.mjs tests/browser-smoke.mjs index.html app.js styles.css
git commit -m "feat: add reliable one-click presentation flow"
```

---

### Task 8: Documentation, Submission Check, and Full Verification

**Files:**
- Create: `docs/SUBMISSION_CHECKLIST.md`
- Create: `render.yaml`
- Modify: `README.md`
- Modify: `server.py`

**Interfaces:**
- Consumes: final commands, API states, and product behavior.
- Produces: reproducible setup, deployment-ready service configuration, submission checklist, and final verification evidence.

- [ ] **Step 1: Add deployment-ready host binding**

Change `main()` in `server.py` to keep local defaults while supporting a hosting platform:

```python
def main():
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "5177"))
    http_server = ThreadingHTTPServer((host, port), Handler)
    print(f"Cyber Memory Cemetery running at http://{host}:{port}")
    print(f"Gonka base URL: {GONKA_BASE_URL}")
    print("Gonka mode:", "live" if GONKA_API_KEY else "demo fallback")
    http_server.serve_forever()
```

Create `render.yaml`:

```yaml
services:
  - type: web
    name: cyber-memory-cemetery
    runtime: python
    plan: free
    buildCommand: python3 -m py_compile server.py cemetery_core.py verification_cache.py
    startCommand: python3 server.py
    healthCheckPath: /api/status
    envVars:
      - key: HOST
        value: 0.0.0.0
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: GONKA_API_KEY
        sync: false
      - key: GONKA_BASE_URL
        value: https://api.gonkascan.com/v1
      - key: GONKA_MODEL
        value: auto
      - key: PINATA_JWT
        sync: false
```

- [ ] **Step 2: Verify deployment binding locally**

Run: `HOST=127.0.0.1 PORT=5180 python3 server.py`

Expected: service listens on `http://127.0.0.1:5180`; terminate it after `curl http://127.0.0.1:5180/api/status` returns JSON.

- [ ] **Step 3: Write the submission checklist**

Include checked or unchecked entries for:

```markdown
# Gonka Submission Checklist

- [ ] Live Gonka Router call returns two different model names
- [ ] Both model Request IDs are visible
- [ ] Truth Score, score spread, and consensus confidence are visible
- [ ] Demo fallback is visibly labeled
- [ ] Public evidence links open
- [ ] Archive SHA-256 is visible
- [ ] IPFS CID is visible when Pinata is configured
- [ ] Local-only storage is visibly labeled when Pinata is absent
- [ ] Memorial credential downloads successfully
- [ ] GitHub README contains setup and verification commands
- [ ] Public deployment URL is recorded before submission
```

- [ ] **Step 4: Rewrite README around the Gonka-first flow**

Document `.env`, startup, verification states, test commands, evidence privacy boundary, Pinata behavior, one-click presentation, and excluded features. Remove Kite and real NFT mint claims.

- [ ] **Step 5: Run the full automated verification suite**

Run:

```bash
python3 -m unittest tests/test_cemetery_core.py tests/test_server.py -v
node --test tests/core.test.cjs
python3 -m py_compile server.py cemetery_core.py verification_cache.py
node --check core.js
node --check app.js
npm run test:browser
```

Expected: all unit tests pass, syntax checks exit 0, and the browser smoke test passes.

- [ ] **Step 6: Verify the running service**

Run: `curl -sS http://127.0.0.1:5177/api/status`

Expected: JSON contains `gonka`, `ipfs`, and `cache` without exposing secrets.

- [ ] **Step 7: Scan for misleading product claims**

Run: `rg -n "Kite|USDC|mint_receipt|已 Mint|真实 NFT|ar://demo" README.md index.html app.js server.py core.js data docs/SUBMISSION_CHECKLIST.md`

Expected: no matches outside historical exclusions in the approved design document.

- [ ] **Step 8: Review the diff and commit documentation**

Run: `git diff --check`

Expected: no whitespace errors.

```bash
git add README.md docs/SUBMISSION_CHECKLIST.md render.yaml server.py
git commit -m "docs: prepare Gonka archive submission"
```

---

## Completion Gate

The implementation is complete only when Tasks 1 through 8 are committed, all automated checks pass, the browser flow is visually inspected at desktop and mobile sizes, and the page never labels cached, partial, mock, or local-only output as live verified permanent storage.
