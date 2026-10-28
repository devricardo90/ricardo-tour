import { describe, expect, it, vi } from "vitest";

/**
 * Security hotfix (RT-129): better-auth accepts `user.additionalFields` as client input unless `input: false`, so the
 * role must be declared with `input: false` or a client could choose its own role at sign-up or through update-user.
 *
 * The first test checks the configuration without a database. The LIVE block is SKIPPED unless S11_LOCAL_DB_URL points
 * at a disposable local database (a loopback URL whose database carries rt.environment = local-isolated; anything
 * else is refused before any write). It drives the real auth handler over HTTP,
 * reads stored values from an independent pg session, and checks the admin surfaces with real sessions.
 */
describe("RT-129: the user role is never client input", () => {
  it("declares role with input: false and USER as the default", async () => {
    vi.resetModules();
    vi.doMock("@/lib/prisma", () => ({ prisma: {} }));
    try {
      const { auth } = await import("@/lib/auth");
      expect(auth.options.user?.additionalFields?.role).toMatchObject({ type: "string", defaultValue: "USER", input: false });
    } finally {
      vi.doUnmock("@/lib/prisma");
    }
  }, 120_000); // cold import of lib/auth under a full-suite load (see tests/auth-trusted-origins.test.ts)
});

const url = process.env.S11_LOCAL_DB_URL;
const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders.current }));
// Same as tests/trip.service.test.ts: the trip route imports the translation service ("server-only"); it is never
// reached here because the invalid body is refused first.
vi.mock("@/lib/translation-service", () => ({
  translateTextWithMeta: vi.fn(),
  translateArrayWithMeta: vi.fn(),
  logTranslationJob: vi.fn(),
}));

describe.skipIf(!url)("RT-129 live: role and account fields cannot be set by the client (local isolated database only)", () => {
  it("sign-up and update-user ignore role/emailVerified/email; USER and anonymous are refused on admin surfaces; a real ADMIN keeps access", async () => {
    // Local-only guard (this branch has no shared RT-104 guard): literal loopback host, explicit port, and the
    // isolation marker set inside the local container. Anything else is refused before any write.
    const target = new URL(url!);
    if (!["127.0.0.1", "[::1]"].includes(target.hostname) || !target.port) throw new Error("Refusing: not a literal loopback URL with an explicit port");
    const pg = (await import("pg")).default;
    const probe = new pg.Client({ connectionString: url });
    await probe.connect();
    const marker = (await probe.query("SELECT current_setting('rt.environment', true) AS v")).rows[0]?.v;
    await probe.end();
    if (marker !== "local-isolated") throw new Error("Refusing: database is not marked rt.environment = local-isolated");
    vi.resetModules(); // drop the auth module cached with the mocked prisma by the configuration test
    process.env.DATABASE_URL = url;
    const base = "http://localhost:3000";
    process.env.BETTER_AUTH_URL = base;
    process.env.BETTER_AUTH_SECRET ??= "local-test-secret-0123456789abcdef0123456789";
    const { auth } = await import("@/lib/auth");
    const { requireAdminSession } = await import("@/lib/authz");
    const usersRoute = await import("@/app/api/users/route");
    const tripRoute = await import("@/app/api/trips/[id]/route");
    const watcher = new pg.Client({ connectionString: url });
    await watcher.connect();
    const userRow = async (email: string) =>
      (await watcher.query('SELECT role, "emailVerified", email FROM "User" WHERE email = $1', [email])).rows[0] ?? null;
    const call = (path: string, body: unknown, cookie?: string) =>
      auth.handler(
        new Request(`${base}/api/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: base, ...(cookie ? { cookie } : {}) },
          body: JSON.stringify(body),
        }),
      );
    const cookieOf = (response: Response) =>
      (response.headers.get("set-cookie") ?? "")
        .split(/,(?=\s*[^;,]+=)/)
        .map((c) => c.split(";")[0].trim())
        .filter(Boolean)
        .join("; ");
    /** What the admin surfaces answer for a given cookie (empty = anonymous). */
    const adminSurfaces = async (cookie: string) => {
      requestHeaders.current = new Headers(cookie ? { cookie } : {});
      const guard = await requireAdminSession().then(() => "allowed", (e: { code?: string }) => e.code);
      const users = (await usersRoute.GET()).status;
      // Invalid body on purpose: an admin gets 400 from validation, so nothing is written; others get 401.
      const trip = (await tripRoute.PUT(new Request(`${base}/api/trips/x`, { method: "PUT", body: "{}" }), { params: Promise.resolve({ id: "x" }) })).status;
      return { guard, users, trip };
    };

    const tag = Date.now();
    const emails = { a: `rt129-a-${tag}@example.invalid`, b: `rt129-b-${tag}@example.invalid`, admin: `rt129-admin-${tag}@example.invalid` };
    try {
      // 1. Sign-up cannot choose the role nor mark the e-mail as verified.
      await call("/sign-up/email", { email: emails.a, password: "Probe-password-123", name: "Probe A", role: "ADMIN", emailVerified: true });
      expect(await userRow(emails.a)).toMatchObject({ role: "USER", emailVerified: false });

      // 2. update-user cannot raise the role, verify the e-mail or change the e-mail.
      const userCookie = cookieOf(await call("/sign-up/email", { email: emails.b, password: "Probe-password-123", name: "Probe B" }));
      expect(userCookie).not.toBe("");
      const escalate = await call("/update-user", { role: "ADMIN" }, userCookie);
      expect(escalate.status).not.toBe(200);
      await call("/update-user", { name: "Probe B2", emailVerified: true, email: `other-${tag}@example.invalid` }, userCookie);
      expect(await userRow(emails.b)).toMatchObject({ role: "USER", emailVerified: false, email: emails.b });

      // 3. Anonymous and USER are refused on the admin surfaces.
      expect(await adminSurfaces("")).toEqual({ guard: "UNAUTHENTICATED", users: 401, trip: 401 });
      expect(await adminSurfaces(userCookie)).toEqual({ guard: "FORBIDDEN", users: 401, trip: 401 });

      // 4. A legitimate ADMIN (granted in the database, as in production) keeps access, also after a profile update.
      await call("/sign-up/email", { email: emails.admin, password: "Probe-password-123", name: "Probe Admin" });
      await watcher.query(`UPDATE "User" SET role = 'ADMIN' WHERE email = $1`, [emails.admin]);
      const adminCookie = cookieOf(await call("/sign-in/email", { email: emails.admin, password: "Probe-password-123" }));
      expect(adminCookie).not.toBe("");
      expect(await adminSurfaces(adminCookie)).toEqual({ guard: "allowed", users: 200, trip: 400 });
      await call("/update-user", { name: "Probe Admin 2" }, adminCookie);
      expect((await userRow(emails.admin))?.role).toBe("ADMIN");
      expect((await adminSurfaces(adminCookie)).guard).toBe("allowed");
    } finally {
      await watcher.query('DELETE FROM "User" WHERE email = ANY($1)', [Object.values(emails)]);
      await watcher.end();
    }
  }, 120_000);
});
