import { describe, expect, it } from "vitest";
import { canTransition, type BookingStatusValue } from "@/lib/booking/booking-state";
import { getApprovedGroupPriceTable, listApprovedGroupPriceTables } from "@/lib/commerce/price-tables";
import { privateBookingInputSchema } from "@/lib/services/private-booking.service";

describe("RT-124 rules", () => {
  it("no group price table is approved yet (RT-121 pending): the engine can sell nothing", () => {
    expect(listApprovedGroupPriceTables()).toHaveLength(0);
    for (const tripId of ["cmlibniq40000z4zqkbujnutt", "any-trip"]) expect(getApprovedGroupPriceTable(tripId)).toBeNull();
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
