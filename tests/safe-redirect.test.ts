import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Same as tests/rt-s10-rebuild-lab-proxy.test.ts: the i18n handler's ESM build does not load under vitest/node.
vi.mock("next-intl/middleware", () => ({ default: () => () => NextResponse.next() }));
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["pt", "en", "es"], defaultLocale: "pt" } }));

const FALLBACK = "/pt";

describe("safeRedirectPath", () => {
  it.each([
    ["/pt/admin", "/pt/admin"],
    ["/en/admin", "/en/admin"],
    ["/es/reservas", "/es/reservas"],
    ["/pt/admin/bookings?status=PENDING", "/pt/admin/bookings?status=PENDING"],
    ["/pt/tours/abc#galeria", "/pt/tours/abc#galeria"],
    ["/", "/"],
  ])("keeps the same-site path %s", (input, expected) => {
    expect(safeRedirectPath(input, FALLBACK)).toBe(expected);
  });

  it.each([
    "https://evil.example",
    "http://evil.example/pt/admin",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "/\t/evil.example",
    "/\n/evil.example",
    "/ /evil.example",
    "/.//evil.example",
    "/pt/..//evil.example",
    "pt/admin",
    "evil.example",
    "",
    "/" + "a".repeat(600),
  ])("refuses %j", (input) => {
    expect(safeRedirectPath(input, FALLBACK)).toBe(FALLBACK);
  });

  it("refuses missing values", () => {
    expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it("never returns something that leaves the site", () => {
    for (const input of ["/%2F%2Fevil.example", "/pt/../../evil.example", "/.//evil.example"]) {
      const out = safeRedirectPath(input, FALLBACK);
      expect(new URL(out, "https://www.ricardotour.com").origin).toBe("https://www.ricardotour.com");
    }
  });
});

describe("login redirect wiring", () => {
  it("the login page only navigates through safeRedirectPath", () => {
    const source = readFileSync("app/[locale]/login/page.tsx", "utf8");
    expect(source).toContain('safeRedirectPath(searchParams.get("redirect") ?? searchParams.get("callbackUrl")');
    expect(source).not.toMatch(/window\.location\.href\s*=\s*(redirectTarget|searchParams)/);
  });

  it("the proxy sends anonymous visitors of a protected page to the login with that page as redirect", async () => {
    const { default: proxy } = await import("@/proxy");
    const response = proxy(new NextRequest("https://www.ricardotour.com/pt/admin/bookings"));
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.origin).toBe("https://www.ricardotour.com");
    expect(location.pathname).toBe("/pt/login");
    expect(location.searchParams.get("redirect")).toBe("/pt/admin/bookings");
    expect(safeRedirectPath(location.searchParams.get("redirect"), FALLBACK)).toBe("/pt/admin/bookings");
  });
});
