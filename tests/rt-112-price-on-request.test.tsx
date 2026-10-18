import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/routing", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { findMany: vi.fn(), findFirst: vi.fn() } } }));

import { PublicTourCard } from "@/components/site/tours/public-tour-card";
import { resolveToursCopy } from "@/components/site/tours/tours-copy";
import { TourDetailView } from "@/components/site/tour/tour-detail-view";
import { filterPublicTrips } from "@/lib/catalog/public-trips";
import { priceOnRequest, publicOfferPriceCents, PRICE_ON_REQUEST_TRIP_IDS } from "@/lib/catalog/price-on-request";
import { buildTouristTripJsonLd } from "@/lib/seo/structured-data";

const CRISTO = "cmlhxkpy9000028zq27rhytew";
const ROCINHA = "cmli1a6im000034zqqzc9sppb";
const trip = (id: string, priceCents: number) => ({ id, title: { pt: "Passeio", en: "Tour", es: "Tour" }, description: { pt: "Resumo" }, city: "Rio de Janeiro", priceCents, imageUrl: null });

describe("RT-112 obsolete published price of TOUR-01 (Owner, 18/10/2026) — local correction", () => {
  it("only TOUR-01 is price-on-request, with PT/EN/ES labels", () => {
    expect([...PRICE_ON_REQUEST_TRIP_IDS]).toEqual([CRISTO]);
    expect(priceOnRequest(CRISTO, "pt")?.value).toBe("Orçamento sob consulta");
    expect(priceOnRequest(CRISTO, "en")?.value).toBe("Quote on request");
    expect(priceOnRequest(CRISTO, "es")?.value).toBe("Presupuesto a consultar");
    expect(priceOnRequest(ROCINHA, "pt")).toBeNull();
  });

  it("the public listing card never shows R$ 385 for TOUR-01 and keeps other prices unchanged", () => {
    for (const locale of ["pt", "en", "es"]) {
      const html = renderToStaticMarkup(<PublicTourCard trip={trip(CRISTO, 38500)} locale={locale} t={resolveToursCopy(locale)} />).replace(/\u00a0/g, " ");
      expect(html).not.toContain("385");
      expect(html).toContain(priceOnRequest(CRISTO, locale)!.value);
    }
    const other = renderToStaticMarkup(<PublicTourCard trip={trip(ROCINHA, 12000)} locale="pt" t={resolveToursCopy("pt")} />).replace(/\u00a0/g, " ");
    expect(other).toContain("R$ 120,00");
  });

  it("the public tour detail never shows R$ 385 for TOUR-01 (PT/EN/ES)", () => {
    for (const locale of ["pt", "en", "es"]) {
      const html = renderToStaticMarkup(<TourDetailView trip={{ ...trip(CRISTO, 38500), highlights: { pt: [], en: [], es: [] }, schedules: [] }} locale={locale} />).replace(/\u00a0/g, " ");
      expect(html).not.toContain("385");
      expect(html).toContain(priceOnRequest(CRISTO, locale)!.value);
    }
  });

  it("a price filter cannot reveal the obsolete price (TOUR-01 never matches a min/max filter)", () => {
    const trips = [trip(CRISTO, 38500), trip(ROCINHA, 12000)];
    expect(filterPublicTrips(trips, { minPrice: "380", maxPrice: "390" }, "pt")).toHaveLength(0);
    expect(filterPublicTrips(trips, { minPrice: "100", maxPrice: "130" }, "pt").map((t) => t.id)).toEqual([ROCINHA]);
    expect(filterPublicTrips(trips, {}, "pt")).toHaveLength(2);
  });

  it("the page's JSON-LD decision omits the Offer for TOUR-01 only", () => {
    expect(publicOfferPriceCents(CRISTO, 38500)).toBeNull();
    expect(publicOfferPriceCents(ROCINHA, 12000)).toBe(12000);
  });

  it("JSON-LD carries no Offer price when the price is on request (the page passes priceCents 0)", () => {
    const ld = buildTouristTripJsonLd({ siteUrl: "https://example.test", url: "https://example.test/pt/tours/x", name: "x", priceCents: 0 }) as Record<string, unknown>;
    expect(ld.offers).toBeUndefined();
  });
});
