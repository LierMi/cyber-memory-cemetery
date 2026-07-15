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
    const compact = String(seal.contentHash).replace(/[^a-zA-Z0-9]/g, "");
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
