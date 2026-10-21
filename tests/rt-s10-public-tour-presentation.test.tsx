import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { approveRecord, toTourContentView, type TourContentRecord } from "@/lib/catalog/tour-content";
import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { rocinhaLoadRecord } from "@/lib/catalog/content-load";
import { TourDetailPrototype } from "@/components/site/tour/content/tour-detail-prototype";

const getTourContent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/catalog/tour-content", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/catalog/tour-content")>()), getTourContent }));

const { buildPublicOffer, getPublicTourPresentation, PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS, PUBLIC_DESIGN_TRIP_IDS } = await import("@/lib/catalog/public-tour-presentation");

const CRISTO = "cmlhxkpy9000028zq27rhytew";
const ROCINHA = "cmli1a6im000034zqqzc9sppb";
const CENTRO = "cmlibniq40000z4zqkbujnutt";
const PREMIUM = "cmljo0s1u0000t0zqa0bpd23p";

/** TEST ONLY: an in-memory approval act with rights attested, standing in for the RT-119 database approval. */
const approved = (id: string): TourContentRecord =>
  approveRecord({ ...MOCK_TOUR_CONTENT[id], images: MOCK_TOUR_CONTENT[id].images.map((m) => ({ ...m, rightsStatus: "OWNER_ATTESTED" as const })) }, new Date("2026-10-21T12:00:00Z"));
const publicView = (id: string, locale: string) => toTourContentView(approved(id), locale, "public")!;
const render = (offer: NonNullable<ReturnType<typeof buildPublicOffer>>, id: string, locale: string) =>
  renderToStaticMarkup(<TourDetailPrototype offer={offer} content={publicView(id, locale)} locale={locale} reviewMode={false} showProvisionalPrices={false} />).replace(/[  ]/g, " ");

describe("Sprint 10 public tour presentation gate", () => {
  it("covers only the three own tours and authorizes no public price yet", () => {
    expect([...PUBLIC_DESIGN_TRIP_IDS].sort()).toEqual([CRISTO, CENTRO, ROCINHA].sort());
    expect(PUBLIC_DESIGN_TRIP_IDS.has(PREMIUM)).toBe(false);
    expect(PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS.size).toBe(0);
  });

  it("publishes the design only for locales whose title and pitch are CONFIRMED", () => {
    const opts = { pricePublicationAuthorized: false };
    expect(buildPublicOffer(PROTOTYPE_OFFER[CENTRO], "pt", publicView(CENTRO, "pt"), opts)).not.toBeNull();
    expect(buildPublicOffer(PROTOTYPE_OFFER[CENTRO], "en", publicView(CENTRO, "en"), opts)).toBeNull(); // EN pending (RT-115)
    expect(buildPublicOffer(PROTOTYPE_OFFER[CENTRO], "es", publicView(CENTRO, "es"), opts)).toBeNull();
    for (const l of ["pt", "en", "es"]) expect(buildPublicOffer(PROTOTYPE_OFFER[ROCINHA], l, publicView(ROCINHA, l), opts), l).not.toBeNull();
    for (const l of ["pt", "en", "es"]) expect(buildPublicOffer(PROTOTYPE_OFFER[CRISTO], l, publicView(CRISTO, l), opts), l).toBeNull(); // title/pitch PROVISIONAL
  });

  it("drops PROVISIONAL/PENDING/MOCK facts, provisional prices and lab notices; keeps approved texts verbatim", () => {
    const centro = buildPublicOffer(PROTOTYPE_OFFER[CENTRO], "pt", publicView(CENTRO, "pt"), { pricePublicationAuthorized: false })!;
    expect(centro.title).toBe("Centro Histórico e Cultural do Rio");
    expect(centro.pitch).toEqual({ pt: "Descubra a história, a arquitetura e o patrimônio cultural do Centro do Rio em uma experiência privativa, acompanhada por um guia especializado." });
    expect(centro.benefits).toEqual({ pt: [], en: [], es: [] }); // benefit lines are PROVISIONAL
    expect(centro.approvedPricing).toBeUndefined();
    expect(centro.priceSummary).toBeUndefined();
    for (const key of ["reviewBannerNotice", "requestFlowNotice", "translationStatusNotice", "provisionalPricing"]) expect(centro, key).not.toHaveProperty(key);
    const rocinha = buildPublicOffer(PROTOTYPE_OFFER[ROCINHA], "pt", publicView(ROCINHA, "pt"), { pricePublicationAuthorized: false })!;
    expect(rocinha).not.toHaveProperty("provisionalPricing");
    expect(rocinha.benefits.pt).toEqual([]);
    expect(JSON.stringify([centro, rocinha])).not.toMatch(/"(MOCK|PROVISIONAL)"/);
  });

  it("renders the public page without review chips, lab banners, internal prices or a booking form", () => {
    for (const [id, l] of [[CENTRO, "pt"], [ROCINHA, "pt"], [ROCINHA, "en"], [ROCINHA, "es"]] as const) {
      const html = render(buildPublicOffer(PROTOTYPE_OFFER[id], l, publicView(id, l), { pricePublicationAuthorized: false })!, id, l);
      expect(html, `${id}/${l}`).not.toContain('data-testid="mock-banner"');
      expect(html, `${id}/${l}`).not.toContain("data-status=");
      expect(html, `${id}/${l}`).not.toContain('data-testid="tour-provisional-prices"');
      expect(html, `${id}/${l}`).not.toContain('data-testid="tour-pricing-section"');
      expect(html, `${id}/${l}`).not.toMatch(/R\$ \d/);
      expect(html, `${id}/${l}`).not.toContain("<form");
      expect(html, `${id}/${l}`).toContain('data-testid="image-gallery"');
    }
    const centro = render(buildPublicOffer(PROTOTYPE_OFFER[CENTRO], "pt", publicView(CENTRO, "pt"), { pricePublicationAuthorized: false })!, CENTRO, "pt");
    expect(centro).toContain("Orçamento sob consulta");
    // Rocinha: "Solicitar disponibilidade" targets #solicitar, which must offer the WhatsApp request (no dead end).
    const rocinha = render(buildPublicOffer(PROTOTYPE_OFFER[ROCINHA], "pt", publicView(ROCINHA, "pt"), { pricePublicationAuthorized: false })!, ROCINHA, "pt");
    const section = rocinha.slice(rocinha.indexOf('data-testid="tour-request"'));
    expect(section).toMatch(/href="https:\/\/wa\.me\/5522998461906\?text=[^"]*"[^>]*data-testid="tour-request-whatsapp"/);
    expect(centro).toMatch(/<a href="https:\/\/wa\.me\/5522998461906\?text=[^"]*" data-testid="tour-cta"/); // WhatsApp inquiry, not a booking
  });

  it("shows the approved TOUR-03 table only when the Owner authorizes price publication (all 8 fares unchanged)", () => {
    const offer = buildPublicOffer(PROTOTYPE_OFFER[CENTRO], "pt", publicView(CENTRO, "pt"), { pricePublicationAuthorized: true })!;
    expect(offer.approvedPricingPublic).toBe(true);
    const html = render(offer, CENTRO, "pt");
    expect(html).toContain("A partir de R$ 260 por pessoa");
    const cells = [...html.matchAll(/<td class="py-1">([^<]+)<\/td>/g)].map((m) => m[1]);
    expect(cells).toEqual(["R$ 650,00", "R$ 650,00", "R$ 380,00", "R$ 760,00", "R$ 300,00", "R$ 900,00", "R$ 260,00", "R$ 1.040,00", "R$ 890,00", "R$ 890,00", "R$ 500,00", "R$ 1.000,00", "R$ 380,00", "R$ 1.140,00", "R$ 320,00", "R$ 1.280,00"]);
  });

  it("publishes media only through the content gate, and a video only once the Owner confirmed the clip", () => {
    const unverified = approveRecord(MOCK_TOUR_CONTENT[ROCINHA], new Date("2026-10-21T12:00:00Z")); // rights UNVERIFIED
    const view = toTourContentView(unverified, "pt", "public")!;
    expect(view.gallery).toEqual([]);
    expect(view.videos).toEqual([]);
    expect(buildPublicOffer(PROTOTYPE_OFFER[ROCINHA], "pt", view, { pricePublicationAuthorized: false })!.video).toBeNull();
    // The real RT-119 load record carries the clip as a VIDEO media row (rights UNVERIFIED): public only once verified.
    const load = rocinhaLoadRecord();
    expect(load.images.find((m) => m.mediaType === "VIDEO")?.rightsStatus).toBe("UNVERIFIED");
    expect(toTourContentView(approveRecord(load, new Date("2026-10-21T12:00:00Z")), "pt", "public")!.videos).toEqual([]);
    const attested = approveRecord({ ...load, images: load.images.map((m) => ({ ...m, rightsStatus: "OWNER_ATTESTED" as const })) }, new Date("2026-10-21T12:00:00Z")); // TEST ONLY
    const attestedView = toTourContentView(attested, "pt", "public")!;
    expect(attestedView.videos.map((v) => v.src)).toEqual(["/media/tours/favela-rocinha/rocinha-praca-movimento.mp4"]);
    // Rights alone are not enough: the clip is still PROVISIONAL (Owner approval of the clip pending), so it stays private.
    expect(PROTOTYPE_OFFER[ROCINHA].video?.status).toBe("PROVISIONAL");
    expect(buildPublicOffer(PROTOTYPE_OFFER[ROCINHA], "pt", attestedView, { pricePublicationAuthorized: false })!.video).toBeNull();
    const confirmedClip = { ...PROTOTYPE_OFFER[ROCINHA], video: { ...PROTOTYPE_OFFER[ROCINHA].video!, status: "CONFIRMED" as const } }; // TEST ONLY
    expect(buildPublicOffer(confirmedClip, "pt", attestedView, { pricePublicationAuthorized: false })!.video?.src).toBe("/media/tours/favela-rocinha/rocinha-praca-movimento.mp4");
  });

  it("keeps the current page for DRAFT content, mock content or other tours", async () => {
    getTourContent.mockResolvedValue(null); // DRAFT or no row: the content gate returns null for the public audience
    expect(await getPublicTourPresentation(CENTRO, "pt")).toBeNull();
    getTourContent.mockResolvedValue(publicView(CENTRO, "pt"));
    expect(await getPublicTourPresentation(PREMIUM, "pt")).toBeNull();
    expect(await getPublicTourPresentation(CENTRO, "en")).toBeNull();
    expect(await getPublicTourPresentation(CENTRO, "pt")).not.toBeNull();
    getTourContent.mockResolvedValue({ ...publicView(CENTRO, "pt"), isMock: true });
    expect(await getPublicTourPresentation(CENTRO, "pt")).toBeNull();
  });

  it("falls back to the current page (no 500) when the content tables are unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getTourContent.mockImplementation(async () => {
      throw new Error('relation "TripContent" does not exist');
    });
    expect(await getPublicTourPresentation(CENTRO, "pt")).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("the real content gate refuses DRAFT and mock records for the public audience", () => {
    expect(toTourContentView(MOCK_TOUR_CONTENT[CENTRO], "pt", "public")).toBeNull(); // DRAFT
    expect(toTourContentView(MOCK_TOUR_CONTENT[PREMIUM], "pt", "public")).toBeNull(); // MOCK
  });
});
