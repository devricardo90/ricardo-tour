import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * RT-129 booking API hardening: same-origin browser writes only, bounded write rate per account and per client, and
 * another account's booking answers exactly like a missing one (no id probing). The real shared limiter runs with its
 * per-instance store (no Upstash configured in tests).
 */
const requireSession = vi.hoisted(() => vi.fn());
const service = vi.hoisted(() => ({
  createBookingForUser: vi.fn(),
  listBookingsForUser: vi.fn(),
  cancelBookingForUser: vi.fn(),
}));
vi.mock("@/lib/authz", () => ({ requireSession }));
vi.mock("@/lib/services/booking.service", () => service);

const { POST } = await import("@/app/api/bookings/route");
const { PATCH } = await import("@/app/api/bookings/[id]/route");
const { resetLimitersForTests, BOOKING_WRITE_LIMITS } = await import("@/lib/rate-limit/server");

const SITE = "www.ricardotour.com";
let ip = 0;
const headersFor = (overrides: Record<string, string> = {}, clientIp = `203.0.113.${++ip % 250}`) => ({
  "content-type": "application/json",
  host: SITE,
  origin: `https://${SITE}`,
  "sec-fetch-site": "same-origin",
  "x-forwarded-for": clientIp,
  ...overrides,
});
const create = (headers: Record<string, string>) =>
  POST(new Request(`https://${SITE}/api/bookings`, { method: "POST", headers, body: JSON.stringify({ tripId: "trip-1", guestCount: 2 }) }));
const cancel = (headers: Record<string, string>, id = "booking-1") =>
  PATCH(new Request(`https://${SITE}/api/bookings/${id}`, { method: "PATCH", headers }), { params: Promise.resolve({ id }) });

beforeEach(() => {
  resetLimitersForTests();
  vi.clearAllMocks();
  requireSession.mockResolvedValue({ user: { id: `user-${Math.random()}` } });
  service.createBookingForUser.mockResolvedValue({ id: "booking-1" });
  service.cancelBookingForUser.mockResolvedValue({ id: "booking-1", status: "CANCELED" });
});

describe("booking writes accept same-origin browser requests only", () => {
  it.each([
    ["foreign Origin", { origin: "https://evil.example" }],
    ["cross-site fetch metadata", { "sec-fetch-site": "cross-site" }],
    ["same-site (other subdomain)", { "sec-fetch-site": "same-site" }],
    ["malformed Origin", { origin: "not a url" }],
  ])("refuses %s before touching the session or the service", async (_label, overrides) => {
    for (const response of [await create(headersFor(overrides)), await cancel(headersFor(overrides))]) {
      expect(response.status).toBe(403);
    }
    expect(requireSession).not.toHaveBeenCalled();
    expect(service.createBookingForUser).not.toHaveBeenCalled();
    expect(service.cancelBookingForUser).not.toHaveBeenCalled();
  });

  it("accepts the official site", async () => {
    expect((await create(headersFor())).status).toBe(201);
    expect((await cancel(headersFor())).status).toBe(200);
  });
});

describe("booking writes are rate limited per account and per client", () => {
  it("one account: the request after the limit gets 429 and never reaches the service", async () => {
    requireSession.mockResolvedValue({ user: { id: "user-flood" } });
    const { limit } = BOOKING_WRITE_LIMITS.create;
    for (let i = 0; i < limit; i++) expect((await create(headersFor())).status).toBe(201); // a different address each time
    const blocked = await create(headersFor());
    expect(blocked.status).toBe(429);
    expect(service.createBookingForUser).toHaveBeenCalledTimes(limit);
  });

  it("one client address: many accounts are limited too", async () => {
    const { limit } = BOOKING_WRITE_LIMITS.cancel;
    for (let i = 0; i < limit; i++) {
      requireSession.mockResolvedValueOnce({ user: { id: `user-${i}` } });
      expect((await cancel(headersFor({}, "198.51.100.7"))).status).toBe(200);
    }
    requireSession.mockResolvedValueOnce({ user: { id: "user-new" } });
    expect((await cancel(headersFor({}, "198.51.100.7"))).status).toBe(429);
  });

  it("anonymous writes still answer 401 (the limiter counts only signed-in attempts)", async () => {
    const { DomainError } = await import("@/lib/errors/domain-error");
    requireSession.mockRejectedValue(new DomainError("Nao autenticado", { code: "UNAUTHENTICATED", status: 401 }));
    expect((await create(headersFor())).status).toBe(401);
  });
});
