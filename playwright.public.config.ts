import { defineConfig, devices } from "@playwright/test";

// RT-44 (RT-RB-S6-01): critical public-site flows. Read-only against the public
// surface — no globalSetup, no database seeding, no form submissions that persist.
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e/public",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL, trace: "on-first-retry" },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx.cmd next dev --webpack --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
