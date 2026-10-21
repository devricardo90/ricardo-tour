import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// The i18n routing handler is irrelevant to the lab gate (and its ESM build does not load under vitest/node).
vi.mock("next-intl/middleware", () => ({ default: () => () => NextResponse.next() }));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["pt", "en", "es"], defaultLocale: "pt" } }));
const { default: proxy } = await import("@/proxy");

const request = (path: string) => new NextRequest(new URL(path, "https://www.ricardotour.com"));

describe("Rebuild lab is refused by the proxy before rendering when disabled (Sprint 10 security fix)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns a bare 404 with no page payload for every lab route in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REBUILD_LAB_ENABLED", "");
    for (const path of ["/pt/rebuild-lab", "/en/rebuild-lab/tour-content-preview/cmlibniq40000z4zqkbujnutt", "/es/rebuild-lab/terms-draft", "/rebuild-lab"]) {
      const res = proxy(request(path));
      expect(res.status, path).toBe(404);
      expect(res.headers.get("x-robots-tag"), path).toContain("noindex");
      const body = await res.text();
      expect(body, path).toBe("Not Found");
      expect(body, path).not.toMatch(/R\$|data-status|__next_f/);
    }
  });

  it("respects an explicit REBUILD_LAB_ENABLED=false even in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REBUILD_LAB_ENABLED", "false");
    expect(proxy(request("/pt/rebuild-lab")).status).toBe(404);
  });

  it("lets the lab through only when enabled, and never touches public routes", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    expect(proxy(request("/pt/rebuild-lab/tour-content-preview/cmlibniq40000z4zqkbujnutt")).status).not.toBe(404);
    vi.stubEnv("REBUILD_LAB_ENABLED", "");
    for (const path of ["/pt/tours/cmlibniq40000z4zqkbujnutt", "/pt/tours", "/pt"]) expect(proxy(request(path)).status, path).not.toBe(404);
    expect(proxy(request("/pt/rebuild-laboratory-like-page")).status).not.toBe(404); // only the lab segment is matched
  });
});
