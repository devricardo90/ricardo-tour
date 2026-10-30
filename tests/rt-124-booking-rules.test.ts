import { describe, expect, it } from "vitest";
import { canTransition, type BookingStatusValue } from "@/lib/booking/booking-state";
import { getApprovedGroupPriceTable, listApprovedGroupPriceTables } from "@/lib/commerce/price-tables";
import { privateBookingInputSchema } from "@/lib/services/private-booking.service";

describe("RT-124 rules", () => {
  it("only the RT-121 approved tables exist (TOUR-01, TOUR-02, TOUR-03 4 h); any other trip has none (detail in rt-121-payment-policy)", () => {
    expect(listApprovedGroupPriceTables().map((table) => table.id)).toEqual(["TOUR-01", "TOUR-02", "TOUR-03-4H"]);
    for (const tripId of ["cmljo0s1u0000t0zqa0bpd23p", "any-trip"]) expect(getApprovedGroupPriceTable(tripId)).toBeNull();
  });

  it("allows only the structural transitions PENDING -> CONFIRMED/CANCELED and CONFIRMED -> CANCELED", () => {
    const all: BookingStatusValue[] = ["PENDING", "CONFIRMED", "CANCELED"];
    const allowed = all.flatMap((from) => all.filter((to) => canTransition(from, to)).map((to) => `${from}->${to}`));
    expect(allowed).toEqual(["PENDING->CONFIRMED", "PENDING->CANCELED", "CONFIRMED->CANCELED"]);
  });

  it("accepts a well-formed private booking request and refuses unknown shapes", () => {
    const valid = {
      tripId: "trip-1",
      scheduleId: "schedule-1",
      party: { fullFare: 2, infants: 1 },
      contact: { fullName: "Maria Silva", phone: "+55 (21) 99999-0000", language: "es" },
    };
    expect(privateBookingInputSchema.safeParse(valid).success).toBe(true);
    expect(privateBookingInputSchema.safeParse({ ...valid, party: { fullFare: 2, infants: -1 } }).success).toBe(false);
    expect(privateBookingInputSchema.safeParse({ ...valid, contact: { ...valid.contact, fullName: " " } }).success).toBe(false);
    expect(privateBookingInputSchema.safeParse({ ...valid, contact: { ...valid.contact, notes: "x".repeat(1001) } }).success).toBe(false);
  });
});
