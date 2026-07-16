(function expose(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CemeteryCore = api;
})(typeof window !== "undefined" ? window : globalThis, function buildCore() {
  const states = {
    live_consensus: { label: "LIVE CONSENSUS", verified: true, tone: "verified" },
    cached_live: { label: "CACHED LIVE", verified: true, tone: "cached" },
    partial: { label: "PARTIAL", verified: false, tone: "warning" },
    mock_fallback: { label: "MOCK FALLBACK", verified: false, tone: "mock" },
    demo_fallback: { label: "DEMO FALLBACK", verified: false, tone: "mock" },
  };

  const verificationResultCopyByState = {
    live_consensus: "Gonka 实时共识",
    cached_live: "Gonka 缓存结果",
    partial: "Gonka 部分结果",
    mock_fallback: "Gonka mock 兜底",
    demo_fallback: "本地演示兜底",
  };

  function verificationPresentation(verification) {
    return states[verification?.verificationState] || states.demo_fallback;
  }

  function verificationResultCopy(verification) {
    return verificationResultCopyByState[verification?.verificationState] || "未验证结果";
  }

  function verificationCompletionCopy(verification) {
    return `已完成：${verificationResultCopy(verification)}`;
  }

  function finiteNumberOr(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  }

  function createCredential(item, seal) {
    const compact = String(seal.contentHash).replace(/[^a-zA-Z0-9]/g, "");
    const archiveCompact = String(seal.archiveId || "unsealed").replace(/[^a-zA-Z0-9]/g, "");
    const verified =
      seal.sealEligibility === "verified" &&
      (seal.verificationState === "live_consensus" || seal.verificationState === "cached_live");
    return {
      schema: "cyber-memory-cemetery/credential/v1",
      id: `witness-${compact}-${archiveCompact}`,
      name: `Cyber Memory Witness - ${item.name}`,
      caseId: item.id,
      image: item.image,
      status: verified ? "future_claim_compatible" : "draft_memorial",
      truthScore: finiteNumberOr(seal.truthScore, null),
      verificationState: seal.verificationState,
      sealEligibility: seal.sealEligibility,
      contentHash: seal.contentHash,
      archiveId: seal.archiveId,
      gonkaRequestIds: seal.requestIds || [],
      issuedAt: seal.contentCreatedAt,
    };
  }

  function credentialStatusCopy(credential) {
    if (!credential) return "完成封存后生成纪念凭证和 metadata。";
    if (credential.status === "future_claim_compatible") {
      return "凭证已生成，可保留未来认领兼容性；当前没有发生链上铸造。";
    }
    return "凭证已生成，是不具备链上认领资格的草稿纪念文件。";
  }

  function createNftReadyMetadata(credential, item) {
    const verified =
      credential.status === "future_claim_compatible" &&
      (credential.verificationState === "live_consensus" ||
        credential.verificationState === "cached_live");
    return {
      name: credential.name,
      description: verified
        ? "Future-compatible memorial credential metadata for a verified digital archive."
        : "Draft memorial metadata; verification and claim eligibility are not established.",
      image: item.image || credential.image,
      external_url: item.originalUrl || credential.archiveId,
      attributes: [
        {
          trait_type: "Claim Status",
          value: verified ? "Future claim compatible" : "Draft memorial artifact",
        },
        { trait_type: "Archive Hash", value: credential.contentHash },
        { trait_type: "Verification State", value: credential.verificationState },
        { trait_type: "Truth Score", value: credential.truthScore },
      ],
    };
  }

  function realRequestId(value) {
    return (
      typeof value === "string" &&
      value.length > 0 &&
      value !== "gonka_req_unknown" &&
      !value.startsWith("mock_")
    );
  }

  function successfulLiveRequests(requests) {
    if (!Array.isArray(requests)) return [];
    return requests.filter(
      (request) =>
        request &&
        typeof request === "object" &&
        !request.fallback &&
        typeof request.model === "string" &&
        request.model.length > 0 &&
        realRequestId(request.requestId) &&
        Number.isFinite(request.truthScore) &&
        request.truthScore >= 0 &&
        request.truthScore <= 100,
    );
  }

  function hasLiveModelConsensus(requests) {
    const successful = successfulLiveRequests(requests);
    return (
      successful.length >= 2 &&
      new Set(successful.map((request) => request.model)).size >= 2 &&
      new Set(successful.map((request) => request.requestId)).size >= 2
    );
  }

  function isValidVerificationResult(result) {
    if (!result || typeof result !== "object") return false;
    const state = result.verificationState;
    if (!["live_consensus", "cached_live", "partial", "demo_fallback"].includes(state)) {
      return false;
    }
    if (!Number.isFinite(result.truthScore)) return false;
    if (!/^sha256:[a-f0-9]{64}$/.test(result.evidenceDigest || "")) return false;
    if (
      !result.evidencePackage ||
      typeof result.evidencePackage !== "object" ||
      typeof result.evidencePackage.schema !== "string" ||
      typeof result.evidencePackage.version !== "string"
    ) return false;
    if (
      !result.verificationRecord ||
      typeof result.verificationRecord !== "object" ||
      result.verificationRecord.verificationState !== state
    ) return false;
    if (
      typeof result.verificationReceipt !== "string" ||
      !result.verificationReceipt.includes(".")
    ) return false;
    if (!Array.isArray(result.requests)) return false;

    const successful = successfulLiveRequests(result.requests);
    const distinctModels = new Set(successful.map((request) => request.model));
    const distinctRequestIds = new Set(successful.map((request) => request.requestId));
    if (state === "live_consensus" || state === "cached_live") {
      return successful.length >= 2 && distinctModels.size >= 2 && distinctRequestIds.size >= 2;
    }
    if (state === "partial") return successful.length === 1;
    return (
      result.source === "mock" &&
      successful.length === 0 &&
      result.requests.length > 0 &&
      result.requests.every(
        (request) =>
          request &&
          request.fallback === true &&
          typeof request.requestId === "string" &&
          request.requestId.startsWith("mock_"),
      )
    );
  }

  async function readVerificationResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Gonka response contained invalid JSON");
    }
    if (response.ok) {
      if (!isValidVerificationResult(data)) {
        throw new Error("Gonka returned an invalid verification result");
      }
      return data;
    }
    if (
      data?.fallback?.verificationState === "demo_fallback" &&
      isValidVerificationResult(data.fallback)
    ) {
      return data.fallback;
    }
    throw new Error(data?.message || data?.error || `Gonka HTTP ${response.status || "error"}`);
  }

  async function readArchiveSealResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Archive seal response contained invalid JSON");
    }
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Archive seal HTTP ${response.status || "error"}`);
    }
    if (!data || typeof data !== "object") {
      throw new Error("Archive seal response was invalid");
    }
    return data;
  }

  function archiveCommunitySummary(actions) {
    const messages = Array.isArray(actions?.messages) ? actions.messages : [];
    return {
      flowers: nonNegativeInteger(actions?.flowers),
      candles: nonNegativeInteger(actions?.candles),
      messageCount: messages.length,
      commentContentArchived: false,
    };
  }

  function nonNegativeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  }

  function sortKeys(value) {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce((result, key) => {
          result[key] = sortKeys(value[key]);
          return result;
        }, {});
    }
    return value;
  }

  function canonicalJson(value) {
    return JSON.stringify(sortKeys(value));
  }

  async function sha256Hex(text, cryptoProvider) {
    const subtle = cryptoProvider?.subtle;
    if (!subtle || typeof subtle.digest !== "function") {
      throw new Error("SubtleCrypto is unavailable; cannot create SHA-256");
    }

    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function createLocalArchiveSeal(payload, options = {}) {
    const contentHash = `sha256:${await sha256Hex(canonicalJson(payload), options.cryptoProvider)}`;
    const digest = contentHash.split(":")[1];
    const verification = payload?.verification || {};
    const verificationState = verification.verificationState || "demo_fallback";
    const requestIds = Array.isArray(verification.requests)
      ? verification.requests
          .filter((request) => request && typeof request === "object" && request.requestId)
          .map((request) => request.requestId)
      : [];
    const archiveId = `local://sha256/${digest}`;
    const sealEligibility =
      verificationState === "live_consensus" || verificationState === "cached_live"
        ? "verified"
        : "draft";
    const notes = options.errorMessage ? [`服务端封存失败，已使用浏览器本地封存：${options.errorMessage}`] : [];
    const filename =
      options.filename || `cyber-memory-${payload?.case?.id || "memorial"}-${digest.slice(0, 10)}.json`;
    const receipt = {
      provider: "local-sealed",
      status: "browser-fallback",
      contentHash,
      archiveId,
      gatewayUrl: "",
      sealedAt: options.sealedAt,
      sealEligibility,
    };
    if (notes.length) receipt.notes = notes;
    const preview = {
      id: payload?.case?.id,
      url: payload?.case?.originalUrl,
      truthScore: verification.truthScore,
      contentCreatedAt: payload?.contentCreatedAt,
      verificationState,
      requestIds,
      provider: receipt.provider,
      status: receipt.status,
      contentHash,
      archiveId,
      gatewayUrl: "",
      sealEligibility,
    };

    return {
      provider: receipt.provider,
      status: receipt.status,
      archiveId,
      contentHash,
      gatewayUrl: "",
      sealEligibility,
      contentCreatedAt: payload?.contentCreatedAt,
      verificationState,
      truthScore: verification.truthScore,
      requestIds,
      filename,
      json: JSON.stringify(
        {
          schema: "cyber-memory-cemetery/sealed/v0.1",
          archive: payload,
          receipt,
        },
        null,
        2,
      ),
      previewJson: JSON.stringify(preview, null, 2),
      notes,
    };
  }

  function isStructurallyValidArchiveReceipt(archiveSeal) {
    return Boolean(
      archiveSeal &&
        typeof archiveSeal === "object" &&
        typeof archiveSeal.contentHash === "string" &&
        archiveSeal.contentHash.startsWith("sha256:") &&
        typeof archiveSeal.archiveId === "string" &&
        archiveSeal.archiveId.length,
    );
  }

  function isPermanentArchiveReceipt(archiveSeal) {
    return Boolean(
      isStructurallyValidArchiveReceipt(archiveSeal) &&
        archiveSeal.provider === "pinata-ipfs" &&
        /^ipfs:\/\/[^/\s]+$/.test(archiveSeal.archiveId),
    );
  }

  function archiveReadiness({ evidenceCount, requestCount, requests, archiveSeal, credential }) {
    const modelConsensusReady = Array.isArray(requests)
      ? hasLiveModelConsensus(requests)
      : requestCount >= 2;
    return [
      { label: "公开证据", ready: evidenceCount > 0 },
      { label: "模型会诊", ready: modelConsensusReady },
      { label: "永久封存", ready: isPermanentArchiveReceipt(archiveSeal) },
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

  return {
    verificationPresentation,
    verificationResultCopy,
    verificationCompletionCopy,
    finiteNumberOr,
    createCredential,
    credentialStatusCopy,
    createNftReadyMetadata,
    isValidVerificationResult,
    readVerificationResponse,
    readArchiveSealResponse,
    hasLiveModelConsensus,
    archiveCommunitySummary,
    sha256Hex,
    createLocalArchiveSeal,
    isStructurallyValidArchiveReceipt,
    isPermanentArchiveReceipt,
    archiveReadiness,
    nextDemoState,
  };
});
