# Gonka Submission Checklist

- [x] Live Gonka Router call returns two different model names
- [x] Both model Request IDs are visible
- [x] Verification response includes evidence digest and a server-issued receipt
- [x] Cache recovery enforces evidence/version/model compatibility and TTL
- [x] Truth Score, score spread, and consensus confidence are visible
- [x] Demo fallback is visibly labeled
- [ ] Public evidence links open
- [x] Archive SHA-256 is visible
- [ ] IPFS CID is visible when Pinata is configured
- [x] Local-only storage is visibly labeled when Pinata is absent
- [x] Memorial credential downloads successfully
- [x] GitHub README contains setup and verification commands
- [x] Browser suite stubs Wayback, Gonka, and archive upload paths
- [ ] Public deployment URL is recorded before submission

## Verification policy

An item is checked only after Task 8 verifies it directly. A `cached_live`, `partial`, or demo result does not satisfy the live Gonka items. A `local-sealed` receipt does not satisfy the IPFS CID item. The public deployment URL remains unchecked until a real deployed service is available.

Before `npm run test:browser`, stop any manually running server on port 5177. Playwright intentionally uses `reuseExistingServer: false`. Verification receipts default to a 900-second TTL, compatible live-cache records default to 3600 seconds, and both limits may be overridden with the documented environment variables.

## Unchecked items

- Public evidence links: four unique curated URLs returned HTTP 200, but the People.cn source returned a network `URLError` during the Task 8 probe.
- IPFS CID: `PINATA_JWT` is not configured, so only the verified `local-sealed` path is available. No CID was fabricated.
- Public deployment URL: no public Render or GitHub deployment credential is available in this worktree.

## Live Gonka verification

The 2026-07-16 strict live probe completed as `live_consensus` through `https://api.gonkarouter.io/v1`:

- `MiniMaxAI/MiniMax-M2.7`: Request ID `devshard-30387-13464`, Truth Score 75.
- `moonshotai/Kimi-K2.6`: Request ID `devshard-30420-203`, Truth Score 88.
- Aggregated Truth Score 82, score spread 13, consensus confidence 86.
- Evidence digest `sha256:dd3863d09bd4ab8b600a724d0cbccc82ccb22967e6db87eba5f92ba75f8fa9a9`.
