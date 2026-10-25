import { describe, expect, it } from "vitest";
import { parseBrlToCents } from "@/lib/commerce/money";
import {
  PAYMENT_STATUSES,
  canTransitionPayment,
  looksLikeCardNumber,
  summarizePayments,
  type PaymentStatus,
} from "@/lib/payments/payment-state";
import { recordPaymentInputSchema } from "@/lib/services/booking-payment.service";

describe("RT-125 money input", () => {
  it.each([
    ["350", 35_000],
    ["350,5", 35_050],
    ["350,50", 35_050],
    ["1.234,56", 123_456],
    ["R$ 1.234,56", 123_456],
    ["0,01", 1],
  ])("parses %s as %i cents", (input, cents) => expect(parseBrlToCents(input)).toBe(cents));

  it.each(["", "0", "0,00", "-10", "1,234.56", "10,555", "1e3", "12.34", "abc", "1.23,45", "99999999999"])("refuses %j", (input) =>
    expect(parseBrlToCents(input)).toBeNull(),
  );
});

describe("RT-125 card data is never accepted", () => {
  it.each(["4111 1111 1111 1111", "4111-1111-1111-1111", "cartao 5555555555554444 ok"])("flags %j", (text) =>
    expect(looksLikeCardNumber(text)).toBe(true),
  );
  it.each(["NSU 123456", "AUT 0A1B2C", "E00000000202610251530abcdefghijk", "recibo 2026-10-25", "1234567890123"])("does not flag %j", (text) =>
    expect(looksLikeCardNumber(text)).toBe(false),
  );

  it("the record schema refuses a card number in the reference or the note", () => {
    const base = { bookingId: "b1", kind: "DEPOSIT", method: "CARD_TERMINAL", amountCents: 100, initialStatus: "RECORDED", idempotencyKey: "k".repeat(20) };
    expect(recordPaymentInputSchema.safeParse({ ...base, reference: "NSU 123456" }).success).toBe(true);
    expect(recordPaymentInputSchema.safeParse({ ...base, reference: "4111111111111111" }).success).toBe(false);
    expect(recordPaymentInputSchema.safeParse({ ...base, note: "cartao 4111 1111 1111 1111" }).success).toBe(false);
  });

  it("refuses fractional, zero, negative and oversized amounts and unknown methods", () => {
    const base = { bookingId: "b1", kind: "DEPOSIT", method: "PIX", initialStatus: "RECORDED", idempotencyKey: "k".repeat(20) };
    for (const amountCents of [0.5, 0, -1, 2_147_483_648, Number.NaN]) {
      expect(recordPaymentInputSchema.safeParse({ ...base, amountCents }).success).toBe(false);
    }
    expect(recordPaymentInputSchema.safeParse({ ...base, amountCents: 100, method: "BOLETO" }).success).toBe(false);
    expect(recordPaymentInputSchema.safeParse({ ...base, amountCents: 100, initialStatus: "CONFIRMED" }).success).toBe(false);
  });
});

describe("RT-125 payment states", () => {
  it("allows only PENDING->RECORDED/CANCELED, RECORDED->CONFIRMED/CANCELED, CONFIRMED->REFUNDED", () => {
    const allowed = PAYMENT_STATUSES.flatMap((from) =>
      PAYMENT_STATUSES.filter((to) => canTransitionPayment(from as PaymentStatus, to as PaymentStatus)).map((to) => `${from}->${to}`),
    );
    expect(allowed).toEqual(["PENDING->RECORDED", "PENDING->CANCELED", "RECORDED->CONFIRMED", "RECORDED->CANCELED", "CONFIRMED->REFUNDED"]);
  });

  it("only CONFIRMED money counts as paid; pending/recorded reserve the open amount", () => {
    const quote = { totalCents: 10_000, depositCents: 3_000, balanceCents: 7_000 };
    expect(summarizePayments(quote, []).paymentStatus).toBe("UNPAID");
    const recorded = summarizePayments(quote, [{ kind: "DEPOSIT", status: "RECORDED", amountCents: 3_000 }]);
    expect(recorded).toMatchObject({ paymentStatus: "UNPAID", deposit: { openCents: 0, recordedCents: 3_000 } });
    const partial = summarizePayments(quote, [{ kind: "DEPOSIT", status: "CONFIRMED", amountCents: 3_000 }]);
    expect(partial).toMatchObject({ paymentStatus: "PARTIAL", confirmedCents: 3_000, balance: { openCents: 7_000 } });
    const paid = summarizePayments(quote, [
      { kind: "DEPOSIT", status: "CONFIRMED", amountCents: 3_000 },
      { kind: "BALANCE", status: "CONFIRMED", amountCents: 7_000 },
    ]);
    expect(paid.paymentStatus).toBe("PAID");
    const refunded = summarizePayments(quote, [
      { kind: "DEPOSIT", status: "REFUNDED", amountCents: 3_000 },
      { kind: "DEPOSIT", status: "CANCELED", amountCents: 3_000 },
    ]);
    expect(refunded).toMatchObject({ paymentStatus: "REFUNDED", deposit: { openCents: 3_000, refundedCents: 3_000 } });
  });
});
