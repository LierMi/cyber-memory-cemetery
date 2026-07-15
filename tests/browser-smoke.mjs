import { test, expect } from "@playwright/test";

test.beforeEach(async ({ request }) => {
  const response = await request.get("http://127.0.0.1:5177/api/status");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toMatchObject({ cache: "enabled" });
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
    const requestIdsWrap = [...document.querySelectorAll(".request-list code")].every(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    );
    const progressColumns = getComputedStyle(document.querySelector("#demoProgress"))
      .gridTemplateColumns.split(" ").length;
    return { overflowing, requestIdsWrap, progressColumns };
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

test("retry resumes at the failed seal step", async ({ page }) => {
  let waybackRequests = 0;
  let gonkaRequests = 0;
  let archiveRequests = 0;

  await page.route("https://web.archive.org/cdx**", async (route) => {
    waybackRequests += 1;
    await route.fulfill({
      json: [
        ["timestamp", "statuscode"],
        ["20080101000000", "200"],
        ["20210101000000", "200"],
      ],
    });
  });
  await page.route("**/api/gonka/verify", async (route) => {
    gonkaRequests += 1;
    await route.fulfill({
      json: {
        verificationState: "cached_live",
        truthScore: 88,
        consensusConfidence: 0.9,
        requests: [
          { role: "digital_archaeologist", requestId: "retry-gonka-a", score: 88 },
          { role: "truth_verifier", requestId: "retry-gonka-b", score: 88 },
        ],
      },
    });
  });
  await page.route("**/api/archive/seal", async (route) => {
    archiveRequests += 1;
    await route.continue();
  });

  await page.goto("http://127.0.0.1:5177/");
  await page.getByRole("button", { name: "进入公墓" }).click();
  await page.evaluate(() => {
    const seal = window.sealCurrentArchive;
    let attempts = 0;
    window.sealCurrentArchive = async (...args) => {
      attempts += 1;
      if (attempts === 1) throw new Error("forced seal failure");
      return seal(...args);
    };
  });

  await page.getByRole("button", { name: "一键演示" }).click();
  await expect(page.getByRole("button", { name: "从失败步骤重试" })).toBeVisible();
  await expect(page.locator('[data-demo-step="4"]')).toHaveAttribute("data-status", "failed");
  expect(waybackRequests).toBe(1);
  expect(gonkaRequests).toBe(1);
  expect(archiveRequests).toBe(0);

  await page.getByRole("button", { name: "从失败步骤重试" }).click();
  await expect(page.getByRole("button", { name: "下载纪念凭证" })).toBeVisible();
  expect(waybackRequests).toBe(1);
  expect(gonkaRequests).toBe(1);
  expect(archiveRequests).toBe(1);
});
