import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { approvedTripCopy } from "@/lib/catalog/launch-trip-copy";

/**
 * Owner 01/11/2026, option R: the database keeps the legacy production rows (the release never writes Trip.title or
 * Trip.description); every public surface of the three launch tours shows the approved name and summary instead, with
 * their own cover and, since the Owner's authorization of 01/11/2026, the approved fare from code (never Trip.priceCents).
 * Rows below = what production holds today (HTTP audit 01/11/2026).
 */
const LEGACY = [
  { id: "cmlhxkpy9000028zq27rhytew", title: { pt: "Cristo Redentor + Pão de Açúcar", en: "Cristo Redentor + Pão de Açúcar", es: "Cristo Redentor + Pão de Açúcar" }, description: { pt: "Visite os dois pontos turísticos mais famosos do Rio em um único passeio com transporte, guia e ingressos inclusos." }, priceCents: 38500, imageUrl: "/images/trips/imagem-pao-de-acucar.jpg" },
  { id: "cmli1a6im000034zqqzc9sppb", title: { pt: "Tour Favela Rocinha com Guia Local", en: "Tour Favela Rocinha com Guia Local", es: "Tour Favela Rocinha com Guia Local" }, description: { pt: "Conheça a cultura local da maior favela do Brasil com guia especializado" }, priceCents: 12000, imageUrl: "/images/trips/imagem-rocinha.jpg" },
  { id: "cmlibniq40000z4zqkbujnutt", title: { pt: "Confeitaria Colombo + City Tour Rio", en: "Confeitaria Colombo + City Tour Rio", es: "Confeitaria Colombo + City Tour Rio" }, description: { pt: "Explore o principal cartão-postal do Brasil com visita a confeitaria colombo" }, priceCents: 24500, imageUrl: "/images/trips/imagem-cristo-redentor.jpg" },
].map((row) => ({ ...row, city: "Rio de Janeiro", location: null, isPublished: true, highlights: { pt: ["Ingresso Cristo Redentor"] }, durationDays: 1, physicalLevel: "EASY", childrenAllowed: true, maxGuests: 10, operationType: "UNCLASSIFIED", partner: null, schedules: [] }));

const LEGACY_TEXT = /Confeitaria Colombo|City Tour Rio|Cristo Redentor \+ Pão de Açúcar|Tour Favela Rocinha com Guia Local|maior favela do Brasil|cartão-postal|\/images\/trips\/|Preço por pessoa|R\$\s*(385|120|245|900)(,00)?(?!\d|\.\d)/;
const LOCALES = ["pt", "en", "es"] as const;
/** Owner-approved compact fare lines (30/10/2026), public since 01/11/2026: 4 adults, i.e. totals R$ 2.600 / 780 / 1.040. */
const APPROVED_CARD_FARES = {
  pt: ["R$ 650/pessoa", "R$ 195/pessoa", "R$ 260/pessoa"],
  en: ["R$ 650/person", "R$ 195/person", "R$ 260/person"],
  es: ["R$ 650/persona", "R$ 195/persona", "R$ 260/persona"],
} as const;

const { findMany, findFirst } = vi.hoisted(() => ({ findMany: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { trip: { findMany, findFirst } } }));
vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: { children: unknown; href: string }) => <a href={href} {...props}>{children as never}</a>,
  usePathname: () => "/",
  getLanguageAlternates: () => ({}),
}));

beforeEach(() => {
  findMany.mockReset().mockResolvedValue(LEGACY.map((row) => structuredClone(row)));
  findFirst.mockReset().mockImplementation(async ({ where }: { where: { id: string } }) => structuredClone(LEGACY.find((row) => row.id === where.id) ?? null));
});

describe("Owner 01/11/2026, option R: approved card copy over untouched legacy rows", { timeout: 60_000 }, () => {
  it("catalog readers return the approved name and summary and the own cover; the price field is left to its own gate", async () => {
    const { getPublicTrips, getPublicTripById } = await import("@/lib/catalog/public-trips");
    const trips = await getPublicTrips();
    expect(new Set(trips.map((t) => t.id))).toEqual(new Set(LEGACY.map((row) => row.id)));
    for (const trip of trips) {
      const copy = approvedTripCopy(trip.id);
      expect(trip.title).toEqual(copy.title);
      expect(trip.description).toEqual(copy.description);
      expect(trip.imageUrl).toMatch(/^\/media\/tours\//);
      const single = await getPublicTripById(trip.id);
      expect(single?.title).toEqual(copy.title);
      expect(single?.description).toEqual(copy.description);
    }
    // The legacy rows passed to the readers are not mutated (nothing is written back).
    expect(LEGACY[2].title.pt).toBe("Confeitaria Colombo + City Tour Rio");
  });

  it("each launch tour card uses its own approved cover; TOUR-03 uses the Candelária photo of its gallery (Owner 14/11/2026)", async () => {
    const { getPublicTrips, getPublicTripById } = await import("@/lib/catalog/public-trips");
    const { CENTRO_MEDIA_PREVIEW } = await import("@/lib/catalog/drafts/centro-historico-media");
    const expected = {
      cmlhxkpy9000028zq27rhytew: "/media/tours/cristo-pao-selaron/pao-01-IMG_1162-mirante.webp",
      cmli1a6im000034zqqzc9sppb: "/media/tours/favela-rocinha/rocinha-01-panorama-bandeira.jpg",
      cmlibniq40000z4zqkbujnutt: "/media/tours/centro-historico-cultural/centro-historico-img-1802.webp",
    } as Record<string, string>;
    for (const trip of await getPublicTrips()) expect(trip.imageUrl).toBe(expected[trip.id]);
    expect((await getPublicTripById("cmlibniq40000z4zqkbujnutt"))?.imageUrl).toBe(expected.cmlibniq40000z4zqkbujnutt);
    // Same file as the TOUR-03 gallery cover; the removed Real Gabinete photo is used nowhere in the catalog.
    expect(CENTRO_MEDIA_PREVIEW.images.find((image) => image.isCover)?.src).toBe(expected.cmlibniq40000z4zqkbujnutt);
    expect(JSON.stringify(await getPublicTrips())).not.toContain("img-1337");
  });

  it("Home section and listing show only the approved names and fares, no old copy, old cover or stored price, in PT/EN/ES", async () => {
    const { ExperiencesInRioSection } = await import("@/components/experiences-in-rio-section");
    const { default: ToursPage } = await import("@/app/[locale]/(site)/tours/page");
    for (const locale of LOCALES) {
      const home = renderToStaticMarkup(await ExperiencesInRioSection({ locale }));
      const listing = renderToStaticMarkup(await ToursPage({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }));
      for (const html of [home, listing]) {
        for (const row of LEGACY) expect(html, `${locale} ${row.id}`).toContain(approvedTripCopy(row.id).title[locale].replace(/&/g, "&amp;"));
        for (const fare of APPROVED_CARD_FARES[locale]) expect(html, `${locale} ${fare}`).toContain(fare);
        expect(html, locale).not.toMatch(LEGACY_TEXT);
      }
    }
  });

  it("listing search matches the approved copy, not the legacy names", async () => {
    const { default: ToursPage } = await import("@/app/[locale]/(site)/tours/page");
    const hit = renderToStaticMarkup(await ToursPage({ params: Promise.resolve({ locale: "pt" }), searchParams: Promise.resolve({ search: "Selarón" }) }));
    expect(hit).toContain(approvedTripCopy("cmlhxkpy9000028zq27rhytew").title.pt);
    const legacy = renderToStaticMarkup(await ToursPage({ params: Promise.resolve({ locale: "pt" }), searchParams: Promise.resolve({ search: "Confeitaria Colombo" }) }));
    // The page echoes the search term itself; no tour card (approved or legacy) may match it.
    expect(legacy.replaceAll("Confeitaria Colombo", "")).not.toMatch(LEGACY_TEXT);
    for (const row of LEGACY) expect(legacy).not.toContain(approvedTripCopy(row.id).title.pt);
  });
});
