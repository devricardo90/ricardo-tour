import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";
import type { AdminActor } from "@/lib/services/booking-payment.service";

/**
 * RT-125 authorization: payment operations exist only behind an authenticated ADMIN action. Anonymous and USER sessions
 * are refused before the service runs, and the service itself refuses any actor that is not ADMIN (defense in depth)
 * before touching the database.
 */
const requireAdminSession = vi.hoisted(() => vi.fn());
const prismaTouched = vi.hoisted(() => vi.fn());
vi.mock("@/lib/authz", () => ({ requireAdminSession }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy({}, { get: () => { prismaTouched(); throw new Error("database must not be reached"); } }),
}));

const actions = await import("@/app/actions/admin-payments");
const service = await import("@/lib/services/booking-payment.service");

const recordInput = { bookingId: "b1", kind: "DEPOSIT", method: "PIX", amountCents: 100, initialStatus: "RECORDED", idempotencyKey: "k".repeat(24) };
const transitionInput = { paymentId: "p1", to: "CONFIRMED", idempotencyKey: "t".repeat(24) };

beforeEach(() => vi.clearAllMocks());

describe("RT-125 admin payment actions refuse non-admins", () => {
  it.each([
    ["anonymous", new DomainError("Nao autenticado", { code: "UNAUTHENTICATED", status: 401 })],
    ["USER", new DomainError("Nao autorizado", { code: "FORBIDDEN", status: 403 })],
  ])("%s: every action is refused and the database is never reached", async (_who, error) => {
    requireAdminSession.mockRejectedValue(error);
    await expect(actions.recordBookingPaymentAction(recordInput)).rejects.toBe(error);
    await expect(actions.transitionBookingPaymentAction(transitionInput)).rejects.toBe(error);
    await expect(actions.getBookingPaymentsAction("b1")).rejects.toBe(error);
    expect(prismaTouched).not.toHaveBeenCalled();
  });

  it("the service refuses a non-ADMIN actor before any database access", async () => {
    for (const actor of [
      { userId: "u1", role: "USER" },
      { userId: "", role: "ADMIN" },
      null,
    ] as unknown as AdminActor[]) {
      await expect(service.recordBookingPayment(actor, recordInput)).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
      await expect(service.transitionBookingPayment(actor, transitionInput)).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
      await expect(service.getBookingPaymentsOverview(actor, "b1")).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    }
    expect(prismaTouched).not.toHaveBeenCalled();
  });

  it("an ADMIN reaches the service as the responsible actor (input still validated first)", async () => {
    requireAdminSession.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    const result = await actions.recordBookingPaymentAction({ ...recordInput, amountCents: 0 });
    expect(result).toMatchObject({ code: "INVALID_PAYMENT_INPUT" });
    expect(prismaTouched).not.toHaveBeenCalled();
  });
});
