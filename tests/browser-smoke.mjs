import { test, expect } from "@playwright/test";

const waybackRows = [
  ["timestamp", "statuscode"],
  ["20080101000000", "200"],
  ["20210101000000", "200"],
];

function verificationResult(requestIds, truthScore = 88) {
  const evidenceDigest = `sha256:${"a".repeat(64)}`;
  const evidencePackage = {
    schema: "cyber-memory-cemetery/evidence/v1",
    caseId: "xiami",
    version: "2026-07-15.1",
    curatedAt: "2026-07-15T12:00:00Z",
    evidenceCompleteness: 92,
    privacyBoundary: "Public summaries only.",
    claims: [],
  };
  const requests = requestIds.map((requestId, index) => ({
    role: index === 0 ? "digital_archaeologist" : "truth_verifier",
    model: index === 0 ? "review-archaeologist" : "review-verifier",
    requestId,
    requestedAt: `2026-07-15T12:00:0${index}Z`,
    truthScore,
    summary: "Route-backed browser verification result.",
    verifiedFacts: [],
    uncertainClaims: [],
    riskFlags: [],
    fallback: false,
  }));
  const verificationRecord = {
    source: "gonka",
    caseId: "xiami",
    verifiedAt: "2026-07-15T12:00:02Z",
    verificationState: "cached_live",
    truthScore,
    scoreSpread: 0,
    consensusConfidence: 90,
    sealEligibility: "verified",
    cacheStatus: "browser-route",
    requests,
    notes: [],
    evidenceSchema: evidencePackage.schema,
    evidenceVersion: evidencePackage.version,
    evidenceDigest,
  };
  return {
    source: "gonka",
    verificationState: "cached_live",
    truthScore,
    scoreSpread: 0,
    consensusConfidence: 90,
    sealEligibility: "verified",
    verifiedAt: "2026-07-15T12:00:02Z",
    cacheStatus: "browser-route",
    requests,
    evidenceDigest,
    evidencePackage,
    verificationRecord,
    verificationReceipt: "browser-payload.browser-signature",
  };
}

function archiveResult(payload, provider = "local-sealed") {
  const permanent = provider === "pinata-ipfs";
  const contentHash = `sha256:${"c".repeat(64)}`;
  const archiveId = permanent ? "ipfs://bafy-browser-test" : `local://sha256/${"c".repeat(64)}`;
  const requestIds = (payload.verification?.requests || []).map((request) => request.requestId);
  const receipt = {
    provider,
    status: permanent ? "uploaded" : "sealed-local",
    contentHash,
    archiveId,
    sealEligibility: payload.verification?.sealEligibility || "draft",
  };
  return {
    ...receipt,
    gatewayUrl: permanent ? "https://gateway.example/ipfs/bafy-browser-test" : "",
    contentCreatedAt: payload.contentCreatedAt,
    verificationState: payload.verification?.verificationState || "demo_fallback",
    truthScore: payload.verification?.truthScore,
    requestIds,
    filename: "cyber-memory-xiami-browser.json",
    json: JSON.stringify({
      schema: "cyber-memory-cemetery/sealed/v0.2",
      archive: payload,
      receipt,
    }),
    previewJson: JSON.stringify({ ...receipt }),
    notes: [],
  };
}

async function installDeterministicRoutes(page) {
  await page.route("https://web.archive.org/cdx**", (route) => route.fulfill({ json: waybackRows }));
  await page.route("**/api/gonka/verify", (route) =>
    route.fulfill({ json: verificationResult(["browser-request-a", "browser-request-b"]) }),
  );
  await page.route("**/api/archive/seal", (route) => {
    const payload = route.request().postDataJSON().payload;
    return route.fulfill({ json: archiveResult(payload) });
  });
}

async function enterCemetery(page) {
  await page.goto("http://127.0.0.1:5177/");
  await page.getByRole("button", { name: "进入公墓" }).click();
}

async function expectDemoComplete(page) {
  await expect
    .poll(() =>
      page.locator("[data-demo-step]").evaluateAll((rows) => rows.map((row) => row.dataset.status)),
    )
    .toEqual(Array(6).fill("done"));
}

test.beforeEach(async ({ request, page }) => {
  await installDeterministicRoutes(page);
  const response = await request.get("http://127.0.0.1:5177/api/status");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ cache: "enabled" });
});

test("primary case visuals render supplied archival material", async ({ page }) => {
  await enterCemetery(page);

  const xiamiCardImage = page.locator('[data-case-id="xiami"] .case-art img');
  await expect(xiamiCardImage).toBeVisible();
  await expect(xiamiCardImage).toHaveAttribute("src", "./assets/case-xiami-archive.jpg");
  expect(await xiamiCardImage.evaluate((image) => image.complete && image.naturalWidth > 0)).toBeTruthy();

  const fragments = page.locator(".archive-fragments img");
  await expect(fragments).toHaveCount(3);
  await page.locator(".archive-fragments").scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      fragments.evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
    )
    .toBeTruthy();

  await page.locator('[data-case-id="renren"]').click();
  const renrenCardImage = page.locator('[data-case-id="renren"] .case-art img');
  await expect(renrenCardImage).toHaveAttribute("src", "./assets/case-renren-archive.webp");
  await expect(fragments).toHaveCount(3);

  const secondaryCases = [
    ["netease-blog", "./assets/case-netease-blog-archive.jpeg"],
    ["tianya", "./assets/case-tianya-archive.jpeg"],
    ["mop", "./assets/case-mop-archive.jpeg"],
  ];
  for (const [caseId, src] of secondaryCases) {
    const image = page.locator(`[data-case-id="${caseId}"] .case-art img`);
    await expect(image).toHaveAttribute("src", src);
    expect(await image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBeTruthy();
  }
});

test("historical Gonka Request IDs are visible before a live demo runs", async ({ page }) => {
  await enterCemetery(page);

  const record = page.locator("[data-historical-gonka-record]");
  await expect(record).toBeVisible();
  await expect(record).toContainText("历史真实调用");
  await expect(record).toContainText("2026-07-16");
  await expect(record).toContainText("MiniMaxAI/MiniMax-M2.7");
  await expect(record).toContainText("moonshotai/Kimi-K2.6");
  await expect(record).toContainText("devshard-30387-13464");
  await expect(record).toContainText("devshard-30420-203");
  await expect(record.locator("[data-historical-request-id]")).toHaveCount(2);
  await expect(record).toContainText("不代表本次页面加载新请求");
});

test("Xiami presentation reaches a sealed credential", async ({ page }, testInfo) => {
  await page.goto("http://127.0.0.1:5177/");
  await page.getByRole("button", { name: "进入公墓" }).click();
  const progressRows = page.locator("[data-demo-step]");
  await expect(progressRows).toHaveCount(6);
  const initialRowHeights = await progressRows.evaluateAll((rows) =>
    rows.map((row) => row.getBoundingClientRect().height),
  );
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.locator("[data-verification-state]")).toContainText(/LIVE CONSENSUS|CACHED LIVE|DEMO FALLBACK/);
  await expect(page.locator("[data-archive-status]")).toBeVisible();
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toBeVisible();
  await expect
    .poll(() => progressRows.evaluateAll((rows) => rows.map((row) => row.dataset.status)))
    .toEqual(Array(6).fill("done"));
  const finalRowHeights = await progressRows.evaluateAll((rows) =>
    rows.map((row) => row.getBoundingClientRect().height),
  );
  expect(finalRowHeights).toEqual(initialRowHeights);
  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const overflowing = [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1);
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`)
      .slice(0, 10);
    const requestIds = [...document.querySelectorAll(".request-id")];
    const requestIdsWrap = requestIds.every(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    );
    const progressColumns = getComputedStyle(document.querySelector("#demoProgress"))
      .gridTemplateColumns.split(" ").length;
    return { overflowing, requestIdCount: requestIds.length, requestIdsWrap, progressColumns };
  });
  const pageGeometry = await page.evaluate(() => {
    const absoluteBox = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: String(element.className),
        top: Math.round(rect.top + scrollY),
        bottom: Math.round(rect.bottom + scrollY),
        height: Math.round(rect.height),
        display: getComputedStyle(element).display,
        position: getComputedStyle(element).position,
      };
    };
    const rendered = [...document.body.querySelectorAll("*")].filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && getComputedStyle(element).display !== "none";
    });
    const footer = document.querySelector("footer");
    const footerBottom = footer.getBoundingClientRect().bottom + scrollY;
    const maximumBottom = Math.max(
      ...rendered.map((element) => element.getBoundingClientRect().bottom + scrollY),
    );
    return {
      devicePixelRatio,
      documentScrollHeight: document.documentElement.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      footerBottom: Math.round(footerBottom),
      maximumBottom: Math.round(maximumBottom),
      blankTail: Math.round(document.documentElement.scrollHeight - maximumBottom),
      htmlBackground: getComputedStyle(document.documentElement).backgroundColor,
      bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
      bodyBackgroundImage: getComputedStyle(document.body).backgroundImage,
      bodyChildren: [...document.body.children].map(absoluteBox),
      afterFooter: rendered
        .filter((element) => element.getBoundingClientRect().top + scrollY > footerBottom + 1)
        .slice(0, 10)
        .map(absoluteBox),
    };
  });
  expect(layout.overflowing).toEqual([]);
  expect(layout.requestIdCount).toBeGreaterThan(0);
  expect(layout.requestIdsWrap).toBeTruthy();
  expect(layout.progressColumns).toBe(testInfo.project.name === "mobile-chromium" ? 1 : 3);
  expect(pageGeometry.documentScrollHeight).toBe(pageGeometry.bodyScrollHeight);
  expect(pageGeometry.footerBottom).toBe(pageGeometry.documentScrollHeight);
  expect(Math.abs(pageGeometry.blankTail)).toBeLessThanOrEqual(1);
  expect(pageGeometry.afterFooter).toEqual([]);
  expect(pageGeometry.htmlBackground).not.toBe("rgba(0, 0, 0, 0)");
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath("task-7-full-page.png"),
    fullPage: true,
    scale: "css",
  });
  await page.locator(".demo-flow").evaluate((element) =>
    element.scrollIntoView({ block: "center" }),
  );
  const settledLayout = await page.evaluate(() => ({
    tabsBottom: Math.round(document.querySelector(".museum-tabs").getBoundingClientRect().bottom),
    demoTop: Math.round(document.querySelector(".demo-flow").getBoundingClientRect().top),
  }));
  expect(settledLayout.demoTop).toBeGreaterThanOrEqual(settledLayout.tabsBottom);
  await page.screenshot({ path: testInfo.outputPath("task-7-viewport.png"), scale: "css" });
});

test("route-backed evidence failure retries without repeating completed operations", async ({ page }) => {
  const longRequestId = `review-request-${"x".repeat(240)}`;
  let evidenceShouldFail = true;
  let evidenceRequests = 0;
  let waybackRequests = 0;
  let gonkaRequests = 0;
  let archiveRequests = 0;

  await page.route("**/data/xiami-evidence.json", async (route) => {
    evidenceRequests += 1;
    if (evidenceShouldFail) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.fulfill({ status: 503, json: { error: "forced evidence failure" } });
      return;
    }
    await route.continue();
  });
  await page.route("https://web.archive.org/cdx**", async (route) => {
    waybackRequests += 1;
    await route.fulfill({ json: waybackRows });
  });
  await page.route("**/api/gonka/verify", async (route) => {
    gonkaRequests += 1;
    await route.fulfill({ json: verificationResult([longRequestId, "retry-gonka-b"]) });
  });
  await page.route("**/api/archive/seal", async (route) => {
    archiveRequests += 1;
    await route.fulfill({ json: archiveResult(route.request().postDataJSON().payload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.getByRole("button", { name: "从失败步骤重试" })).toBeVisible();
  await expect(page.locator('[data-demo-step="1"]')).toHaveAttribute("data-status", "failed");
  const evidenceRequestsAfterFailure = evidenceRequests;
  expect(evidenceRequestsAfterFailure).toBeGreaterThanOrEqual(1);
  expect(waybackRequests).toBe(0);
  expect(gonkaRequests).toBe(0);
  expect(archiveRequests).toBe(0);

  evidenceShouldFail = false;
  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  await expectDemoComplete(page);
  expect(evidenceRequests).toBe(evidenceRequestsAfterFailure + 1);
  expect(waybackRequests).toBe(1);
  expect(gonkaRequests).toBe(1);
  expect(archiveRequests).toBe(1);

  const longId = page.locator(".request-id").filter({ hasText: longRequestId }).first();
  await expect(longId).toBeVisible();
  expect(
    await longId.evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBeTruthy();
});

test("a fresh second run seals only the second verification payload", async ({ page }) => {
  const archivePayloads = [];
  let verificationRun = 0;

  await page.route("https://web.archive.org/cdx**", (route) => route.fulfill({ json: waybackRows }));
  await page.route("**/api/gonka/verify", async (route) => {
    verificationRun += 1;
    const prefix = verificationRun === 1 ? "first-run" : "second-run";
    await route.fulfill({
      json: verificationResult([`${prefix}-archaeologist`, `${prefix}-verifier`], 80 + verificationRun),
    });
  });
  await page.route("**/api/archive/seal", async (route) => {
    archivePayloads.push(route.request().postDataJSON().payload);
    await route.fulfill({ json: archiveResult(route.request().postDataJSON().payload) });
  });

  await enterCemetery(page);
  const runButton = page.getByRole("button", { name: "一键演示" });
  await runButton.click();
  await expectDemoComplete(page);
  await expect(runButton).toBeEnabled();
  await runButton.click();
  await expect.poll(() => archivePayloads.length).toBe(2);
  await expectDemoComplete(page);

  expect(archivePayloads[0].verification.requests.map((request) => request.requestId)).toEqual([
    "first-run-archaeologist",
    "first-run-verifier",
  ]);
  expect(archivePayloads[1].verification.requests.map((request) => request.requestId)).toEqual([
    "second-run-archaeologist",
    "second-run-verifier",
  ]);
  expect(archivePayloads[1].verification.truthScore).toBe(82);
});

test("running demo blocks manual case, seal, and credential mutation", async ({ page }) => {
  let releaseGonka;
  let markGonkaStarted;
  const gonkaStarted = new Promise((resolve) => {
    markGonkaStarted = resolve;
  });
  const gonkaGate = new Promise((resolve) => {
    releaseGonka = resolve;
  });
  let archiveRequests = 0;

  await page.route("https://web.archive.org/cdx**", (route) => route.fulfill({ json: waybackRows }));
  await page.route("**/api/gonka/verify", async (route) => {
    markGonkaStarted();
    await gonkaGate;
    await route.fulfill({ json: verificationResult(["guard-a", "guard-b"]) });
  });
  await page.route("**/api/archive/seal", async (route) => {
    archiveRequests += 1;
    await route.fulfill({ json: archiveResult(route.request().postDataJSON().payload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await gonkaStarted;

  await expect(page.locator("#caseSelect")).toBeDisabled();
  expect(
    await page.locator("[data-action='seal-archive']").evaluateAll((buttons) =>
      buttons.every((button) => button.disabled),
    ),
  ).toBeTruthy();
  expect(
    await page.locator("[data-action='generate-credential']").evaluateAll((buttons) =>
      buttons.every((button) => button.disabled),
    ),
  ).toBeTruthy();
  await expect(page.locator("[data-case-id]").first()).toHaveAttribute("aria-disabled", "true");

  await page.evaluate(async () => {
    window.selectCase("renren");
    await window.sealCurrentArchive();
    window.generateMemorialCredential();
  });
  await expect(page.locator("#caseSelect")).toHaveValue("xiami");
  expect(archiveRequests).toBe(0);
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toHaveCount(0);

  releaseGonka();
  await expectDemoComplete(page);
  expect(archiveRequests).toBe(1);
});

test("retained archive work keeps mutations locked until retry consumes it", async ({ page }) => {
  let gonkaRequests = 0;
  let archiveRequests = 0;
  let releaseArchive;
  const archiveGate = new Promise((resolve) => {
    releaseArchive = resolve;
  });

  await page.route("https://web.archive.org/cdx**", (route) => route.fulfill({ json: waybackRows }));
  await page.route("**/api/gonka/verify", async (route) => {
    gonkaRequests += 1;
    await route.fulfill({ json: verificationResult(["late-a", "late-b"]) });
  });
  await page.route("**/api/archive/seal", async (route) => {
    archiveRequests += 1;
    await archiveGate;
    await route.fulfill({ json: archiveResult(route.request().postDataJSON().payload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.getByRole("button", { name: "从失败步骤重试" })).toBeVisible();
  await expect(page.locator('[data-demo-step="4"]')).toHaveAttribute("data-status", "failed");
  expect(gonkaRequests).toBe(1);
  expect(archiveRequests).toBe(1);
  await expect(page.getByRole("button", { name: "从失败步骤重试" })).toBeEnabled();
  await expect(page.locator("#caseSelect")).toBeDisabled({ timeout: 2000 });
  expect(
    await page.locator([
      "[data-action='seal-archive']",
      "[data-action='generate-credential']",
      "[data-action='offer-flower']",
      "[data-action='light-candle']",
      "[data-action='guestbook-submit'] button",
      "[data-action='guestbook-submit'] input",
      "[data-action='guestbook-submit'] textarea",
    ].join(", ")).evaluateAll((controls) => controls.every((control) => control.disabled)),
  ).toBeTruthy();

  const beforeActions = await page.locator(".tribute-grid").innerText();
  await page.evaluate(async () => {
    window.selectCase("renren");
    await window.sealCurrentArchive();
    window.generateMemorialCredential();
    window.addFlower();
    window.lightCandle();
    window.submitGuestbook(document.querySelector("[data-action='guestbook-submit']"));
  });
  await expect(page.locator("#caseSelect")).toHaveValue("xiami");
  await expect(page.locator(".tribute-grid")).toHaveText(beforeActions);
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toHaveCount(0);
  expect(archiveRequests).toBe(1);

  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  releaseArchive();
  await expectDemoComplete(page);
  expect(gonkaRequests).toBe(1);
  expect(archiveRequests).toBe(1);
});

test("progress is one column at the 719px boundary", async ({ page }) => {
  await page.setViewportSize({ width: 719, height: 900 });
  await enterCemetery(page);
  const columns = await page.locator("#demoProgress").evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
  expect(columns).toBe(1);
});

test("network and invalid JSON verification failures stop the demo until retry", async ({ page }) => {
  let mode = "network";
  let attempts = 0;
  await page.route("**/api/gonka/verify", async (route) => {
    attempts += 1;
    if (mode === "network") {
      await route.abort("failed");
      return;
    }
    if (mode === "invalid-json") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{invalid" });
      return;
    }
    await route.fulfill({ json: verificationResult(["retry-request-a", "retry-request-b"]) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.locator('[data-demo-step="3"]')).toHaveAttribute("data-status", "failed");
  expect(attempts).toBe(1);

  mode = "invalid-json";
  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  await expect.poll(() => attempts).toBe(2);
  await expect(page.locator('[data-demo-step="3"]')).toHaveAttribute("data-status", "failed");
  await expect(page.locator("[data-demo-summary]")).toContainText(/invalid JSON/i);

  mode = "valid";
  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  await expectDemoComplete(page);
  expect(attempts).toBe(3);
});

test("explicit archive rejection stops without creating a local seal", async ({ page }) => {
  await page.route("**/api/archive/seal", (route) =>
    route.fulfill({ status: 403, json: { error: "Verification receipt rejected" } }),
  );

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();

  await expect(page.locator('[data-demo-step="3"]')).toHaveAttribute("data-status", "failed");
  await expect(page.locator("[data-demo-summary]")).toContainText(/receipt rejected/i);
  await expect(page.locator(".archive-list")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toHaveCount(0);
});

test("malformed archive success cannot complete sealing or generate a credential", async ({ page }) => {
  await page.route("**/api/archive/seal", (route) => route.fulfill({ status: 200, json: {} }));

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();

  await expect(page.locator('[data-demo-step="4"]')).toHaveAttribute("data-status", "failed");
  await expect(page.locator("[data-demo-summary]")).toContainText(/invalid archive seal receipt/i);
  await expect(page.locator(".archive-list")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toHaveCount(0);
});

test("receipt rejection rolls the demo back for fresh verification before sealing", async ({ page }) => {
  let verificationCalls = 0;
  const archiveRequests = [];
  await page.route("**/api/gonka/verify", async (route) => {
    verificationCalls += 1;
    const prefix = verificationCalls === 1 ? "expired" : "fresh";
    const result = verificationResult([`${prefix}-request-a`, `${prefix}-request-b`]);
    result.verificationReceipt = `${prefix}-payload.${prefix}-signature`;
    await route.fulfill({ json: result });
  });
  await page.route("**/api/archive/seal", async (route) => {
    const request = route.request().postDataJSON();
    archiveRequests.push(request);
    if (archiveRequests.length === 1) {
      await route.fulfill({
        status: 400,
        json: { type: "verification_receipt_expired", error: "Verification receipt expired" },
      });
      return;
    }
    await route.fulfill({ json: archiveResult(request.payload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.locator('[data-demo-step="3"]')).toHaveAttribute("data-status", "failed");
  expect(verificationCalls).toBe(1);
  expect(archiveRequests).toHaveLength(1);

  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  await expectDemoComplete(page);
  expect(verificationCalls).toBe(2);
  expect(archiveRequests).toHaveLength(2);
  expect(archiveRequests[0].verificationReceipt).not.toBe(archiveRequests[1].verificationReceipt);
  expect(archiveRequests[1].payload.verification.requests.map((request) => request.requestId)).toEqual([
    "fresh-request-a",
    "fresh-request-b",
  ]);
});

test("transient archive failure retries sealing with the same verified payload", async ({ page }) => {
  let verificationCalls = 0;
  const archiveRequests = [];
  await page.route("**/api/gonka/verify", async (route) => {
    verificationCalls += 1;
    await route.fulfill({ json: verificationResult(["stable-request-a", "stable-request-b"]) });
  });
  await page.route("**/api/archive/seal", async (route) => {
    const request = route.request().postDataJSON();
    archiveRequests.push(request);
    if (archiveRequests.length === 1) {
      await route.fulfill({
        status: 502,
        json: { type: "archive_unavailable", error: "Archive service unavailable" },
      });
      return;
    }
    await route.fulfill({ json: archiveResult(request.payload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.locator('[data-demo-step="4"]')).toHaveAttribute("data-status", "failed");

  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  await expectDemoComplete(page);
  expect(verificationCalls).toBe(1);
  expect(archiveRequests).toHaveLength(2);
  expect(archiveRequests[1]).toEqual(archiveRequests[0]);
});

test("non-retryable archive failure restarts with fresh verification", async ({ page }) => {
  let verificationCalls = 0;
  const archiveRequests = [];
  await page.route("**/api/gonka/verify", async (route) => {
    verificationCalls += 1;
    const prefix = verificationCalls === 1 ? "stale" : "restarted";
    const result = verificationResult([`${prefix}-request-a`, `${prefix}-request-b`]);
    result.verificationReceipt = `${prefix}-payload.${prefix}-signature`;
    await route.fulfill({ json: result });
  });
  await page.route("**/api/archive/seal", async (route) => {
    const request = route.request().postDataJSON();
    archiveRequests.push(request);
    if (archiveRequests.length === 1) {
      await route.fulfill({
        status: 413,
        json: { type: "archive_request_too_large", error: "Archive request is too large" },
      });
      return;
    }
    await route.fulfill({ json: archiveResult(request.payload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.locator('[data-demo-step="4"]')).toHaveAttribute("data-status", "failed");
  await expect(page.getByRole("button", { name: "重新开始演示" })).toBeVisible();
  await expect(page.getByRole("button", { name: "从失败步骤重试" })).toHaveCount(0);
  expect(verificationCalls).toBe(1);
  expect(archiveRequests).toHaveLength(1);

  await page.getByRole("button", { name: "重新开始演示" }).click();
  await expectDemoComplete(page);
  expect(verificationCalls).toBe(2);
  expect(archiveRequests).toHaveLength(2);
  expect(archiveRequests[1].verificationReceipt).not.toBe(archiveRequests[0].verificationReceipt);
  expect(archiveRequests[1].payload.verification.requests.map((request) => request.requestId)).toEqual([
    "restarted-request-a",
    "restarted-request-b",
  ]);
});

test("archive transport failure alone creates the browser-local fallback", async ({ page }) => {
  await page.route("**/api/archive/seal", (route) => route.abort("failed"));

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();

  await expectDemoComplete(page);
  await expect(page.locator(".archive-list")).toContainText("browser-fallback");
  await expect(page.getByRole("button", { name: "下载纪念凭证" }).first()).toBeVisible();
});

test("zero Truth Score is preserved in the UI and frozen archive", async ({ page }) => {
  let archivedPayload;
  await page.route("**/api/gonka/verify", (route) =>
    route.fulfill({ json: verificationResult(["zero-request-a", "zero-request-b"], 0) }),
  );
  await page.route("**/api/archive/seal", (route) => {
    archivedPayload = route.request().postDataJSON().payload;
    return route.fulfill({ json: archiveResult(archivedPayload) });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expectDemoComplete(page);

  await expect(page.locator(".truth-score strong").first()).toHaveText("0");
  expect(archivedPayload.verification.truthScore).toBe(0);
});

test("local-to-IPFS promotion invalidates and regenerates the credential", async ({ page }) => {
  let archiveCalls = 0;
  await page.route("**/api/archive/seal", (route) => {
    archiveCalls += 1;
    const payload = route.request().postDataJSON().payload;
    return route.fulfill({
      json: archiveResult(payload, archiveCalls === 1 ? "local-sealed" : "pinata-ipfs"),
    });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expectDemoComplete(page);
  const credentialCode = page.locator(".credential-preview code").first();
  const localCredentialId = await credentialCode.textContent();
  await expect(page.getByRole("button", { name: "下载纪念凭证" }).first()).toBeVisible();

  await page.getByRole("button", { name: "重新上传 IPFS" }).first().click();
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toHaveCount(0);
  await page.getByRole("button", { name: "生成纪念凭证" }).first().click();

  await expect(credentialCode).not.toHaveText(localCredentialId);
  expect(await credentialCode.textContent()).toContain("ipfsbafybrowsertest");
});

test("failed local-to-IPFS promotion preserves the local seal and credential", async ({ page }) => {
  let archiveCalls = 0;
  await page.route("**/api/archive/seal", async (route) => {
    archiveCalls += 1;
    const payload = route.request().postDataJSON().payload;
    if (archiveCalls === 1) {
      await route.fulfill({ json: archiveResult(payload, "local-sealed") });
      return;
    }
    await route.fulfill({
      status: 403,
      json: { type: "verification_receipt_rejected", error: "Verification receipt rejected" },
    });
  });

  await enterCemetery(page);
  await page.getByRole("button", { name: "一键演示" }).click();
  await expectDemoComplete(page);
  const credentialCode = page.locator(".credential-preview code").first();
  const localCredentialId = await credentialCode.textContent();
  const localArchive = await page.locator(".archive-list").first().innerText();

  await page.getByRole("button", { name: "重新上传 IPFS" }).first().click();

  await expect(page.locator("#agentState")).toContainText("封存被拒绝");
  await expect(page.locator(".archive-list").first()).toHaveText(localArchive);
  await expect(credentialCode).toHaveText(localCredentialId);
  await expect(page.getByRole("button", { name: "下载纪念凭证" }).first()).toBeVisible();
  expect(archiveCalls).toBe(2);
});

test("museum tabs expose complete semantics and update selection", async ({ page }) => {
  await enterCemetery(page);
  const exhibitTab = page.locator("#museum-tab-exhibit");
  const consoleTab = page.locator("#museum-tab-console");
  const archiveTab = page.locator("#museum-tab-archive");

  await expect(exhibitTab).toHaveAttribute("aria-selected", "true");
  await expect(exhibitTab).toHaveAttribute("aria-controls", "museum-panel-exhibit");
  await expect(page.locator("#museum-panel-exhibit")).toHaveAttribute(
    "aria-labelledby",
    "museum-tab-exhibit",
  );

  await consoleTab.click();
  await expect(consoleTab).toHaveAttribute("aria-selected", "true");
  await expect(exhibitTab).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#museum-panel-console")).toBeVisible();
  await consoleTab.press("ArrowRight");
  await expect(archiveTab).toBeFocused();
  await expect(archiveTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#museum-panel-archive")).toBeVisible();
});
