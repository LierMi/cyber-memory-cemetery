# Task 5 Report: Deterministic Archive and IPFS Status

## Delivered

- `seal_archive` hashes only the frozen archive payload via `cemetery_core.content_hash`.
- Pinata receives only the frozen payload; attempt timestamps, provider receipts, notes, and IDs remain outside the hash boundary.
- Local and failed-upload receipts use `local://sha256/<digest>` with provider `local-sealed`; successful uploads use `pinata-ipfs` and an IPFS CID.
- Seal responses expose `contentCreatedAt`, `verificationState`, `truthScore`, `requestIds`, and `sealEligibility`. Only `live_consensus` and `cached_live` are verified.
- `GET /api/status` reports non-secret Gonka/IPFS/cache state.
- The browser preserves the first frozen payload for retry, canonicalizes its local fallback hash consistently, renders honest provider copy, and uses the existing seal action for IPFS retry.

## RED Evidence

1. `python3 -m unittest tests/test_server.py -v`
   - Failed as expected before the seal change: `test_mock_archive_is_a_draft` raised `KeyError: 'sealEligibility'`.
2. `python3 -m unittest tests/test_server.py -v`
   - Failed as expected before browser canonicalization: `canonicalArchiveJson` was absent.
3. `python3 -m unittest tests/test_server.py -v`
   - Failed as expected before final copy cleanup: the source still contained `provider: "demo-local"`.

## GREEN Evidence

- `python3 -m unittest tests/test_cemetery_core.py tests/test_server.py -v`: 30 tests passed.
- `python3 -m py_compile server.py cemetery_core.py`: exit 0.
- `node --check app.js`: exit 0.
- `git diff --check`: no whitespace errors.

## Self-review

- Archive tests patch `PINATA_JWT` and Pinata upload functions; no Pinata or Gonka requests are made.
- No `ar://demo` IDs remain in `app.js` or server archive receipt paths.
- `/api/status` returns service labels only and does not serialize credential values.
