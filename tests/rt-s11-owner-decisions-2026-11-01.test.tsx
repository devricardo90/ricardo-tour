import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { approveRecord, toTourContentView } from "@/lib/catalog/tour-content";
import { launchLoadRecord } from "@/lib/catalog/content-load";
import { PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { TourDetailPrototype } from "@/components/site/tour/content/tour-detail-prototype";
import { PublicTourCard } from "@/components/site/tours/public-tour-card";
import { resolveToursCopy } from "@/components/site/tours/tours-copy";
import { approvedTripLocation } from "@/lib/catalog/launch-trip-copy";
import { BOOKING_PRICE_NOT_APPROVED_TRIP_IDS, priceOnRequest, publicOfferPriceCents } from "@/lib/catalog/price-on-request";
import { PAID_BOOKINGS_OPEN, PAYMENT_METHOD_TEXT, withoutPaymentSentences } from "@/lib/catalog/payment-text";
import { publicRequestTable } from "@/lib/booking/public-request";
import { legalPagesPublished } from "@/lib/legal/publication";

vi.mock("@/i18n/routing", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
const getTourContent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/catalog/tour-content", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/catalog/tour-content")>()), getTourContent }));
const { getPublicTourPresentation } = await import("@/lib/catalog/public-tour-presentation");

const CRISTO = "cmlhxkpy9000028zq27rhytew";
const ROCINHA = "cmli1a6im000034zqqzc9sppb";
const CENTRO = "cmlibniq40000z4zqkbujnutt";
const LOCALES = ["pt", "en", "es"] as const;

/**
 * Owner 01/11/2026, verbatim group totals (approved 28/10/2026): totals per private group, NOT per person × N.
 * Confronted with the code tables (RT-121) — nothing here is recalculated.
 */
const OWNER_TOTALS: Record<string, string[][]> = {
  [CRISTO]: [["R$ 1.200,00", "R$ 1.700,00", "R$ 2.200,00", "R$ 2.600,00"]],
  [ROCINHA]: [["R$ 450,00", "R$ 580,00", "R$ 690,00", "R$ 780,00"]],
  [CENTRO]: [
    ["R$ 650,00", "R$ 760,00", "R$ 900,00", "R$ 1.040,00"], // 4 h
    ["R$ 890,00", "R$ 1.000,00", "R$ 1.140,00", "R$ 1.280,00"], // 6 h
  ],
};

/** TEST ONLY: the real release load record with an in-memory approval act, standing in for the database approval. */
getTourContent.mockImplementation(async (id: string, locale: string) => toTourContentView(approveRecord(launchLoadRecord(id), new Date("2026-11-01T12:00:00Z")), locale, "public"));

async function publicPage(id: string, locale: string) {
  const presentation = await getPublicTourPresentation(id, locale);
  expect(presentation, `${id} ${locale}`).not.toBeNull();
  const { offer, content } = presentation!;
  return renderToStaticMarkup(<TourDetailPrototype offer={offer} content={content} locale={locale} reviewMode={false} showProvisionalPrices={false} />).replace(/[  ]/g, " ");
}

describe("Owner decisions of 01/11/2026 on the public pages of the three launch tours", () => {
  it("prices: every group total per size and duration matches the Owner's table, in PT/EN/ES", async () => {
    for (const id of [CRISTO, ROCINHA, CENTRO]) {
      for (const locale of LOCALES) {
        const html = await publicPage(id, locale);
        const tables = [...html.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)].map((m) => [...m[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) => [...row[1].matchAll(/<td class="py-1">([^<]+)<\/td>/g)].at(-1)?.[1]));
        expect(tables, `${id} ${locale}`).toEqual(OWNER_TOTALS[id]);
        expect(html, `${id} ${locale}`).toContain('data-testid="tour-pricing-section"');
        expect(html).toContain(PROTOTYPE_OFFER[id].priceSummary![locale]);
      }
    }
  });

  it("prices: the public table has no lab notice and names no payment method while bookings are closed", async () => {
    for (const id of [CRISTO, ROCINHA, CENTRO]) {
      for (const locale of LOCALES) {
        const html = await publicPage(id, locale);
        expect(html).not.toMatch(/prévia local|local preview|vista previa local|laboratório local|local review lab|laboratorio local/i);
        // No review-lab status badge anywhere on the public page (e.g. next to the pricing heading).
        expect(html, `${id} ${locale}`).not.toContain("data-status=");
        expect(PAYMENT_METHOD_TEXT.test(html.replace(/<[^>]+>/g, " ")), `${id} ${locale} whole page`).toBe(false);
        const pricing = html.slice(html.indexOf('data-testid="tour-pricing-section"'));
        expect(PAYMENT_METHOD_TEXT.test(pricing.slice(0, pricing.indexOf("</section>"))), `${id} ${locale}`).toBe(false);
        // The rest of the approved note is kept (e.g. tickets included / adults only / extra hour).
        expect(html, `${id} ${locale}`).toContain('data-testid="tour-pricing-note"');
      }
    }
    expect(withoutPaymentSentences("Valor fechado por grupo. Sinal de 30%; pagamento por PIX.")).toBe("Valor fechado por grupo.");
    for (const text of ["Pagamento em cartão.", "Pay by card.", "Pago con tarjeta.", "Por transferência.", "Bank transfer accepted.", "Pague com boleto."]) expect(PAYMENT_METHOD_TEXT.test(text), text).toBe(true);
    for (const text of ["cartão-postal do Rio", "scarcely", "discard"]) expect(PAYMENT_METHOD_TEXT.test(text), text).toBe(text === "cartão-postal do Rio");
  });

  it("prices do not open bookings or payments: no public request form, legacy booking API still blocked, no JSON-LD Offer", () => {
    expect(legalPagesPublished()).toBe(false);
    // Payment methods stay hidden even after the legal publication, until the separate PIX sprint opens paid bookings.
    expect(PAID_BOOKINGS_OPEN).toBe(false);
    for (const id of [CRISTO, ROCINHA, CENTRO]) {
      expect(publicRequestTable(id, "public", {})).toBeNull();
      expect(BOOKING_PRICE_NOT_APPROVED_TRIP_IDS.has(id)).toBe(true);
      // Structured data never carries the legacy Trip.priceCents.
      expect(publicOfferPriceCents(id, 38500)).toBeNull();
    }
  });

  it("video: the Pão de Açúcar clip is published on the TOUR-01 page in PT/EN/ES (poster, mobile rendition, no autoplay)", async () => {
    for (const locale of LOCALES) {
      const html = await publicPage(CRISTO, locale);
      expect(html.match(/data-testid="tour-video"/g), locale).toHaveLength(1);
      expect(html).toContain('<source src="/media/tours/cristo-pao-selaron/pao-bondinho-41-58-mobile.mp4" type="video/mp4" media="(max-width: 767px)"/>');
      expect(html).toContain('<source src="/media/tours/cristo-pao-selaron/pao-bondinho-41-58.mp4" type="video/mp4"/>');
      const player = html.match(/<video[^>]*data-testid="tour-video-player"[^>]*>/)?.[0] ?? "";
      expect(player).toContain('poster="/media/tours/cristo-pao-selaron/pao-bondinho-41-58-poster.jpg"');
      expect(player).not.toMatch(/autoplay/i);
      expect(html).toContain(PROTOTYPE_OFFER[CRISTO].video!.caption[locale]);
    }
  });

  it("card location: translated place line from code for the three tours, never the untranslated Trip.location", () => {
    const expected = {
      [CRISTO]: { pt: "Rio de Janeiro", en: "Rio de Janeiro", es: "Río de Janeiro" },
      [ROCINHA]: { pt: "Rocinha, Rio de Janeiro", en: "Rocinha, Rio de Janeiro", es: "Rocinha, Río de Janeiro" },
      [CENTRO]: { pt: "Centro Histórico do Rio de Janeiro", en: "Historic Center of Rio de Janeiro", es: "Centro Histórico de Río de Janeiro" },
    } as const;
    for (const [id, byLocale] of Object.entries(expected)) {
      for (const locale of LOCALES) {
        expect(approvedTripLocation(id, locale)).toBe(byLocale[locale]);
        const trip = { id, title: { pt: "x", en: "x", es: "x" }, description: { pt: "y", en: "y", es: "y" }, city: "Rio de Janeiro", location: id === CENTRO ? "Centro histórico do Rio de Janeiro" : null, priceCents: 24500, imageUrl: null };
        const html = renderToStaticMarkup(<PublicTourCard trip={trip} locale={locale} t={resolveToursCopy(locale)} />);
        expect(html, `${id} ${locale}`).toContain(`<span>${byLocale[locale]}</span>`);
      }
    }
    expect(approvedTripLocation("cmljo0s1u0000t0zqa0bpd23p", "pt")).toBeNull();
  });

  it("TOUR-03 card (Owner 02/11/2026): the per-person price is shown with its condition, group of 4 adults and 4-hour tour", () => {
    const expected = { pt: ["Grupo de 4 adultos · 4 h", "R$ 260/pessoa"], en: ["Group of 4 adults · 4 h", "R$ 260/person"], es: ["Grupo de 4 adultos · 4 h", "R$ 260/persona"] } as const;
    for (const locale of LOCALES) {
      expect(priceOnRequest(CENTRO, locale), locale).toEqual({ label: expected[locale][0], value: expected[locale][1] });
      const trip = { id: CENTRO, title: { pt: "x", en: "x", es: "x" }, description: { pt: "y", en: "y", es: "y" }, city: "Rio de Janeiro", location: null, priceCents: 24500, imageUrl: null };
      const html = renderToStaticMarkup(<PublicTourCard trip={trip} locale={locale} t={resolveToursCopy(locale)} />);
      expect(html, locale).toContain(expected[locale][0]);
      expect(html, locale).toContain(expected[locale][1]);
      expect(html, locale).not.toMatch(/A partir de|From R\$|Desde R\$/);
    }
  });
});
