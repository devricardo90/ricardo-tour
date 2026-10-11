import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.public.config";

// RT-83 (RT-RB-L-08), automated part only: the RT-44 public suite on every desktop engine plus mobile emulation.
// WebKit on Windows/Linux approximates Safari; it is NOT a substitute for real iOS Safari / Android Chrome devices,
// which stay a HYBRID (Owner) check. Requires `npx playwright install firefox webkit` (browser binaries, not deps);
// the "edge" project uses the locally installed Microsoft Edge (channel msedge) — skip it with --project when absent.
export default defineConfig({
  ...base,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "edge", use: { ...devices["Desktop Edge"], channel: "msedge" } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
  ],
});
