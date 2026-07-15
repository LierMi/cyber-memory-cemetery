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

test("credential IDs distinguish full SHA-256 hashes with the same prefix", () => {
  const item = { id: "xiami", name: "虾米音乐", image: "./assets/case-xiami.png" };
  const receipt = {
    archiveId: "ipfs://cid",
    contentCreatedAt: "2026-07-15T12:00:00Z",
    verificationState: "live_consensus",
    truthScore: 89,
  };
  const first = core.createCredential(item, {
    ...receipt,
    contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1",
  });
  const second = core.createCredential(item, {
    ...receipt,
    contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2",
  });

  assert.notEqual(first.id, second.id);
});

test("demo state stops on failure and resumes on retry", () => {
  const failed = core.nextDemoState({ step: 2, status: "running" }, "failure");
  assert.deepEqual(failed, { step: 2, status: "failed" });
  const retried = core.nextDemoState(failed, "retry");
  assert.deepEqual(retried, { step: 2, status: "running" });
});
