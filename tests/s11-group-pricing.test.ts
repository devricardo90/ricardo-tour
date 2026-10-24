import { describe, expect, it } from "vitest";
import { PricingError, quoteGroupPrice, splitDeposit, validateGroupPriceTable, type GroupPriceTable } from "@/lib/commerce/group-pricing";
import { calculateCentroQuote, CENTRO_APPROVED_PRICING } from "@/lib/catalog/drafts/centro-historico-commercial";

// FICTITIOUS table: the module never holds a real price; real tables are supplied only after Owner approval.
const TABLE: GroupPriceTable = { currency: "BRL", groupTotalCents: { 1: 100000, 2: 150000, 3: 180000, 4: 200000 } };

describe("Sprint 11: group price (closed price per group, infant rule)", () => {
  it("returns the group total for full-fare parties", () => {
    expect(quoteGroupPrice(TABLE, { fullFare: 1, infants: 0 }).totalCents).toBe(100000);
    expect(quoteGroupPrice(TABLE, { fullFare: 4, infants: 0 })).toMatchObject({ participants: 4, perPersonCents: 50000, totalCents: 200000 });
  });

  it("infants count for the band and pay 50% of P(N): TOTAL = P(N) × (A + 0,5 × B)", () => {
    // 2 adults + 1 infant: band 3, P(3) = 60000; 60000 × 2.5 = 150000.
    expect(quoteGroupPrice(TABLE, { fullFare: 2, infants: 1 }).totalCents).toBe(150000);
    // 1 adult + 1 infant: band 2, P(2) = 75000; 75000 × 1.5 = 112500.
    expect(quoteGroupPrice(TABLE, { fullFare: 1, infants: 1 }).totalCents).toBe(112500);
  });

  it("rounds once, on the total, to whole cents", () => {
    const odd: GroupPriceTable = { currency: "BRL", groupTotalCents: { 1: 1000, 2: 1001, 3: 1001 } };
    // band 3, P(3) = 333.67; × 2.5 = 834.17 → 834.
    expect(quoteGroupPrice(odd, { fullFare: 2, infants: 1 }).totalCents).toBe(834);
    expect(Number.isInteger(quoteGroupPrice(odd, { fullFare: 1, infants: 2 }).totalCents)).toBe(true);
  });

  it("requires a full-fare participant and respects the largest band", () => {
    expect(() => quoteGroupPrice(TABLE, { fullFare: 0, infants: 2 })).toThrow(PricingError);
    expect(() => quoteGroupPrice(TABLE, { fullFare: 4, infants: 1 })).toThrowError(/Maximo de 4/);
    expect(() => quoteGroupPrice(TABLE, { fullFare: 1.5, infants: 0 })).toThrow(PricingError);
    expect(() => quoteGroupPrice(TABLE, { fullFare: -1, infants: 0 })).toThrow(PricingError);
  });

  it("refuses incomplete or invalid tables (no band may be assumed)", () => {
    expect(() => validateGroupPriceTable({ currency: "BRL", groupTotalCents: { 1: 100, 3: 300 } })).toThrow(/contiguas/);
    expect(() => validateGroupPriceTable({ currency: "BRL", groupTotalCents: { 1: 0 } })).toThrow(PricingError);
    expect(() => validateGroupPriceTable({ currency: "BRL", groupTotalCents: { 1: 10.5 } })).toThrow(PricingError);
    expect(() => validateGroupPriceTable({ currency: "USD", groupTotalCents: { 1: 100 } } as unknown as GroupPriceTable)).toThrow(PricingError);
    expect(() => validateGroupPriceTable({ currency: "BRL", groupTotalCents: {} })).toThrow(PricingError);
  });

  it("agrees with the existing TOUR-03 review calculator for every 4h/6h party without extension", () => {
    for (const duration of CENTRO_APPROVED_PRICING.durations) {
      const table: GroupPriceTable = { currency: "BRL", groupTotalCents: Object.fromEntries(duration.prices.map((p) => [p.participants, p.totalCents])) };
      for (let n = 1; n <= 4; n++) {
        for (let infants = 0; infants < n; infants++) {
          const ages = [...Array(n - infants).fill(30), ...Array(infants).fill(1)];
          const expected = calculateCentroQuote({ durationHours: duration.hours, travelerAges: ages });
          expect(quoteGroupPrice(table, { fullFare: n - infants, infants }).totalCents, `${duration.hours}h ${n}/${infants}`).toBe(expected.totalCents);
        }
      }
    }
  });
});

describe("Sprint 11: deposit and balance (CR-18 formula)", () => {
  it("without prepaid tickets: 30% at booking, 70% before the tour", () => {
    expect(splitDeposit(200000)).toEqual({ totalCents: 200000, prepaidTicketsCents: 0, depositCents: 60000, balanceCents: 140000, depositBasisPoints: 3000 });
  });

  it("with prepaid tickets: deposit = I + 30% × (T − I); tickets are never charged twice", () => {
    const split = splitDeposit(200000, 50000);
    expect(split.depositCents).toBe(50000 + 45000);
    expect(split.balanceCents).toBe(105000);
    expect(split.depositCents + split.balanceCents).toBe(200000);
  });

  it("deposit + balance always equals the total, for any rounding", () => {
    for (const total of [1, 3, 999, 100001, 123457]) {
      for (const tickets of [0, 1, Math.floor(total / 3)]) {
        const split = splitDeposit(total, tickets);
        expect(split.depositCents + split.balanceCents).toBe(total);
        expect(split.depositCents).toBeGreaterThanOrEqual(tickets);
      }
    }
  });

  it("keeps the percentage configurable and validated", () => {
    expect(splitDeposit(100000, 0, 5000).depositCents).toBe(50000);
    expect(() => splitDeposit(100000, 0, 10001)).toThrow(PricingError);
    expect(() => splitDeposit(100000, 100001)).toThrow(PricingError);
    expect(() => splitDeposit(0)).toThrow(PricingError);
    expect(() => splitDeposit(100.5)).toThrow(PricingError);
  });

  it("matches the TOUR-03 review calculator deposit (30% of the total, no tickets)", () => {
    const quote = calculateCentroQuote({ durationHours: 4, travelerAges: [30, 30, 1] });
    const split = splitDeposit(quote.totalCents);
    expect(split.depositCents).toBe(quote.depositCents);
    expect(split.balanceCents).toBe(quote.balanceCents);
  });
});
