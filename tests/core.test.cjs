const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const fs = require("node:fs");
const core = require("../core.js");

test("labels cached live results honestly", () => {
  const result = core.verificationPresentation({ verificationState: "cached_live" });
  assert.equal(result.label, "CACHED LIVE");
  assert.equal(result.verified, true);
});

test("completion copy is derived from verification state", () => {
  const expected = {
    live_consensus: "已完成：Gonka 实时共识",
    cached_live: "已完成：Gonka 缓存结果",
    partial: "已完成：Gonka 部分结果",
    mock_fallback: "已完成：Gonka mock 兜底",
    demo_fallback: "已完成：本地演示兜底",
    unexpected: "已完成：未验证结果",
  };

  Object.entries(expected).forEach(([verificationState, copy]) => {
    assert.equal(core.verificationCompletionCopy({ verificationState }), copy);
  });
  Object.keys(expected)
    .filter((state) => state !== "live_consensus")
    .forEach((verificationState) => {
      assert.doesNotMatch(core.verificationCompletionCopy({ verificationState }), /实时|live/i);
    });
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

test("readiness does not require Kite or a wallet", () => {
  const items = core.archiveReadiness({
    evidenceCount: 6,
    requestCount: 2,
    archiveSeal: {
      provider: "pinata-ipfs",
      archiveId: "ipfs://bafy-test",
      contentHash: "sha256:abc",
    },
    credential: { id: "witness-sha256abc" },
  });
  assert.deepEqual(items.map((item) => item.label), ["公开证据", "模型会诊", "永久封存", "纪念凭证"]);
  assert.equal(items.every((item) => item.ready), true);
});

test("local receipts enable credentials but not permanent storage readiness", () => {
  const localReceipt = {
    provider: "local-sealed",
    archiveId: "local://sha256/abc",
    contentHash: "sha256:abc",
  };
  const items = core.archiveReadiness({
    evidenceCount: 6,
    requestCount: 2,
    archiveSeal: localReceipt,
    credential: { id: "witness-sha256abc" },
  });

  assert.equal(core.isStructurallyValidArchiveReceipt(localReceipt), true);
  assert.equal(items.find((item) => item.label === "永久封存").ready, false);
  assert.equal(items.find((item) => item.label === "纪念凭证").ready, true);
  assert.equal(
    core.isStructurallyValidArchiveReceipt({ provider: "local-sealed", contentHash: "sha256:abc" }),
    false,
  );
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

test("NFT-ready metadata recursively excludes mint and ownership fields and traits", () => {
  const credential = {
    id: "witness-sha256abc",
    name: "Cyber Memory Witness - 虾米音乐",
    contentHash: "sha256:abc",
    archiveId: "ipfs://cid",
    truthScore: 89,
    verificationState: "live_consensus",
    transactionHash: "0xtransaction",
    tokenId: "123",
    owner: "0xowner",
    mintReceipt: { transactionHash: "0xnested" },
    attributes: [
      { trait_type: "Transaction Hash", value: "0xtrait" },
      { trait_type: "Token ID", value: "456" },
      { trait_type: "Owner", value: "0xtrait-owner" },
      { trait_type: "Mint Receipt", value: "receipt-trait" },
    ],
  };
  const metadata = core.createNftReadyMetadata(credential, {
    image: "./assets/case-xiami.png",
    owner: "0xitem-owner",
  });
  const prohibited = /transactionhash|tokenid|owner|mintreceipt/;

  function assertRecursivelyClean(value) {
    if (Array.isArray(value)) {
      value.forEach(assertRecursivelyClean);
      return;
    }
    if (!value || typeof value !== "object") return;
    Object.entries(value).forEach(([key, nested]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
      assert.doesNotMatch(normalizedKey, prohibited);
      if (key === "trait_type") {
        assert.doesNotMatch(String(nested).toLowerCase().replace(/[^a-z]/g, ""), prohibited);
      }
      assertRecursivelyClean(nested);
    });
  }

  assertRecursivelyClean(metadata);
});

test("demo state stops on failure and resumes on retry", () => {
  const failed = core.nextDemoState({ step: 2, status: "running" }, "failure");
  assert.deepEqual(failed, { step: 2, status: "failed" });
  const retried = core.nextDemoState(failed, "retry");
  assert.deepEqual(retried, { step: 2, status: "running" });
});

test("archive community summary excludes guestbook identities and messages", () => {
  const summary = core.archiveCommunitySummary({
    flowers: 4,
    candles: 2,
    messages: [{ name: "private-witness", text: "private-message" }],
  });

  assert.deepEqual(summary, {
    flowers: 4,
    candles: 2,
    messageCount: 1,
    commentContentArchived: false,
  });
  assert.doesNotMatch(JSON.stringify(summary), /private-witness|private-message/);
});

test("local archive fallback provides a credential-ready receipt", async () => {
  const payload = {
    case: { id: "xiami", originalUrl: "https://www.xiami.com" },
    contentCreatedAt: "2026-07-15T12:00:00Z",
    verification: {
      verificationState: "cached_live",
      truthScore: 87,
      requests: [{ requestId: "gonka-a" }, { requestId: "gonka-b" }],
    },
  };

  const seal = await core.createLocalArchiveSeal(payload, {
    cryptoProvider: webcrypto,
    filename: "xiami.json",
    sealedAt: "2026-07-15T12:01:00Z",
    errorMessage: "offline",
  });

  assert.equal(seal.provider, "local-sealed");
  assert.equal(seal.gatewayUrl, "");
  assert.equal(seal.sealEligibility, "verified");
  assert.equal(seal.contentCreatedAt, payload.contentCreatedAt);
  assert.equal(seal.verificationState, "cached_live");
  assert.equal(seal.truthScore, 87);
  assert.deepEqual(seal.requestIds, ["gonka-a", "gonka-b"]);
  assert.match(seal.archiveId, /^local:\/\/sha256\/[a-f0-9]{64}$/);
  assert.equal(core.createCredential(payload.case, seal).issuedAt, payload.contentCreatedAt);
});

test("sha256Hex uses SubtleCrypto for the known SHA-256 vector", async () => {
  assert.equal(
    await core.sha256Hex("abc", webcrypto),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("sha256Hex rejects when SubtleCrypto is unavailable", async () => {
  await assert.rejects(core.sha256Hex("abc", {}), /SubtleCrypto is unavailable/);
});

test("archive UI promises counts only and keeps message content local", () => {
  const source = fs.readFileSync("app.js", "utf8");

  assert.doesNotMatch(source, /条纪念留言会写入永久档案/);
  assert.match(source, /永久档案仅记录/);
  assert.match(source, /留言内容仅保留在本地，不会上传。/);
});
