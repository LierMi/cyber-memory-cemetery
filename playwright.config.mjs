import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 90000,
  expect: { timeout: 60000 },
  workers: 1,
  testMatch: "tests/browser-smoke.mjs",
  webServer: {
    command: "python3 server.py",
    url: "http://127.0.0.1:5177/api/status",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
  ],
});
