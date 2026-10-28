import { describe, expect, it, vi } from "vitest";

/**
 * Production refused sign-up and sign-in from www.ricardotour.com with "Invalid origin": browser requests carry cookies,
 * so better-auth checks their Origin, and only BETTER_AUTH_URL (a vercel.app address) was trusted.
 *
 * The first test checks the configuration without a database. The LIVE block is SKIPPED unless S11_LOCAL_DB_URL points
 * at a disposable local database (literal loopback URL whose database carries rt.environment = local-isolated; anything
 * else is refused before any write). It drives the real auth handler with BETTER_AUTH_URL set like production.
 */
/**
 * RT-129 intermittent failure (investigated 28/10/2026): this check is not slow, the first import of lib/auth is. After
 * vi.resetModules() the worker loads better-auth and its Next.js integration from scratch: ~1.5 s alone, but up to 45 s
 * in a cold full-suite run while the other workers load their own graphs (measured: the import stalled, the assertions
 * then passed; the live test with real HTTP and database passed in the same run). The bound covers that load time; a
 * real hang still fails.
 */
const AUTH_COLD_IMPORT_TIMEOUT_MS = 120_000;

describe("auth trusted origins", () => {
  it("trusts the official domains without wildcards or disabled checks, and keeps the role out of client input", async () => {
    vi.resetModules();
    vi.doMock("@/lib/prisma", () => ({ prisma: {} }));
    try {
      const { auth } = await import("@/lib/auth");
      const origins = auth.options.trustedOrigins as string[];
      expect(origins).toEqual(expect.arrayContaining(["https://www.ricardotour.com", "https://ricardotour.com"]));
      expect(origins.some((origin) => origin.includes("*"))).toBe(false);
      expect(auth.options.advanced?.disableOriginCheck).toBe(false);
      expect((auth.options.advanced as { disableCSRFCheck?: boolean } | undefined)?.disableCSRFCheck).toBeUndefined();
      expect(auth.options.user?.additionalFields?.role).toMatchObject({ type: "string", defaultValue: "USER", input: false });
    } finally {
      vi.doUnmock("@/lib/prisma");
    }
  }, AUTH_COLD_IMPORT_TIMEOUT_MS);
});

const url = process.env.S11_LOCAL_DB_URL;

describe.skipIf(!url)("auth trusted origins live (local isolated database only)", () => {
  it("accepts sign-up and sign-in from the official domains, refuses other origins, and new accounts stay USER", async () => {
    const target = new URL(url!);
    if (!["127.0.0.1", "[::1]"].includes(target.hostname) || !target.port) throw new Error("Refusing: not a literal loopback URL with an explicit port");
    const pg = (await import("pg")).default;
    const probe = new pg.Client({ connectionString: url });
    await probe.connect();
    const marker = (await probe.query("SELECT current_setting('rt.environment', true) AS v")).rows[0]?.v;
    await probe.end();
    if (marker !== "local-isolated") throw new Error("Refusing: database is not marked rt.environment = local-isolated");
    vi.resetModules();
    process.env.DATABASE_URL = url;
    process.env.BETTER_AUTH_URL = "https://rick-travel.vercel.app"; // as in production: not one of the official domains
    process.env.BETTER_AUTH_SECRET ??= "local-test-secret-0123456789abcdef0123456789";
    const { auth } = await import("@/lib/auth");
    const watcher = new pg.Client({ connectionString: url });
    await watcher.connect();
    const roleOf = async (email: string) => (await watcher.query('SELECT role FROM "User" WHERE email = $1', [email])).rows[0]?.role ?? null;
    // Every browser request carries cookies (locale, attribution): that is what makes better-auth check the Origin.
    const call = (origin: string, path: string, body: unknown, cookie = "NEXT_LOCALE=pt") =>
      auth.handler(
        new Request(`https://www.ricardotour.com/api/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin, cookie },
          body: JSON.stringify(body),
        }),
      );
    const cookieOf = (response: Response) =>
      (response.headers.get("set-cookie") ?? "")
        .split(/,(?=\s*[^;,]+=)/)
        .map((c) => c.split(";")[0].trim())
        .filter(Boolean)
        .join("; ");

    const tag = Date.now();
    const emails = { www: `origin-www-${tag}@example.invalid`, apex: `origin-apex-${tag}@example.invalid`, evil: `origin-evil-${tag}@example.invalid` };
    const password = "Probe-password-123";
    try {
      // 1. Official domains: sign-up works, and a role sent by the client is ignored.
      const www = await call("https://www.ricardotour.com", "/sign-up/email", { email: emails.www, password, name: "Probe www", role: "ADMIN" });
      expect(www.status).toBe(200);
      expect(await roleOf(emails.www)).toBe("USER");
      const apex = await call("https://ricardotour.com", "/sign-up/email", { email: emails.apex, password, name: "Probe apex" });
      expect(apex.status).toBe(200);
      expect(await roleOf(emails.apex)).toBe("USER");

      // 2. Any other origin is refused before anything is written.
      const evil = await call("https://evil.example", "/sign-up/email", { email: emails.evil, password, name: "Probe evil" });
      expect(evil.status).toBe(403);
      expect(await evil.json()).toMatchObject({ code: "INVALID_ORIGIN" });
      expect(await roleOf(emails.evil)).toBeNull();
      expect((await call("http://www.ricardotour.com", "/sign-in/email", { email: emails.www, password })).status).toBe(403);
      expect((await call("https://evil.example", "/sign-in/email", { email: emails.www, password })).status).toBe(403);

      // 3. Sign-in from the official domain works; update-user still cannot raise the role.
      const signIn = await call("https://www.ricardotour.com", "/sign-in/email", { email: emails.www, password });
      expect(signIn.status).toBe(200);
      const session = cookieOf(signIn);
      expect(session).not.toBe("");
      const escalate = await call("https://www.ricardotour.com", "/update-user", { role: "ADMIN" }, `NEXT_LOCALE=pt; ${session}`);
      expect(escalate.status).not.toBe(200);
      expect(await roleOf(emails.www)).toBe("USER");
    } finally {
      await watcher.query('DELETE FROM "User" WHERE email = ANY($1)', [Object.values(emails)]);
      await watcher.end();
    }
  }, 120_000);
});
