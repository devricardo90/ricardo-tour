import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";

const createPublicBookingRequest = vi.fn();
const sendContactNotification = vi.fn();
const isFormSubmissionLimited = vi.fn();

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/rate-limit/server", () => ({ isFormSubmissionLimited: (...a: unknown[]) => isFormSubmissionLimited(...a) }));
vi.mock("@/lib/services/tour-request-notification", () => ({ sendContactNotification: (...a: unknown[]) => sendContactNotification(...a) }));
vi.mock("@/lib/services/private-booking-request.service", () => ({ createPublicBookingRequest: (...a: unknown[]) => createPublicBookingRequest(...a) }));
vi.mock("@/lib/observability/report", () => ({ reportServerError: vi.fn() }));

const TOUR_01 = "cmlhxkpy9000028zq27rhytew";
const TOUR_02 = "cmli1a6im000034zqqzc9sppb";
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";
const TOUR_04 = "cmljo0s1u0000t0zqa0bpd23p";
const root = path.resolve(__dirname, "..");

const plusDays = (n: number) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(Date.parse(`${today}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
};

function form(fields: Record<string, string>) {
  const data = new FormData();
  const base = { tripId: TOUR_03, mode: "lab", locale: "pt", name: "Cliente Teste", email: "cliente@example.invalid", phone: "+55 21 99999-0000", date: plusDays(7), party: "3", pickup: "Hotel (teste)", notes: "" };
  for (const [k, v] of Object.entries({ ...base, ...fields })) data.set(k, v);
  return data;
}

describe("RT-124 public request: which tours accept it and the slot rules", () => {
  it("only TOUR-03 (approved 4 h table) accepts a request; TOUR-01, TOUR-02 and TOUR-04 never do", async () => {
    const { publicRequestTable } = await import("@/lib/booking/public-request");
    expect(publicRequestTable(TOUR_03, "lab", { NODE_ENV: "development" })?.id).toBe("TOUR-03-4H");
    for (const id of [TOUR_01, TOUR_02, TOUR_04]) {
      expect(publicRequestTable(id, "lab", { NODE_ENV: "development" })).toBeNull();
      expect(publicRequestTable(id, "public")).toBeNull();
    }
  });

  it("publicly the request needs the Owner's price-publication authorization (still empty); the lab never runs on deployments", async () => {
    const { publicRequestTable } = await import("@/lib/booking/public-request");
    expect(publicRequestTable(TOUR_03, "public")).toBeNull();
    expect(publicRequestTable(TOUR_03, "lab", { NODE_ENV: "production" })).toBeNull();
    expect(publicRequestTable(TOUR_03, "lab", { NODE_ENV: "production", VERCEL_ENV: "preview" })).toBeNull();
  });

  it("the slot is 09:00 in Rio on the requested day (PROVISIONAL until RT-123) and invalid days are refused", async () => {
    const { requestSlotStart, isRequestDateAllowed } = await import("@/lib/booking/public-request");
    expect(requestSlotStart(TOUR_03, "2026-11-17")?.toISOString()).toBe("2026-11-17T12:00:00.000Z");
    expect(requestSlotStart(TOUR_03, "2026-02-30")).toBeNull();
    expect(requestSlotStart(TOUR_01, "2026-11-17")).toBeNull();
    expect(isRequestDateAllowed("2026-11-10", "2026-11-10")).toBe(false); // today
    expect(isRequestDateAllowed("2026-11-11", "2026-11-10")).toBe(true); // tomorrow
    expect(isRequestDateAllowed("2027-11-11", "2026-11-10")).toBe(false); // beyond 365 days
    expect(isRequestDateAllowed("2026-11-09", "2026-11-10")).toBe(false); // past
  });

  it("Owner 28/10/2026: less than 24 hours before the start (09:00 in Rio) is on request, not an online request", async () => {
    const { isRequestLeadTimeAllowed } = await import("@/lib/booking/public-request");
    // 17 Nov 09:00 in Rio = 12:00 UTC.
    expect(isRequestLeadTimeAllowed(TOUR_03, "2026-11-17", new Date("2026-11-16T12:00:00Z"))).toBe(true); // exactly 24 h
    expect(isRequestLeadTimeAllowed(TOUR_03, "2026-11-17", new Date("2026-11-16T12:00:01Z"))).toBe(false); // 23:59:59
    expect(isRequestLeadTimeAllowed(TOUR_03, "2026-11-17", new Date("2026-11-16T21:00:00Z"))).toBe(false); // 18:00 the day before
    expect(isRequestLeadTimeAllowed(TOUR_01, "2026-11-17", new Date("2026-11-01T12:00:00Z"))).toBe(false); // no online request
  });
});

describe("RT-124 public request: server action", () => {
  beforeEach(() => {
    vi.stubEnv("REBUILD_LAB_ENABLED", "true");
    createPublicBookingRequest.mockReset();
    sendContactNotification.mockReset();
    isFormSubmissionLimited.mockReset().mockResolvedValue(false);
  });

  it("creates the request with the validated data, adults only, and tells the team without personal data in the e-mail body", async () => {
    createPublicBookingRequest.mockResolvedValue({ id: "cmabcdefgh12345678", quote: { totalCents: 90_000, depositCents: 27_000, balanceCents: 63_000, priceTableId: "TOUR-03-4H", priceTableVersion: "2026-10-26" } });
    const { submitPrivateBookingRequest } = await import("@/app/actions/private-booking-request");
    const result = await submitPrivateBookingRequest(form({ email: "Cliente@Example.Invalid" }));
    expect(result).toEqual({ ok: true, reference: "12345678", totalCents: 90_000, depositCents: 27_000, balanceCents: 63_000 });
    expect(createPublicBookingRequest).toHaveBeenCalledWith({
      tripId: TOUR_03,
      date: plusDays(7),
      fullFare: 3,
      contact: { fullName: "Cliente Teste", email: "cliente@example.invalid", phone: "+55 21 99999-0000", language: "pt", pickupAddress: "Hotel (teste)", notes: undefined },
    });
    const mail = sendContactNotification.mock.calls[0][0];
    expect(mail.message).toContain("R$");
    expect(mail.message).not.toContain("99999");
    expect(mail.message).not.toContain("Hotel (teste)");
  });

  it("refuses invalid fields without touching the database", async () => {
    const { submitPrivateBookingRequest } = await import("@/app/actions/private-booking-request");
    const result = await submitPrivateBookingRequest(form({ name: "", email: "x", phone: "12", date: plusDays(0), party: "5" }));
    expect(result).toEqual({ ok: false, reason: "invalid", errors: { name: "required", email: "invalid", phone: "invalid", date: "date_not_allowed", party: "party_invalid" } });
    expect(createPublicBookingRequest).not.toHaveBeenCalled();
  });

  it("answers a taken day and this customer's earlier request the same way (nothing leaks)", async () => {
    const { submitPrivateBookingRequest } = await import("@/app/actions/private-booking-request");
    for (const code of ["SCHEDULE_UNAVAILABLE", "DUPLICATE_BOOKING"]) {
      createPublicBookingRequest.mockRejectedValueOnce(new DomainError("x", { code, status: 409 }));
      expect(await submitPrivateBookingRequest(form({}))).toEqual({ ok: false, reason: "date_unavailable" });
    }
  });

  it("closed tours, the public page without price authorization, the honeypot and the rate limit never create anything", async () => {
    const { submitPrivateBookingRequest } = await import("@/app/actions/private-booking-request");
    expect(await submitPrivateBookingRequest(form({ tripId: TOUR_01 }))).toEqual({ ok: false, reason: "not_available" });
    expect(await submitPrivateBookingRequest(form({ tripId: TOUR_04 }))).toEqual({ ok: false, reason: "not_available" });
    expect(await submitPrivateBookingRequest(form({ mode: "public" }))).toEqual({ ok: false, reason: "not_available" });
    expect(await submitPrivateBookingRequest(form({ company_website: "spam" }))).toEqual({ ok: false, reason: "unavailable" });
    isFormSubmissionLimited.mockResolvedValueOnce(true);
    expect(await submitPrivateBookingRequest(form({}))).toEqual({ ok: false, reason: "rate_limited" });
    expect(createPublicBookingRequest).not.toHaveBeenCalled();
  });
});

describe("RT-124 public request: wiring", () => {
  it("the approved tour page shows the request only through the price-publication gate; the lab uses the lab gate", () => {
    const page = readFileSync(path.join(root, "app/[locale]/(site)/tours/[id]/page.tsx"), "utf8");
    expect(page).toMatch(/publicRequestTable\(id, "public"\)/);
    expect(page).not.toMatch(/mode="lab"/);
    const lab = readFileSync(path.join(root, "app/[locale]/rebuild-lab/tour-content-preview/[id]/page.tsx"), "utf8");
    expect(lab).toMatch(/publicRequestTable\(id, "lab"\)/);
  });

  it("the request owner is the site's request account: no account is created per customer e-mail", () => {
    const service = readFileSync(path.join(root, "lib/services/private-booking-request.service.ts"), "utf8");
    expect(service).toMatch(/GUEST_REQUEST_OWNER_EMAIL = "solicitacoes-site@ricardotour\.invalid"/);
    expect(service).not.toMatch(/user\.(create|upsert)\(\{[^)]*contact\.email/);
  });
});
