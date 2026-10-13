import { describe, expect, it } from "vitest";
import { resolvePartnerPublicLabel, validateOperationAssignment } from "@/lib/catalog/operation-type";

describe("validateOperationAssignment (RT-100; mirrors the database CHECK)", () => {
  it("UNCLASSIFIED and OWN are valid only without a partner", () => {
    for (const operationType of ["UNCLASSIFIED", "OWN"]) {
      expect(validateOperationAssignment({ operationType, partnerId: null })).toEqual({ ok: true });
      expect(validateOperationAssignment({ operationType })).toEqual({ ok: true });
      expect(validateOperationAssignment({ operationType, partnerId: "p1" })).toEqual({ ok: false, reason: "PARTNER_NOT_ALLOWED" });
    }
  });

  it("PARTNER requires a partner", () => {
    expect(validateOperationAssignment({ operationType: "PARTNER", partnerId: "p1" })).toEqual({ ok: true });
    expect(validateOperationAssignment({ operationType: "PARTNER", partnerId: null })).toEqual({ ok: false, reason: "PARTNER_REQUIRED" });
    expect(validateOperationAssignment({ operationType: "PARTNER", partnerId: "   " })).toEqual({ ok: false, reason: "PARTNER_REQUIRED" });
  });

  it("rejects unknown types", () => {
    expect(validateOperationAssignment({ operationType: "own" })).toEqual({ ok: false, reason: "UNKNOWN_TYPE" });
    expect(validateOperationAssignment({ operationType: "" })).toEqual({ ok: false, reason: "UNKNOWN_TYPE" });
  });
});

describe("resolvePartnerPublicLabel (Owner condition 4: UNCLASSIFIED is never shown)", () => {
  const label = { pt: "Operado por Exemplo", en: "Operated by Example", es: "Operado por Ejemplo" };
  const activePartner = { status: "ACTIVE", publicLabel: label };

  it("returns the approved label only for an ACTIVE PARTNER, in exactly the visitor's locale", () => {
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: activePartner }, "pt")).toBe("Operado por Exemplo");
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: activePartner }, "en")).toBe("Operated by Example");
  });

  it("returns null for every UNCLASSIFIED and OWN trip, so the internal state can never reach a visitor", () => {
    for (const operationType of ["UNCLASSIFIED", "OWN"]) {
      for (const locale of ["pt", "en", "es", "sv"]) {
        expect(resolvePartnerPublicLabel({ operationType, partner: activePartner }, locale)).toBeNull();
        expect(resolvePartnerPublicLabel({ operationType, partner: null }, locale)).toBeNull();
      }
    }
  });

  it("returns null when the partner is inactive/missing or the label is missing, blank or not for this locale (no fallback, no invention)", () => {
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: { status: "INACTIVE", publicLabel: label } }, "pt")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: null }, "pt")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER" }, "pt")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: { status: "ACTIVE", publicLabel: null } }, "pt")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: { status: "ACTIVE", publicLabel: { pt: "   " } } }, "pt")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: { status: "ACTIVE", publicLabel: { pt: "Só PT" } } }, "en")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: { status: "ACTIVE", publicLabel: ["x"] } }, "pt")).toBeNull();
    expect(resolvePartnerPublicLabel({ operationType: "PARTNER", partner: activePartner }, "sv")).toBeNull();
  });
});
