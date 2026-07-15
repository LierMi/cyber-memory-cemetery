# Gonka Submission Checklist

- [x] Live Gonka Router call returns two different model names
- [x] Both model Request IDs are visible
- [x] Truth Score, score spread, and consensus confidence are visible
- [x] Demo fallback is visibly labeled
- [ ] Public evidence links open
- [x] Archive SHA-256 is visible
- [ ] IPFS CID is visible when Pinata is configured
- [x] Local-only storage is visibly labeled when Pinata is absent
- [x] Memorial credential downloads successfully
- [x] GitHub README contains setup and verification commands
- [ ] Public deployment URL is recorded before submission

## Verification policy

An item is checked only after Task 8 verifies it directly. A `cached_live`, `partial`, or demo result does not satisfy the live Gonka items. A `local-sealed` receipt does not satisfy the IPFS CID item. The public deployment URL remains unchecked until a real deployed service is available.

## Unchecked items

- Public evidence links: four unique curated URLs returned HTTP 200, but the People.cn source returned a network `URLError` during the Task 8 probe.
- IPFS CID: `PINATA_JWT` is not configured, so only the verified `local-sealed` path is available. No CID was fabricated.
- Public deployment URL: no public Render or GitHub deployment credential is available in this worktree.
