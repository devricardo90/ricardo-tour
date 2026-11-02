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
const CENTRO = "cmlibniq40000z4zqkbujnutt";
const PREMIUM = "cmljo0s1u0000t0zqa0bpd23p";
const OWN_TOURS = [CRISTO, ROCINHA, CENTRO, PREMIUM];
const trip = (id: string, priceCents: number) => ({ id, title: { pt: "Passeio", en: "Tour", es: "Tour" }, description: { pt: "Resumo" }, city: "Rio de Janeiro", priceCents, imageUrl: null });

describe("stored price of the four own tours never shown (Owner, 18/10/2026; approved fares 01/11/2026)", () => {
  it("never uses the stored price of the four own tours; TOUR-04 keeps the quote label, the launch tours their approved fare", () => {
    expect([...PRICE_ON_REQUEST_TRIP_IDS]).toEqual(OWN_TOURS);
    expect(priceOnRequest(PREMIUM, "pt")?.value).toBe("Orçamento sob consulta");
    expect(priceOnRequest(PREMIUM, "en")?.value).toBe("Quote on request");
    expect(priceOnRequest(PREMIUM, "es")?.value).toBe("Presupuesto a consultar");
    // Owner 01/11/2026: public display of the approved fares authorized for the three launch tours (code tables only).
    expect(priceOnRequest(CRISTO, "pt")).toEqual({ label: "Grupo de 4 adultos", value: "R$ 650/pessoa" });
    expect(priceOnRequest(ROCINHA, "en")).toEqual({ label: "Group of 4 adults", value: "R$ 195/person" });
    expect(priceOnRequest(CENTRO, "es")).toEqual({ label: "Grupo de 4 adultos · 4 h", value: "R$ 260/persona" });
  });

  it("public listing cards show the quote label instead of any stored amount for all four tours", () => {
    for (const locale of ["pt", "en", "es"]) {
      for (const id of OWN_TOURS) {
        const html = renderToStaticMarkup(<PublicTourCard trip={trip(id, 38500)} locale={locale} t={resolveToursCopy(locale)} />).replace(/\u00a0/g, " ");
        expect(html).not.toContain("385");
        expect(html).toContain(priceOnRequest(id, locale)!.value);
      }
    }
    const other = renderToStaticMarkup(<PublicTourCard trip={trip("other-tour", 12000)} locale="pt" t={resolveToursCopy("pt")} />).replace(/\u00a0/g, " ");
    expect(other).toContain("R$ 120,00");
  });

  it("public tour details show the quote label instead of any stored amount for all four tours", () => {
    for (const locale of ["pt", "en", "es"]) {
      for (const id of OWN_TOURS) {
        const html = renderToStaticMarkup(<TourDetailView trip={{ ...trip(id, 38500), highlights: { pt: [], en: [], es: [] }, schedules: [] }} locale={locale} />).replace(/\u00a0/g, " ");
        expect(html).not.toContain("385");
        expect(html).toContain(priceOnRequest(id, locale)!.value);
      }
    }
  });

  it("price filters cannot reveal the stored price for any of the four tours", () => {
    const trips = OWN_TOURS.map((id, i) => trip(id, (i + 1) * 10000));
    expect(filterPublicTrips(trips, { minPrice: "1", maxPrice: "500" }, "pt")).toHaveLength(0);
    expect(filterPublicTrips(trips, {}, "pt")).toHaveLength(4);
  });

  it("the page's JSON-LD decision omits the Offer price for all four tours", () => {
    for (const id of OWN_TOURS) expect(publicOfferPriceCents(id, 38500)).toBeNull();
    expect(publicOfferPriceCents("other-tour", 12000)).toBe(12000);
  });

  it("JSON-LD carries no Offer price when the price is on request (the page passes priceCents 0)", () => {
    const ld = buildTouristTripJsonLd({ siteUrl: "https://example.test", url: "https://example.test/pt/tours/x", name: "x", priceCents: 0 }) as Record<string, unknown>;
    expect(ld.offers).toBeUndefined();
  });
});
