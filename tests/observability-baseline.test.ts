import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/observability/client/route";
import { onRequestError } from "@/instrumentation";
import { clientReportSchema } from "@/lib/observability/client-schema";
import { buildErrorRecord, reportServerError, reportWebVital, setObservabilityWriter } from "@/lib/observability/report";
import { errorDigest, errorName, sanitizeMessage, sanitizePath } from "@/lib/observability/sanitize";

// RT-64 minimal observability baseline. No network, no database, no vendor.
let lines: string[] = [];
beforeEach(() => {
  lines = [];
  setObservabilityWriter((line) => lines.push(line));
});
afterEach(() => setObservabilityWriter(undefined));
const logged = () => lines.map((l) => JSON.parse(l) as Record<string, unknown>);

describe("sanitizing", () => {
  it("redacts personal data, query strings and long tokens from messages and bounds the length", () => {
    const text = sanitizeMessage(new Error("fail for ana@example.com at /pt/contato?token=abcdef&x=1 key sk_live_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 " + "x".repeat(900)));
    expect(text).not.toMatch(/ana@example\.com|token=abcdef|ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/);
    expect(text.length).toBeLessThanOrEqual(300);
    expect(sanitizeMessage(undefined)).toBe("");
  });

  it("redacts Brazilian phone formats, credentials and base64 secrets; hides database error details", () => {
    const text = sanitizeMessage("tel (21) 99999-9999 e +55 (21) 99999-9999 e 99999-9999; Authorization: Bearer sk_live_abc123DEF456ghi789; password=hunter2; blob QWxhZGRpbjpvcGVuIHNlc2FtZQ+/abc123XYZ789==");
    expect(text).not.toMatch(/99999|sk_live|hunter2|QWxhZGRpbjpvcGVuIHNlc2FtZQ/);
    const prisma = Object.assign(new Error("Invalid `create()` args: name: 'Maria Silva' email: 'm@x.com'"), { name: "PrismaClientValidationError" });
    expect(sanitizeMessage(prisma)).toBe("database error (details withheld)");
    expect(sanitizeMessage("Maria Silva")).toBe("Maria Silva"); // names cannot be detected deterministically: documented limit
  });

  it("is linear enough: a huge message is truncated before the redactors run", () => {
    const start = Date.now();
    sanitizeMessage("a".repeat(500_000));
    sanitizeMessage(new Error("a.b+".repeat(100_000) + "@"));
    expect(Date.now() - start).toBeLessThan(1_000);
  });

  it("keeps only the path, collapsing opaque ids", () => {
    expect(sanitizePath("https://www.ricardotour.com/pt/reservas/clx1234567890abcdefghijk?email=a@b.co#x")).toBe("/pt/reservas/:id");
    expect(sanitizePath("/pt/tours/3f2b8c1e-aaaa-bbbb-cccc-1234567890ab")).toBe("/pt/tours/:id");
    expect(sanitizePath("/pt/tours?x=1")).toBe("/pt/tours");
    expect(sanitizePath(42)).toBe("unknown");
  });

  it("only passes safe error names and digests", () => {
    expect(errorName(new TypeError("x"))).toBe("TypeError");
    expect(errorName({ name: "bad name!" })).toBe("UnknownError");
    expect(errorDigest({ digest: "123456789" })).toBe("123456789");
    expect(errorDigest({ digest: "<script>" })).toBeUndefined();
  });
});

describe("server reporting", () => {
  it("writes one structured line without stack, headers or raw input, and never throws", () => {
    reportServerError({ source: "form", where: "contact-message:store", error: new Error("db down for joao@x.com"), path: "/pt/contato?name=Joao" });
    const [record] = logged();
    expect(record).toMatchObject({ event: "site_error", source: "form", where: "contact-message:store", error_name: "Error", path: "/pt/contato" });
    expect(lines[0]).not.toMatch(/joao@x\.com|name=Joao|\bat .*\(.*:\d+:\d+\)/);
    expect(typeof record.release).toBe("string");
    setObservabilityWriter(() => {
      throw new Error("sink failure");
    });
    expect(() => reportServerError({ source: "api_route", where: "x", error: new Error("y") })).not.toThrow();
  });

  it("buildErrorRecord survives non-Error throwables", () => {
    expect(buildErrorRecord({ source: "render", where: "w", error: "boom" })).toMatchObject({ error_name: "Error", message: "boom" });
    expect(buildErrorRecord({ source: "render", where: "w", error: null }).error_name).toBe("UnknownError");
  });

  it("logs web vitals with a sanitized path", () => {
    reportWebVital({ name: "LCP", value: 1234.56789, rating: "good", path: "/pt?utm=x" });
    expect(logged()[0]).toMatchObject({ event: "web_vital", name: "LCP", value: 1234.568, rating: "good", path: "/pt" });
  });

  it("instrumentation.onRequestError reports route pattern and type, not headers or cookies", async () => {
    await onRequestError(
      new Error("render failed"),
      { path: "/pt/tours/abc?session=secret", method: "GET", headers: { cookie: "better-auth.session_token=SECRET" } },
      { routerKind: "App Router", routePath: "/[locale]/tours/[id]", routeType: "render", revalidateReason: undefined },
    );
    expect(logged()[0]).toMatchObject({ source: "render", where: "render:/[locale]/tours/[id]", path: "/pt/tours/abc" });
    expect(lines[0]).not.toMatch(/SECRET|session=/);
  });
});

describe("browser intake endpoint", () => {
  let ip = 0;
  const post = (body: unknown, raw?: string, extra: Record<string, string> = {}) =>
    POST(new Request("http://localhost/api/observability/client", { method: "POST", headers: { "x-forwarded-for": `10.0.0.${++ip}`, "content-type": "application/json", ...extra }, body: raw ?? JSON.stringify(body) }));

  it("accepts a valid browser error and vital (204) and logs them sanitized", async () => {
    expect((await post({ kind: "error", source: "client_boundary", name: "TypeError", message: "x is undefined for a@b.co", path: "/pt/tours?x=1", digest: "abc123" })).status).toBe(204);
    expect((await post({ kind: "vital", name: "CLS", value: 0.04, rating: "good", path: "/pt" })).status).toBe(204);
    const [error, vital] = logged();
    expect(error).toMatchObject({ event: "site_error", source: "client_boundary", where: "browser", error_name: "TypeError", digest: "abc123", path: "/pt/tours" });
    expect(lines[0]).not.toContain("a@b.co");
    expect(vital).toMatchObject({ event: "web_vital", name: "CLS" });
  });

  it("rejects unknown keys, bad enums, oversize, empty and malformed bodies without logging", async () => {
    expect((await post({ kind: "vital", name: "CLS", value: 1, rating: "good", path: "/", cookie: "x" })).status).toBe(400);
    expect((await post({ kind: "vital", name: "FID", value: 1, rating: "good", path: "/" })).status).toBe(400);
    expect((await post({ kind: "error", source: "server", name: "E", message: "m", path: "/" })).status).toBe(400);
    expect((await post(null, "x".repeat(5_000))).status).toBe(413);
    expect((await post(null, "")).status).toBe(413);
    expect((await post(null, "{not json")).status).toBe(400);
    expect(lines).toHaveLength(0);
  });

  it("limits a single client to 60 reports per minute", async () => {
    const send = () =>
      POST(new Request("http://localhost/api/observability/client", { method: "POST", headers: { "x-forwarded-for": "10.9.9.9", "content-type": "application/json" }, body: JSON.stringify({ kind: "vital", name: "TTFB", value: 5, rating: "good", path: "/" }) }));
    let last = 204;
    for (let i = 0; i < 61; i++) last = (await send()).status;
    expect(last).toBe(429);
  });

  it("refuses cross-site writes, non-JSON content and declared oversize before reading the body", async () => {
    const valid = { kind: "vital", name: "CLS", value: 0.1, rating: "good", path: "/" };
    expect((await post(valid, undefined, { "sec-fetch-site": "cross-site" })).status).toBe(403);
    expect((await post(valid, undefined, { origin: "https://evil.example", host: "www.ricardotour.com" })).status).toBe(403);
    expect((await post(valid, undefined, { "sec-fetch-site": "same-origin", origin: "https://www.ricardotour.com", host: "www.ricardotour.com" })).status).toBe(204);
    expect((await post(valid, undefined, { "content-type": "text/plain" })).status).toBe(415);
    expect((await post(valid, undefined, { "content-length": "999999" })).status).toBe(413);
  });

  it("the schema is strict", () => {
    expect(clientReportSchema.safeParse({ kind: "vital", name: "INP", value: -1, rating: "good", path: "/" }).success).toBe(false);
  });
});

describe("wiring and boundaries", () => {
  const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

  it("public forms and API routes report through the shared reporter instead of raw console.error", () => {
    for (const file of ["app/actions/contact-message.ts", "app/actions/tour-request.ts", "app/api/analytics/route.ts", "app/api/bookings/route.ts", "app/api/bookings/[id]/route.ts", "app/api/trips/route.ts", "app/api/trips/[id]/route.ts", "app/sitemap.ts"]) {
      const source = read(file);
      expect(source, file).toContain("reportServerError");
      expect(source, file).not.toMatch(/console\.error/);
    }
  });

  it("ships error boundaries and the web-vitals reporter, with no vendor SDK or browser storage", () => {
    expect(read("app/[locale]/error.tsx")).toContain("ErrorFallback");
    expect(read("app/global-error.tsx")).toMatch(/<html[\s\S]*<body/);
    expect(read("app/[locale]/layout.tsx")).toContain("<WebVitalsReporter />");
    for (const file of ["lib/observability/report.ts", "lib/observability/client.ts", "components/observability/web-vitals-reporter.tsx", "components/observability/error-fallback.tsx"]) {
      expect(read(file), file).not.toMatch(/sentry|datadog|logrocket|posthog|gtag|localStorage|sessionStorage|document\.cookie/i);
    }
    const pkg = JSON.parse(read("package.json")) as { dependencies?: Record<string, string> };
    expect(Object.keys(pkg.dependencies ?? {}).filter((name) => /sentry|datadog|logrocket|newrelic|bugsnag/i.test(name))).toEqual([]);
  });

  it("the fallback UI never shows technical details", () => {
    const source = read("components/observability/error-fallback.tsx");
    expect(source).not.toMatch(/error\.message|error\.stack|\{String\(error/);
  });
});
