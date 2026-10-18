import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { assertDatabaseAccess } from "./lib/db/guard-runtime.mjs";

// RT-104: this suite creates and deletes users and bookings through the app. It runs only against a positively
// identified local isolated database: `.env.local` only (never `.env`), guard at config load, an explicit DATABASE_URL
// handed to the web server it starts, and no reuse of an already running server (its database cannot be verified).
// An external server (PLAYWRIGHT_BASE_URL) is refused for the same reason. The read-only public suite
// (playwright.public.config.ts) does not touch the database and is not affected.
loadEnv({ path: ".env.local", quiet: true });
if (process.env.PLAYWRIGHT_BASE_URL) {
  throw new Error("[db-guard] DENIED (playwright e2e): PLAYWRIGHT_BASE_URL points to an external server whose database cannot be verified. Nothing was executed.");
}
assertDatabaseAccess({ operation: "destructive", label: "playwright e2e (playwright.config.ts)" });

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global.setup.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npx.cmd next dev --webpack --port ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        env: { ...(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined)) as Record<string, string>), DATABASE_URL: process.env.DATABASE_URL ?? "" },
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
