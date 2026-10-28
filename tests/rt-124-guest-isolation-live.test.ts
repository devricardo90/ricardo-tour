import { describe, expect, it, vi } from "vitest";

/**
 * RT-124 isolation of the bookings requested without an account (28/10/2026). Every such booking belongs to the site's
 * request account (GUEST_REQUEST_OWNER_EMAIL), which must never be an account someone can sign in to: whoever held it
 * would see the requests of every customer in /reservas and could cancel them. Found locally: the public sign-up
 * accepted that e-mail, and the request service reused the existing row. Fixed in two layers, both tested here:
 *  - sign-up refuses every address of the reserved system domain (@ricardotour.invalid);
 *  - the request service refuses a request owner that has a sign-in credential, a session or another role.
 *
 * SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (RT-104 guard, operation "write", runs first).
 */
const url = process.env.S11_LOCAL_DB_URL;

vi.mock("@/lib/catalog/public-trips", () => ({ getPublicTripById: async (id: string) => ({ id }) }));

describe.skipIf(!url)("RT-124 guest request isolation (local isolated database only)", () => {
  it("the reserved system domain cannot be registered, and a request owner with credentials is refused before any booking", async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "rt-124 guest isolation live test", url, env: { DATABASE_URL: url } });
    vi.resetModules();
    process.env.DATABASE_URL = url;
    process.env.BETTER_AUTH_SECRET ??= "local-test-secret-0123456789abcdef0123456789";
    const { prisma } = await import("@/lib/prisma");
    const { auth } = await import("@/lib/auth");
    const requests = await import("@/lib/services/private-booking-request.service");

    const tag = `guest-iso-${Date.now()}`;
    const signUp = (email: string) =>
      auth.handler(
        new Request("https://www.ricardotour.com/api/auth/sign-up/email", {
          method: "POST",
          headers: { "content-type": "application/json", origin: "https://www.ricardotour.com", cookie: "NEXT_LOCALE=pt" },
          body: JSON.stringify({ email, password: "Probe-password-123", name: "Probe" }),
        }),
      );
    const reserved = [`${tag}@ricardotour.invalid`, `${tag}@RicardoTour.Invalid`];
    const fakeOwner = `${tag}-owner@ricardotour.invalid`;
    try {
      // 1. Sign-up of any reserved-domain address is refused and writes nothing; a normal address still works.
      for (const email of reserved) {
        expect((await signUp(email)).status).not.toBe(200);
        expect(await prisma.user.count({ where: { email: email.toLowerCase() } })).toBe(0);
      }
      const normal = await signUp(`${tag}@example.invalid`);
      expect(normal.status).toBe(200);
      // The real request account address is refused too (whether or not its row already exists).
      const real = await signUp(requests.GUEST_REQUEST_OWNER_EMAIL);
      expect(real.status).not.toBe(200);
      expect(await prisma.account.count({ where: { user: { email: requests.GUEST_REQUEST_OWNER_EMAIL } } })).toBe(0);

      // 2. A request owner that somehow holds a credential (the state an attacker reached before the fix) is refused.
      const owner = await prisma.user.create({ data: { email: fakeOwner, name: "Conta tomada (teste)" } });
      expect(await requests.getGuestRequestOwnerId(fakeOwner)).toBe(owner.id); // clean system account: accepted
      await prisma.account.create({ data: { userId: owner.id, accountId: owner.id, providerId: "credential", password: "x" } });
      await expect(requests.getGuestRequestOwnerId(fakeOwner)).rejects.toMatchObject({ code: "GUEST_OWNER_UNSAFE" });
      await prisma.account.deleteMany({ where: { userId: owner.id } });
      await prisma.session.create({ data: { userId: owner.id, token: `${tag}-token`, expiresAt: new Date(Date.now() + 3_600_000) } });
      await expect(requests.getGuestRequestOwnerId(fakeOwner)).rejects.toMatchObject({ code: "GUEST_OWNER_UNSAFE" });
      await prisma.session.deleteMany({ where: { userId: owner.id } });
      await prisma.user.update({ where: { id: owner.id }, data: { role: "ADMIN" } });
      await expect(requests.getGuestRequestOwnerId(fakeOwner)).rejects.toMatchObject({ code: "GUEST_OWNER_UNSAFE" });
    } finally {
      await prisma.user.deleteMany({ where: { email: { in: [...reserved.map((e) => e.toLowerCase()), `${tag}@example.invalid`, fakeOwner] } } });
      await prisma.$disconnect();
    }
  }, 120_000);
});
