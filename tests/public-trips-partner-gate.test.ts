import { describe, expect, it } from "vitest";
import { LAUNCH_TRIP_IDS, evaluatePublicTrip, type GateTrip } from "@/lib/catalog/public-trips";

// RT-100: the public gate must behave EXACTLY as before for the four existing public tours, and may only ADD rules that
// hide a PARTNER tour: partner not ACTIVE, or the real operator not identified in PT, EN and ES (Owner decision
// 2026-10-13). (The pre-existing gate behaviour is covered by tests/public-trips.test.ts.)
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
const FULL_LABEL = { pt: "Operado por Exemplo", en: "Operated by Example", es: "Operado por Ejemplo" };
const activeWith = (publicLabel: unknown) => ({ status: "ACTIVE", publicLabel });
const ID = LAUNCH_TRIP_IDS[0];

describe("public gate vs OWN/PARTNER (RT-100)", () => {
  it("the four launch trips stay public whether the row is a legacy shape, UNCLASSIFIED without partner, or carries the new fields", () => {
    expect(LAUNCH_TRIP_IDS).toHaveLength(4);
    for (const id of LAUNCH_TRIP_IDS) {
      expect(evaluatePublicTrip(base(id)).included).toBe(true); // legacy row (no new fields)
      expect(evaluatePublicTrip(base(id, { operationType: "UNCLASSIFIED", partner: null })).included).toBe(true);
    }
  });

  it("an OWN trip is evaluated like before (no extra rule)", () => {
    expect(evaluatePublicTrip(base(ID, { operationType: "OWN", partner: null })).included).toBe(true);
  });

  it("a PARTNER trip is public only with an ACTIVE partner whose operator is identified in PT, EN and ES", () => {
    expect(evaluatePublicTrip(base(ID, { operationType: "PARTNER", partner: activeWith(FULL_LABEL) })).included).toBe(true);
  });

  it("an inactive or missing partner hides the PARTNER trip (PARTNER_INACTIVE)", () => {
    for (const partner of [{ status: "INACTIVE", publicLabel: FULL_LABEL }, null, undefined] as const) {
      const result = evaluatePublicTrip(base(ID, { operationType: "PARTNER", partner }));
      expect(result.included).toBe(false);
      expect(result.reasons).toContain("PARTNER_INACTIVE");
    }
  });

  it("an ACTIVE partner WITHOUT the operator identified in all three locales cannot publish a trip (PARTNER_OPERATOR_UNIDENTIFIED)", () => {
    const incomplete: unknown[] = [
      null,
      {},
      { pt: "Só PT" },
      { pt: "Operado por Exemplo", en: "Operated by Example" }, // es missing
      { pt: "Operado por Exemplo", en: "Operated by Example", es: "   " }, // blank
      { pt: "Operado por Exemplo", en: "Operated by Example", es: 7 }, // not a string
      ["Operado por Exemplo", "Operated by Example", "Operado por Ejemplo"], // array, not a locale map
      "Operado por Exemplo",
    ];
    for (const label of incomplete) {
      const result = evaluatePublicTrip(base(ID, { operationType: "PARTNER", partner: activeWith(label) }));
      expect(result.included, JSON.stringify(label)).toBe(false);
      expect(result.reasons, JSON.stringify(label)).toContain("PARTNER_OPERATOR_UNIDENTIFIED");
      expect(result.reasons).not.toContain("PARTNER_INACTIVE");
    }
  });

  it("an inactive partner with a complete label is still hidden (only PARTNER_INACTIVE)", () => {
    const result = evaluatePublicTrip(base(ID, { operationType: "PARTNER", partner: { status: "INACTIVE", publicLabel: FULL_LABEL } }));
    expect(result.included).toBe(false);
    expect(result.reasons).toEqual(["PARTNER_INACTIVE"]);
  });

  it("the new rules never apply to OWN or UNCLASSIFIED trips, whatever partner data they carry", () => {
    for (const operationType of ["OWN", "UNCLASSIFIED"]) {
      expect(evaluatePublicTrip(base(ID, { operationType, partner: { status: "INACTIVE", publicLabel: null } })).included).toBe(true);
    }
  });

  it("an active, fully identified partner cannot make a trip public by itself: the launch allowlist and integrity checks still apply", () => {
    const result = evaluatePublicTrip(base("not-in-the-launch-allowlist", { operationType: "PARTNER", partner: activeWith(FULL_LABEL) }));
    expect(result.included).toBe(false);
    expect(result.reasons).toContain("NOT_APPROVED_FOR_LAUNCH");
  });
});
