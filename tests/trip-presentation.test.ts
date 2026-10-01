import { describe, expect, it } from "vitest";
import { displayLocation, formatPriceBRL, formatTripDuration, isCityOnly, parseDescription, parseTripDescription } from "@/lib/catalog/trip-presentation";

const raw =
  "Visite os dois pontos turísticos mais famosos do Rio em um único passeio com transporte, guia e ingressos inclusos.\n\nDuracao: 5 a 6 horas.\n\nCategoria: Passeio Clássico.\n\nInclusoes: Transporte em van, Guia turístico.\n\nExclusoes: Alimentação.";

describe("trip presentation helpers (RT-53)", () => {
  it("parses a public summary without leaking metadata", () => {
    const parsed = parseTripDescription(raw);
    expect(parsed.summary).toBe("Visite os dois pontos turísticos mais famosos do Rio em um único passeio com transporte, guia e ingressos inclusos.");
    expect(parsed.summary).not.toMatch(/Duracao|Categoria|Inclusoes|Exclusoes/);
    expect(parsed.duration).toBe("5 a 6 horas");
    expect(parsed.category).toBe("Passeio Clássico");
    expect(parsed.includes).toEqual(["Transporte em van", "Guia turístico"]);
    expect(parsed.excludes).toEqual(["Alimentação"]);
  });

  it("keeps the legacy export name pointing at the one parser", () => {
    expect(parseDescription).toBe(parseTripDescription);
  });

  it("handles empty and metadata-only text", () => {
    expect(parseTripDescription("").summary).toBeNull();
    expect(parseTripDescription("Duracao: 3 horas.").summary).toBeNull();
  });

  it("localizes durations without inventing content", () => {
    expect(formatTripDuration("5 a 6 horas", "en")).toBe("5–6 hours");
    expect(formatTripDuration("5 a 6 horas", "es")).toBe("5–6 horas");
    expect(formatTripDuration("8 horas", "pt")).toBe("8 horas");
    expect(formatTripDuration("1 hora", "en")).toBe("1 hour");
    expect(formatTripDuration("Dia inteiro", "en")).toBe("Dia inteiro");
    expect(formatTripDuration(null, "pt")).toBeNull();
  });

  it("only shows a location that adds information beyond the city", () => {
    expect(isCityOnly("Rio de Janeiro", "Rio de Janeiro")).toBe(true);
    expect(isCityOnly(" rio de janeiro ", "Rio de Janeiro")).toBe(true);
    expect(displayLocation("Rocinha, Rio de Janeiro", "Rio de Janeiro")).toBe("Rocinha, Rio de Janeiro");
    expect(displayLocation("Rio de Janeiro", "Rio de Janeiro")).toBeNull();
    expect(displayLocation(null, "Rio de Janeiro")).toBeNull();
  });

  it("formats BRL prices", () => {
    expect(formatPriceBRL(90000)).toBe("R$ 900,00");
    expect(formatPriceBRL(24500)).toBe("R$ 245,00");
  });
});
