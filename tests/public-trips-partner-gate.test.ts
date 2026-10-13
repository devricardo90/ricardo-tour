import { describe, expect, it } from "vitest";
import { LAUNCH_TRIP_IDS, evaluatePublicTrip, type GateTrip } from "@/lib/catalog/public-trips";

// RT-100: the public gate must behave EXACTLY as before for the four existing public tours, and may only add a rule that
// hides a PARTNER tour whose partner is not ACTIVE. (The pre-existing gate behaviour is covered by tests/public-trips.test.ts.)
const base = (id: string, extra: Partial<GateTrip> = {}): GateTrip => ({
  id,
  title: { pt: "Passeio panorâmico pelo Rio" },
  description: { pt: "Descrição do passeio panorâmico." },
  city: "Rio de Janeiro",
  location: null,
  priceCents: 1,
  imageUrl: "/images/trips/imagem-pao-de-acucar.jpg",
  isPublished: true,
  ...extra,
});

describe("public gate vs OWN/PARTNER (RT-100)", () => {
  it("the four launch trips stay public whether the row is a legacy shape, UNCLASSIFIED without partner, or carries the new fields", () => {
    expect(LAUNCH_TRIP_IDS).toHaveLength(4);
    for (const id of LAUNCH_TRIP_IDS) {
      expect(evaluatePublicTrip(base(id)).included).toBe(true); // legacy row (no new fields)
      expect(evaluatePublicTrip(base(id, { operationType: "UNCLASSIFIED", partner: null })).included).toBe(true);
    }
  });

  it("an OWN trip is evaluated like before (no extra rule)", () => {
    expect(evaluatePublicTrip(base(LAUNCH_TRIP_IDS[0], { operationType: "OWN", partner: null })).included).toBe(true);
  });

  it("a PARTNER trip is public only while its partner is ACTIVE", () => {
    const id = LAUNCH_TRIP_IDS[0];
    expect(evaluatePublicTrip(base(id, { operationType: "PARTNER", partner: { status: "ACTIVE" } })).included).toBe(true);
    for (const partner of [{ status: "INACTIVE" }, null, undefined] as const) {
      const result = evaluatePublicTrip(base(id, { operationType: "PARTNER", partner }));
      expect(result.included).toBe(false);
      expect(result.reasons).toContain("PARTNER_INACTIVE");
    }
  });

  it("an active partner cannot make a trip public by itself: the launch allowlist and integrity checks still apply", () => {
    const result = evaluatePublicTrip(base("not-in-the-launch-allowlist", { operationType: "PARTNER", partner: { status: "ACTIVE" } }));
    expect(result.included).toBe(false);
    expect(result.reasons).toContain("NOT_APPROVED_FOR_LAUNCH");
  });
});
