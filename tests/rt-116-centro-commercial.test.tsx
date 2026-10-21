import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TourDetailPrototype, offerForReview } from "@/components/site/tour/content/tour-detail-prototype";
import { CENTRO_ID } from "@/lib/catalog/drafts/centro-historico-media";
import { CENTRO_APPROVED_PRICING, CENTRO_COMMERCIAL_DRAFT, CENTRO_ROUTE_OPTIONS, calculateCentroQuote } from "@/lib/catalog/drafts/centro-historico-commercial";
import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { toTourContentView, validateTourContent } from "@/lib/catalog/tour-content";

describe("RT-116 approved commercial draft", () => {
  it("preserves every approved duration and group price", () => {
    expect(CENTRO_APPROVED_PRICING.durations.map((duration) => duration.prices.map((price) => price.totalCents))).toEqual([
      [65000, 76000, 90000, 104000],
      [89000, 100000, 114000, 128000],
    ]);
    expect(CENTRO_APPROVED_PRICING.additionalHourPerGroupCents).toBe(12000);
    expect(CENTRO_APPROVED_PRICING.depositBasisPoints).toBe(3000);
  });

  it("calculates participant prices, infant half fare, one group extension and deposit", () => {
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35] })).toMatchObject({ totalCents: 65000, depositCents: 19500, balanceCents: 45500 });
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 40] }).totalCents).toBe(76000);
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 40, 50] }).totalCents).toBe(90000);
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 40, 50, 60] }).totalCents).toBe(104000);
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 1] })).toMatchObject({ baseGroupTotalCents: 57000, depositCents: 17100, balanceCents: 39900 });
    expect(calculateCentroQuote({ durationHours: 6, travelerAges: [35, 1], extensionHours: 2 })).toMatchObject({ baseGroupTotalCents: 75000, extensionTotalCents: 24000, totalCents: 99000, depositCents: 29700, balanceCents: 69300 });
    expect(() => calculateCentroQuote({ durationHours: 4, travelerAges: [] })).toThrow(RangeError);
    expect(() => calculateCentroQuote({ durationHours: 6, travelerAges: [30, 31, 32, 33, 34] })).toThrow(RangeError);
  });

  it("keeps the two approved routes, their durations and DRAFT/publication gates", () => {
    expect(CENTRO_ROUTE_OPTIONS.map((route) => [route.id, route.stops.reduce((sum, stop) => sum + stop.durationMinutes, 0)])).toEqual([
      ["essential-4h", 240],
      ["porto-maravilha-6h", 360],
    ]);
    expect(CENTRO_COMMERCIAL_DRAFT.status).toBe("DRAFT");
    expect(CENTRO_COMMERCIAL_DRAFT.images.every((image) => image.rightsStatus === "UNVERIFIED")).toBe(true);
    expect(toTourContentView(CENTRO_COMMERCIAL_DRAFT, "pt", "public")).toBeNull();
    expect(MOCK_TOUR_CONTENT[CENTRO_ID]).toBe(CENTRO_COMMERCIAL_DRAFT);
  });

  it("shows approved rates and both routes only in the local review preview; no-price mode strips rates", () => {
    const content = toTourContentView(MOCK_TOUR_CONTENT[CENTRO_ID], "pt", "preview");
    const offer = PROTOTYPE_OFFER[CENTRO_ID];
    if (!content) throw new Error("Expected local preview content");
    const reviewHtml = renderToStaticMarkup(<TourDetailPrototype offer={offer} content={content} locale="pt" reviewMode showProvisionalPrices />).replace(/[\u00a0\u202f]/g, " ");
    expect(reviewHtml).toContain('data-testid="tour-approved-prices"');
    expect(reviewHtml).toContain("R$ 650,00");
    expect(reviewHtml).toContain("R$ 1.280,00");
    expect(reviewHtml).toContain('data-testid="centro-route-options"');
    expect(reviewHtml).toContain("Centro Histórico Essencial");
    expect(reviewHtml).toContain("Centro Histórico + Porto Maravilha");
    expect(reviewHtml).toContain("A mensagem não confirma data, reserva ou pagamento");
    expect(reviewHtml).toContain('href="https://wa.me/5522998461906?text=');
    expect(reviewHtml).not.toContain('data-testid="tour-whatsapp"');

    const hiddenReviewOffer = offerForReview(offer, false);
    expect("approvedPricing" in hiddenReviewOffer).toBe(false);
    expect("provisionalPricing" in hiddenReviewOffer).toBe(false);
    const hiddenHtml = renderToStaticMarkup(<TourDetailPrototype offer={offer} content={content} locale="pt" reviewMode showProvisionalPrices={false} />);
    expect(hiddenHtml).not.toContain('data-testid="tour-approved-prices"');
    expect(hiddenHtml.replace(/[\u00a0\u202f]/g, " ")).not.toContain("R$ 650,00");
    expect(hiddenHtml).not.toContain("Consulte a tabela por duração e tamanho do grupo");
    expect(hiddenHtml).not.toContain("A partir de R$ 260 por pessoa");
    expect(hiddenHtml).not.toContain('data-testid="tour-price-condition"');
    expect(hiddenHtml).not.toContain('data-testid="tour-pricing-section"');
    expect(hiddenHtml).toContain('data-testid="centro-route-options"');
  });

  it("has complete PT/EN/ES draft copy with no Portuguese fallback on EN/ES pages", () => {
    expect(validateTourContent(CENTRO_COMMERCIAL_DRAFT)).toEqual([]);
    for (const locale of ["pt", "en", "es"] as const) {
      const content = toTourContentView(CENTRO_COMMERCIAL_DRAFT, locale, "preview");
      expect(content).not.toBeNull();
      expect(content?.missingLocale).toEqual([]);
      expect(CENTRO_COMMERCIAL_DRAFT.inclusions?.[locale]).toHaveLength(10);
      expect(CENTRO_COMMERCIAL_DRAFT.exclusions?.[locale]).toHaveLength(8);
      expect(CENTRO_COMMERCIAL_DRAFT.faq?.every(({ question, answer }) => Boolean(question[locale] && answer[locale]))).toBe(true);
    }

    const offer = PROTOTYPE_OFFER[CENTRO_ID];
    const english = toTourContentView(CENTRO_COMMERCIAL_DRAFT, "en", "preview");
    const spanish = toTourContentView(CENTRO_COMMERCIAL_DRAFT, "es", "preview");
    if (!english || !spanish) throw new Error("Expected localized Centro content");
    const englishHtml = renderToStaticMarkup(<TourDetailPrototype offer={offer} content={english} locale="en" reviewMode showProvisionalPrices />).replace(/[\u00a0\u202f]/g, " ");
    const spanishHtml = renderToStaticMarkup(<TourDetailPrototype offer={offer} content={spanish} locale="es" reviewMode showProvisionalPrices />).replace(/[\u00a0\u202f]/g, " ");
    for (const forbidden of ["Solicitar disponibilidade", "Tabela comercial aprovada", "Opções de roteiro", "Informações práticas", "Roteiros de 4 ou 6 horas", "Crianças de 0 a 2 anos"]) {
      expect(englishHtml).not.toContain(forbidden);
      expect(spanishHtml).not.toContain(forbidden);
    }
    expect(englishHtml).toContain("Request availability");
    expect(englishHtml).toContain("Owner-approved commercial table");
    expect(englishHtml).toContain("Essential Historic Center");
    expect(englishHtml).toContain('href="https://wa.me/5522998461906?text=');
    expect(spanishHtml).toContain("Solicitar disponibilidad");
    expect(spanishHtml).toContain("Tabla comercial aprobada por el Owner");
    expect(spanishHtml).toContain("Centro Histórico Esencial");
    expect(spanishHtml).toContain('href="https://wa.me/5522998461906?text=');
  });

  it("keeps adult, infant, airport and fee sensitivities tied to approved prices without inventing fee rates", () => {
    const groupSizes = [1, 2, 3, 4];
    const expected4h = [65000, 76000, 90000, 104000];
    const expected6h = [89000, 100000, 114000, 128000];
    for (let index = 0; index < groupSizes.length; index += 1) {
      const adults = Array.from({ length: groupSizes[index] }, () => 35);
      expect(calculateCentroQuote({ durationHours: 4, travelerAges: adults }).totalCents).toBe(expected4h[index]);
      expect(calculateCentroQuote({ durationHours: 6, travelerAges: adults }).totalCents).toBe(expected6h[index]);
    }

    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 1] }).totalCents).toBe(57000);
    expect(calculateCentroQuote({ durationHours: 6, travelerAges: [35, 1] }).totalCents).toBe(75000);
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 36, 1] }).totalCents).toBe(75000);
    expect(calculateCentroQuote({ durationHours: 6, travelerAges: [35, 36, 1] }).totalCents).toBe(95000);
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 36, 37, 1] }).totalCents).toBe(91000);
    expect(calculateCentroQuote({ durationHours: 6, travelerAges: [35, 36, 37, 1] }).totalCents).toBe(112000);
    expect(calculateCentroQuote({ durationHours: 4, travelerAges: [35, 36, 1, 2] }).totalCents).toBe(78000);
    expect(calculateCentroQuote({ durationHours: 6, travelerAges: [35, 36, 1, 2] }).totalCents).toBe(96000);

    expect(CENTRO_APPROVED_PRICING.additionalHourPerGroupCents).toBe(12000);
  });
});

describe("TOUR-03 editorial status of the hero pitch and benefit lines", () => {
  const render = (locale: "pt" | "en" | "es") =>
    renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[CENTRO_ID]} content={toTourContentView(MOCK_TOUR_CONTENT[CENTRO_ID], locale, "preview")!} locale={locale} reviewMode />);
  const badgeAfter = (html: string, testId: string) => {
    const start = html.indexOf(`data-testid="${testId}"`);
    return start < 0 ? undefined : html.slice(start).match(/data-status="(\w+)"/)?.[1];
  };

  it("pitch is CONFIRMED in PT (Owner editorial approval 21/10/2026), benefits PROVISIONAL in PT, EN/ES PENDING, never MOCK", () => {
    const pitch = { pt: "CONFIRMED", en: "PENDING", es: "PENDING" } as const;
    const benefits = { pt: "PROVISIONAL", en: "PENDING", es: "PENDING" } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const html = render(locale);
      expect(badgeAfter(html, "tour-pitch"), `${locale} pitch`).toBe(pitch[locale]);
      expect(badgeAfter(html, "tour-benefits"), `${locale} benefits`).toBe(benefits[locale]);
      // The only MOCK badge left is the review legend in the banner.
      expect(html.match(/data-status="MOCK"/g) ?? [], `${locale} MOCK badges`).toHaveLength(1);
    }
  });

  it("keeps the approved texts, the DRAFT record and the other tours' statuses unchanged", () => {
    const offer = PROTOTYPE_OFFER[CENTRO_ID];
    expect(offer.pitch.pt).toBe("Descubra a história, a arquitetura e o patrimônio cultural do Centro do Rio em uma experiência privativa, acompanhada por um guia especializado.");
    expect(render("pt")).toContain("Descubra a história, a arquitetura e o patrimônio cultural do Centro do Rio em uma experiência privativa, acompanhada por um guia especializado.");
    expect(offer.pitch.en).toBe("A privately guided walk through downtown Rio’s history, architecture and culture.");
    expect(offer.pitch.es).toBe("Un paseo privado con guía por la historia, la arquitectura y la cultura del centro de Río.");
    expect(offer.benefits.pt).toEqual(["Grupo privativo de 1 a 4 turistas", "Horário e roteiro combinados com a equipe", "Acompanhamento de guia durante a caminhada"]);
    expect(MOCK_TOUR_CONTENT[CENTRO_ID].status).toBe("DRAFT");
    expect(MOCK_TOUR_CONTENT[CENTRO_ID].images.every((image) => image.rightsStatus === "UNVERIFIED")).toBe(true);
    expect(PROTOTYPE_OFFER["cmli1a6im000034zqqzc9sppb"]).toMatchObject({ pitchStatus: "CONFIRMED", benefitsStatus: "PROVISIONAL" });
    expect(PROTOTYPE_OFFER["cmlhxkpy9000028zq27rhytew"]).toMatchObject({ pitchStatus: "PROVISIONAL", benefitsStatus: "PROVISIONAL" });
    expect(PROTOTYPE_OFFER["cmljo0s1u0000t0zqa0bpd23p"]).toMatchObject({ pitchStatus: "MOCK", benefitsStatus: "MOCK" });
  });
});

describe("TOUR-03 commercial presentation: 'A partir de R$ 260 por pessoa' (Owner decision 21/10/2026)", () => {
  const ROCINHA = "cmli1a6im000034zqqzc9sppb";
  const CRISTO = "cmlhxkpy9000028zq27rhytew";
  const PREMIUM = "cmljo0s1u0000t0zqa0bpd23p";
  const render = (id: string, locale: "pt" | "en" | "es", showProvisionalPrices = true) =>
    renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[id]} content={toTourContentView(MOCK_TOUR_CONTENT[id], locale, "preview")!} locale={locale} reviewMode showProvisionalPrices={showProvisionalPrices} />).replace(/[  ]/g, " ");
  const textOf = (html: string, testId: string) => html.match(new RegExp(`data-testid="${testId}"[^>]*>([^<]*)<`))?.[1];
  const badgeAfter = (html: string, testId: string) => {
    const start = html.indexOf(`data-testid="${testId}"`);
    return start < 0 ? undefined : html.slice(start).match(/data-status="(\w+)"/)?.[1];
  };

  it("leads with the lowest approved per-person fare, which is the 4-guest, 4-hour rate of the approved table", () => {
    const rows = CENTRO_APPROVED_PRICING.durations.flatMap((duration) => duration.prices.map((row) => ({ hours: duration.hours, ...row })));
    const lowest = rows.reduce((min, row) => (row.perPersonCents < min.perPersonCents ? row : min));
    expect(lowest).toMatchObject({ hours: 4, participants: 4, perPersonCents: 26000 });
    const html = render(CENTRO_ID, "pt");
    expect(textOf(html, "tour-price")).toBe("A partir de R$ 260 por pessoa");
    expect(textOf(html, "tour-price-condition")).toBe("Valor por pessoa para grupos de 4 participantes, no passeio privativo de 4 horas.");
    const card = html.slice(html.indexOf('data-testid="tour-booking-card"'), html.indexOf("</header>"));
    expect(card).toContain("A partir de R$ 260 por pessoa");
    expect(card).toContain('data-testid="tour-price-condition"');
    expect(card).toContain("Solicitar disponibilidade");
    expect(card).not.toContain('data-testid="tour-approved-prices"'); // the table left the price card
    expect(html).toContain("A partir de R$ 260 por pessoa</p>"); // sticky aside / mobile bar reuse the summary
  });

  it("keeps all 8 approved fares, the extra-hour rule and the infant policy in a 'Valores e opções do passeio' section further down", () => {
    const html = render(CENTRO_ID, "pt");
    const section = html.indexOf('data-testid="tour-pricing-section"');
    expect(section).toBeGreaterThan(html.indexOf('data-testid="centro-route-options"'));
    expect(section).toBeLessThan(html.indexOf('data-testid="tour-includes"'));
    expect(html).toContain(">Valores e opções do passeio");
    const table = html.slice(html.indexOf('data-testid="tour-approved-prices"'), html.indexOf("</section>", section));
    const cells = [...table.matchAll(/<td class="py-1">([^<]+)<\/td>/g)].map((m) => m[1]);
    expect(cells).toEqual([
      "R$ 650,00", "R$ 650,00", "R$ 380,00", "R$ 760,00", "R$ 300,00", "R$ 900,00", "R$ 260,00", "R$ 1.040,00",
      "R$ 890,00", "R$ 890,00", "R$ 500,00", "R$ 1.000,00", "R$ 380,00", "R$ 1.140,00", "R$ 320,00", "R$ 1.280,00",
    ]);
    expect(table).toContain("Hora adicional: R$ 120,00 por grupo.");
    expect(table).toContain("Crianças de 0 a 2 anos pagam 50% da tarifa individual");
    expect(CENTRO_APPROVED_PRICING.additionalHourPerGroupCents).toBe(12000);
  });

  it("is CONFIRMED in PT and PENDING in EN/ES (translations not approved), with localized copy", () => {
    const expected = {
      pt: ["A partir de R$ 260 por pessoa", "CONFIRMED"],
      en: ["From R$ 260 per person", "PENDING"],
      es: ["Desde R$ 260 por persona", "PENDING"],
    } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const html = render(CENTRO_ID, locale);
      expect(textOf(html, "tour-price"), locale).toBe(expected[locale][0]);
      expect(badgeAfter(html, "tour-booking-card"), locale).toBe(expected[locale][1]);
      expect(badgeAfter(html, "tour-pricing-section"), locale).toBe(expected[locale][1]);
    }
  });

  it("does not touch TOUR-01, TOUR-02 or TOUR-04 and never uses R$ 260 for them", () => {
    for (const id of [CRISTO, ROCINHA, PREMIUM]) {
      for (const hidden of [true, false]) {
        const html = render(id, "pt", hidden);
        expect(html, id).not.toContain("R$ 260");
        expect(html, id).not.toContain("A partir de");
        expect(html, id).not.toContain('data-testid="tour-price-condition"');
        expect(html, id).not.toContain('data-testid="tour-pricing-section"');
      }
      expect(PROTOTYPE_OFFER[id].priceSummary, id).toBeUndefined();
      expect(PROTOTYPE_OFFER[id].priceCondition, id).toBeUndefined();
    }
    expect(textOf(render(ROCINHA, "pt", false), "tour-price")).toBe("Orçamento sob consulta");
    expect(textOf(render(CRISTO, "pt", false), "tour-price")).toBe("Orçamento sob consulta");
  });
});
