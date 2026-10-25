import { afterEach, describe, expect, it, vi } from "vitest";

const signOut = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }));

describe("signOutAndLeave", () => {
  const assign = vi.fn();
  afterEach(() => {
    vi.unstubAllGlobals();
    signOut.mockReset();
    assign.mockReset();
  });

  it("signs out through better-auth, then leaves to a same-site path only", async () => {
    vi.stubGlobal("window", { location: { assign } });
    const { signOutAndLeave } = await import("@/lib/sign-out");
    signOut.mockResolvedValue({ data: { success: true }, error: null });

    expect(await signOutAndLeave("pt")).toBe(true);
    expect(assign).toHaveBeenLastCalledWith("/pt");
    expect(await signOutAndLeave("en", "/en/login")).toBe(true);
    expect(assign).toHaveBeenLastCalledWith("/en/login");
    for (const target of ["https://evil.example", "javascript:alert(1)", "//evil.example"]) {
      await signOutAndLeave("es", target);
      expect(assign).toHaveBeenLastCalledWith("/es");
    }
    expect(signOut).toHaveBeenCalledTimes(5);
  });

  it("stays on the page and reports failure when the server does not confirm", async () => {
    vi.stubGlobal("window", { location: { assign } });
    const { signOutAndLeave } = await import("@/lib/sign-out");
    signOut.mockResolvedValue({ data: null, error: { status: 403, message: "Invalid origin" } });
    expect(await signOutAndLeave("pt")).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });
});

const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders.current }));

const url = process.env.S11_LOCAL_DB_URL;

/**
 * LIVE block, SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (literal loopback URL whose database
 * carries rt.environment = local-isolated; anything else is refused before any write). Real auth handler, production-like
 * BETTER_AUTH_URL, browser-like requests from the official domain.
 */
describe.skipIf(!url)("sign-in, sign-out and sign-in again (local isolated database only)", () => {
  it("get-session never exposes the token; sign-out deletes the session; the old cookie stops working; a new sign-in works; ADMIN keeps its role", async () => {
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
    process.env.BETTER_AUTH_URL = "https://rick-travel.vercel.app";
    process.env.BETTER_AUTH_SECRET ??= "local-test-secret-0123456789abcdef0123456789";
    const { auth } = await import("@/lib/auth");
    const { requireAdminSession } = await import("@/lib/authz");
    const sessionRoute = await import("@/app/api/auth/get-session/route");
    const watcher = new pg.Client({ connectionString: url });
    await watcher.connect();
    const origin = "https://www.ricardotour.com";
    const call = (path: string, body: unknown, cookie: string) =>
      auth.handler(
        new Request(`${origin}/api/auth${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", origin, cookie },
          body: JSON.stringify(body),
        }),
      );
    const cookieOf = (response: Response) =>
      (response.headers.get("set-cookie") ?? "")
        .split(/,(?=\s*[^;,]+=)/)
        .map((c) => c.split(";")[0].trim())
        .filter((c) => c && !/=$/.test(c))
        .join("; ");
    const readSession = async (cookie: string) => {
      requestHeaders.current = new Headers({ cookie });
      const response = await sessionRoute.GET();
      return { text: await response.clone().text(), body: (await response.json()) as { session: { user: Record<string, unknown> } | null } };
    };
    const sessionsOf = async (email: string) =>
      Number((await watcher.query('SELECT count(*) FROM "Session" s JOIN "User" u ON u.id = s."userId" WHERE u.email = $1', [email])).rows[0].count);

    const email = `logout-${Date.now()}@example.invalid`;
    const password = "Probe-password-123";
    try {
      await call("/sign-up/email", { email, password, name: "Probe Logout" }, "NEXT_LOCALE=pt");
      await watcher.query(`UPDATE "User" SET role = 'ADMIN' WHERE email = $1`, [email]); // granted in the database, as in production
      const first = cookieOf(await call("/sign-in/email", { email, password }, "NEXT_LOCALE=pt"));
      expect(first).not.toBe("");

      // Signed in: the header endpoint shows only id/name/role, never the token or session internals.
      const signedIn = await readSession(`NEXT_LOCALE=pt; ${first}`);
      expect(signedIn.body.session?.user).toMatchObject({ name: "Probe Logout", role: "ADMIN" });
      expect(Object.keys(signedIn.body.session?.user ?? {}).sort()).toEqual(["id", "name", "role"]);
      expect(signedIn.text).not.toMatch(/token|expiresAt|ipAddress|userAgent|@example\.invalid/);
      requestHeaders.current = new Headers({ cookie: `NEXT_LOCALE=pt; ${first}` });
      await expect(requireAdminSession()).resolves.toBeTruthy();
      const before = await sessionsOf(email);

      // Sign-out (official endpoint, from the official domain): this session row is deleted and the cookie cleared.
      const out = await call("/sign-out", {}, `NEXT_LOCALE=pt; ${first}`);
      expect(out.status).toBe(200);
      expect(out.headers.get("set-cookie") ?? "").toMatch(/session_token=;|Max-Age=0/i);
      expect(await sessionsOf(email)).toBe(before - 1);

      // The old cookie no longer opens anything.
      expect((await readSession(`NEXT_LOCALE=pt; ${first}`)).body.session).toBeNull();
      requestHeaders.current = new Headers({ cookie: `NEXT_LOCALE=pt; ${first}` });
      await expect(requireAdminSession()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });

      // A sign-out from another site is refused (the session survives).
      const again = cookieOf(await call("/sign-in/email", { email, password }, "NEXT_LOCALE=pt"));
      const foreign = await auth.handler(
        new Request(`${origin}/api/auth/sign-out`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.example", cookie: again }, body: "{}" }),
      );
      expect(foreign.status).toBe(403);

      // Signing in again works and the role is unchanged.
      const signedAgain = await readSession(`NEXT_LOCALE=pt; ${again}`);
      expect(signedAgain.body.session?.user).toMatchObject({ role: "ADMIN" });
      expect((await watcher.query('SELECT role FROM "User" WHERE email = $1', [email])).rows[0].role).toBe("ADMIN");
    } finally {
      await watcher.query('DELETE FROM "User" WHERE email = $1', [email]);
      await watcher.end();
    }
  }, 60_000);
});
