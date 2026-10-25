/**
 * RT-125 manual payment lines: kinds, methods, statuses and the only allowed transitions (the same rule is enforced by
 * the database trigger "rt_booking_payment_guard"). A receipt is never confirmed automatically: RECORDED -> CONFIRMED
 * is always a separate ADMIN action.
 */
export const PAYMENT_KINDS = ["DEPOSIT", "BALANCE"] as const;
export const PAYMENT_METHODS = ["PIX", "CARD_TERMINAL", "CASH"] as const;
export const PAYMENT_STATUSES = ["PENDING", "RECORDED", "CONFIRMED", "CANCELED", "REFUNDED"] as const;

export type PaymentKind = (typeof PAYMENT_KINDS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const TRANSITIONS: Readonly<Record<PaymentStatus, readonly PaymentStatus[]>> = {
  PENDING: ["RECORDED", "CANCELED"],
  RECORDED: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["REFUNDED"],
  CANCELED: [],
  REFUNDED: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses that reserve part of the expected amount (a new line cannot push their sum past the expected amount). */
export const ACTIVE_PAYMENT_STATUSES: readonly PaymentStatus[] = ["PENDING", "RECORDED", "CONFIRMED"];

export type PaymentLine = { kind: PaymentKind; status: PaymentStatus; amountCents: number };
export type QuoteAmounts = { totalCents: number; depositCents: number; balanceCents: number };

export type KindSummary = {
  expectedCents: number;
  pendingCents: number;
  recordedCents: number;
  confirmedCents: number;
  refundedCents: number;
  /** Expected minus everything still active (pending + recorded + confirmed): what can still be registered. */
  openCents: number;
};

export type PaymentSummary = {
  deposit: KindSummary;
  balance: KindSummary;
  totalCents: number;
  confirmedCents: number;
  refundedCents: number;
  /** Derived Booking.paymentStatus: only CONFIRMED money counts as paid. */
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";
};

function summarizeKind(expectedCents: number, lines: PaymentLine[]): KindSummary {
  const sum = (status: PaymentStatus) => lines.filter((l) => l.status === status).reduce((acc, l) => acc + l.amountCents, 0);
  const pendingCents = sum("PENDING");
  const recordedCents = sum("RECORDED");
  const confirmedCents = sum("CONFIRMED");
  return {
    expectedCents,
    pendingCents,
    recordedCents,
    confirmedCents,
    refundedCents: sum("REFUNDED"),
    openCents: expectedCents - pendingCents - recordedCents - confirmedCents,
  };
}

export function summarizePayments(quote: QuoteAmounts, lines: PaymentLine[]): PaymentSummary {
  const deposit = summarizeKind(quote.depositCents, lines.filter((l) => l.kind === "DEPOSIT"));
  const balance = summarizeKind(quote.balanceCents, lines.filter((l) => l.kind === "BALANCE"));
  const confirmedCents = deposit.confirmedCents + balance.confirmedCents;
  const refundedCents = deposit.refundedCents + balance.refundedCents;
  const paymentStatus =
    confirmedCents >= quote.totalCents && quote.totalCents > 0
      ? "PAID"
      : confirmedCents > 0
        ? "PARTIAL"
        : refundedCents > 0
          ? "REFUNDED"
          : "UNPAID";
  return { deposit, balance, totalCents: quote.totalCents, confirmedCents, refundedCents, paymentStatus };
}

function passesLuhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * True when free text may carry a card number: a run of 13 to 19 digits (spaces or dashes between digits ignored) that
 * passes the Luhn check. Card data is never stored; a terminal receipt is identified by its NSU / authorization code
 * (short) and a Pix by its end-to-end id (letters + a 20-digit run, so it is not mistaken for a card).
 */
export function looksLikeCardNumber(text: string) {
  const runs = text.replace(/(\d)[ -](?=\d)/g, "$1").match(/\d+/g) ?? [];
  return runs.some((run) => run.length >= 13 && run.length <= 19 && passesLuhn(run));
}
