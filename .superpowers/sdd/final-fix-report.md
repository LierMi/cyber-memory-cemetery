# Cyber Memory Cemetery Final Fix Report

Date: 2026-07-16

Status: DONE_WITH_CONCERNS

## Scope

This fix wave resolves every Critical, Important, and Minor item in
`final-fix-brief.md`. It preserves the vanilla JavaScript/CSS UI, the reviewed
demo retry and mutation-lock behavior, local sealing fallback, and the existing
dark museum identity. No wallet, payment, Kite, or real NFT minting behavior was
added.

## Architecture And Interfaces

The server-owned trust boundary is concentrated in `verification_trust.py`.
`VerificationTrust` exposes three operations:

1. `prepare_evidence(case_id, evidence_package)` canonicalizes a versioned
   public-only evidence package and returns the package plus its SHA-256 digest.
2. `issue(verification, evidence, max_expires_at=None)` freezes the verification
   record and issues a short-lived HMAC-SHA256 receipt. The process-local secret
   is never serialized or returned.
3. `verify_archive(request_payload, max_bytes)` verifies receipt authenticity,
   expiry, archive shape and size, case ID, evidence schema/version/digest,
   model set, Request IDs, scores, Truth Score, state, verification time, and
   the exact frozen verification-record digest before storage is attempted.

The module owns receipt and evidence invariants. `server.py` owns transport,
model dispatch, cache orchestration, Pinata/local storage, and duplicate valid
Pinata retry deduplication. `cemetery_core.py` owns score normalization,
distinct-model aggregation, archive eligibility, and deterministic cache/hash
helpers. `verification_cache.py` owns atomic cache persistence and exact
case/evidence-version/evidence-digest/model-set/TTL matching.

The browser treats the server result as data, not authority for server sealing.
It accepts live/cached results only when two distinct successful models have
real Request IDs and finite scores, accepts only explicit valid
`demo_fallback`, preserves zero scores, freezes the returned evidence package
and verification record, and sends the opaque receipt to `/api/archive/seal`.
Server rejection still produces an honest `local-sealed` browser artifact.

## Behavior Delivered

- Duplicate explicit models and fewer-than-two distinct model pools are rejected
  before dispatch; aggregation independently revalidates distinct successful
  model IDs.
- Missing, mock, or malformed Request IDs and missing, boolean, malformed, or
  non-finite scores become fallback requests and cannot count toward consensus.
- `gonka_req_unknown` is no longer synthesized as a successful-looking ID.
- Archive sealing requires a valid, unexpired, content-matched HMAC receipt and
  rejects oversized or malformed requests before Pinata.
- Valid duplicate Pinata retries reuse the prior deterministic seal; failed or
  local attempts remain retryable for local-to-IPFS promotion.
- Cache recovery requires exact case, evidence version, evidence digest, and
  distinct model set compatibility, expires at the TTL boundary, and exposes
  only `cacheAgeSeconds`.
- Default cache TTL is 3600 seconds and default receipt TTL is 900 seconds, with
  documented environment overrides.
- Network, invalid-JSON, and invalid-verification failures stop the demo and
  expose retry; completed operations and mutation locks remain intact.
- Presets use `mock_*` Request IDs and fallback provenance.
- Credential identity changes when provider/archive ID/content hash changes.
  Draft metadata and UI copy do not claim verification or on-chain readiness.
- Tabs now have complete IDs, `aria-selected`, `aria-controls`, tabpanel roles,
  labels, roving tabindex, and keyboard navigation.
- Browser tests route every external Wayback/Gonka/archive path. The only
  `route.continue()` is for the local Xiami evidence fixture.
- Roadmap, README, checklist, and Render syntax commands reflect the final
  receipt/cache/browser behavior.

## Files

- `verification_trust.py`: new canonical evidence and HMAC receipt module.
- `server.py`: model selection, strict expert normalization, receipt issuance,
  compatible cache recovery, bounded sealing, and Pinata retry deduplication.
- `cemetery_core.py`: finite score and distinct-model consensus validation plus
  digest-aware cache keys.
- `verification_cache.py`: exact compatibility and TTL-aware cache lookup.
- `core.js`: transport validation, zero-safe numbers, credential identity and
  status, metadata honesty, and shared credential copy.
- `app.js`: mock preset provenance, frozen evidence/verification payloads,
  receipt transport, retry behavior, credential invalidation, and tab state.
- `index.html`: complete tab semantics and corrected roadmap copy.
- `README.md`: receipt/cache TTL behavior, environment overrides, commands, and
  the required port 5177 browser-test note.
- `docs/SUBMISSION_CHECKLIST.md`: receipt/cache/browser verification notes.
- `render.yaml`: compiles `verification_trust.py` during build.
- `tests/test_verification_trust.py`: new evidence and receipt contract tests.
- `tests/test_cemetery_core.py`: distinct-model and finite-score aggregation.
- `tests/test_server.py`: model, response, cache, seal, size, and retry contracts.
- `tests/core.test.cjs`: transport, zero score, credential, draft, and copy tests.
- `tests/browser-smoke.mjs`: deterministic routed browser tests for retry,
  locks, zero score, credential promotion, tabs, layout, and screenshots.
- `.superpowers/sdd/final-fix-report.md`: this report.

## TDD Evidence

Production behavior was changed only after focused failures were observed.

Initial RED commands and results:

- `python3 -m unittest tests/test_cemetery_core.py tests/test_server.py -v`
  produced 12 focused assertion failures and 4 errors for duplicate/insufficient
  model configuration, malformed success responses, incompatible cache restore,
  and unprotected archive sealing.
- `python3 -m unittest tests/test_verification_trust.py -v` failed with
  `ModuleNotFoundError: No module named 'verification_trust'` before the module
  was created.
- `python3 -m unittest tests/test_cemetery_core.py -v` showed duplicate models
  incorrectly producing `live_consensus` instead of `partial`.
- `node --test tests/core.test.cjs` produced 8 focused failures for unchanged
  credential identity, claim-ready draft wording, missing verification-response
  validation, missing numeric validation, and real-looking preset IDs.
- `node --test --test-name-pattern='credential workbench copy' tests/core.test.cjs`
  failed with `TypeError: core.credentialStatusCopy is not a function`.
- `node --test --test-name-pattern='verification response validation' tests/core.test.cjs`
  failed because legacy `mock_fallback` was accepted.
- `python3 -m unittest tests.test_server.ArchiveSealTests.test_archive_handler_rejects_a_negative_body_length_before_reading_it tests.test_server.VerificationCacheTests.test_cache_recovery_rejects_expired_entries tests.test_server.GonkaCouncilStateTests.test_missing_malformed_or_non_finite_score_cannot_count_as_success tests.test_verification_trust.VerificationTrustTests.test_forged_expired_and_mismatched_receipts_are_rejected -v`
  exposed the unbounded negative-length read, exact-TTL cache acceptance, boolean
  score acceptance, and raw `TypeError` for malformed verification records.

Focused GREEN evidence included:

- `python3 -m unittest tests/test_verification_trust.py -v`: 3 passed.
- `python3 -m unittest tests/test_cemetery_core.py -v`: 7 passed.
- The four-test boundary command above: 4 passed.
- `node --test --test-name-pattern='credential workbench copy|verification response validation' tests/core.test.cjs`:
  2 passed.

## Final Fresh Verification

Run after implementation commit `e22c23430d64f33fae6e50afd296a74a1cf3a8d8`:

- `python3 -m unittest tests/test_cemetery_core.py tests/test_verification_trust.py tests/test_server.py -v`
  result: 48 tests passed in 0.342s.
- `node --test tests/core.test.cjs`
  result: 21 tests passed in 0.254s.
- `python3 -m py_compile server.py cemetery_core.py verification_cache.py verification_trust.py`
  result: exit 0.
- `node --check core.js`
  result: exit 0.
- `node --check app.js`
  result: exit 0.
- `npm run test:browser`
  result: 20 tests passed across desktop and mobile Chromium in 1.6m.
- `rg -n "Kite|USDC|mint_receipt|已 Mint|真实 NFT|ar://demo" README.md index.html app.js server.py core.js data docs/SUBMISSION_CHECKLIST.md`
  result: zero matches; `rg` exit 1 is expected for an empty result.
- `rg -n "[—–]" README.md index.html app.js core.js server.py cemetery_core.py verification_cache.py verification_trust.py docs/SUBMISSION_CHECKLIST.md`
  result: zero matches; `rg` exit 1 is expected for an empty result.
- `git diff --check`
  result: exit 0 with no output.

## Visual Inspection

Fresh full-page and viewport screenshots were generated for both Playwright
projects under `test-results/`. All four images are nonblank and preserve the
reviewed dark museum identity. Desktop and mobile show all six demo steps as
complete, the verification/council/archive sections, wrapped Request IDs, and
the final credential/archive data. Visual inspection found no incoherent text
overlap or clipped controls.

The browser assertions also confirmed no horizontal overflow, no blank tail,
stable progress-row dimensions, one mobile progress column and three desktop
columns, visible wrapped Request IDs, correct tab selection/panels, and keyboard
tab movement.

## Sanitized Live Gonka Probe

The live probe was run only after deterministic tests passed. It imported the
configured server, disabled compatible-cache recovery only inside the probe via
`unittest.mock.patch`, and printed only sanitized booleans, counts, schemas, and
state. No secret, Request ID, model ID, or raw response was printed.

Result:

- Credentials configured: yes.
- Model resolution: healthy pool with at least two distinct models; selected
  role models were distinct.
- Verification result: `demo_fallback`, source `mock`, two fallback requests,
  and no real Request IDs. Therefore the probe did not establish fresh live
  consensus and no live claim is made.
- New fields: evidence schema present, evidence version present, valid-format
  evidence digest present, frozen verification-record digest matched, HMAC
  receipt present, and receipt expiry present.

## Commits

- `e22c23430d64f33fae6e50afd296a74a1cf3a8d8` - implementation, tests,
  browser routing, README/checklist, and Render configuration.
- This report is committed in a separate documentation commit. Its hash cannot
  be embedded in its own content and is supplied in the final handoff.

## Concerns

The configured live credentials and distinct model resolution still work at
the configuration stage, but both external expert calls failed or failed the
new strict Request ID/finite-score validation during the cache-disabled probe.
The system handled this correctly as `demo_fallback` and issued a draft-bound
receipt. A later manual live probe is needed to demonstrate fresh
`live_consensus` once the external service returns two valid expert responses.

Receipts intentionally use a process-local HMAC secret, so unsealed receipts
from a prior server process are invalid after restart. This behavior is
documented in README and is consistent with the binding brief.
