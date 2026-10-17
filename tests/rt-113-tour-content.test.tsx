import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { focalToPosition, toTourContentView, validateTourContent, type TourContentRecord } from "@/lib/catalog/tour-content";
import { MOCK_SOURCE, MOCK_TOUR_CONTENT, PROTOTYPE_OFFER, PUBLISHED_SNAPSHOT } from "@/lib/catalog/mock/tour-content.mock";
import { tourContentCopy } from "@/components/site/tour/content/tour-content-copy";
import { TourDetailPrototype } from "@/components/site/tour/content/tour-detail-prototype";
import { ImageGallery } from "@/components/site/media/image-gallery";

const tri = (pt: string, en: string, es: string) => ({ pt, en, es });

function approvedRecord(overrides: Partial<TourContentRecord> = {}): TourContentRecord {
  return {
    tripId: "trip-test",
    status: "OWNER_APPROVED",
    source: "Owner intake RT-112, 2026-10-20",
    approvedAt: "2026-10-20T10:00:00.000Z",
    meetingPoint: tri("Ponto A", "Point A", "Punto A"),
    languages: ["pt", "en"],
    inclusions: { pt: ["Guia"], en: ["Guide"], es: ["Guía"] },
    itinerary: [
      { position: 1, title: tri("Segunda", "Second", "Segunda"), durationMinutes: 30 },
      { position: 0, title: tri("Primeira", "First", "Primera") },
    ],
    images: [
      { position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: false, rightsStatus: "OWNER_ATTESTED" },
      { position: 1, src: "/b.jpg", alt: tri("b", "b", "b"), isCover: true, rightsStatus: "LICENSED" },
      { position: 2, src: "/c.jpg", alt: tri("c", "c", "c"), isCover: false, rightsStatus: "UNVERIFIED" },
    ],
    ...overrides,
  };
}

describe("RT-113 publication gate (toTourContentView)", () => {
  it("never shows DRAFT content publicly", () => {
    expect(toTourContentView(approvedRecord({ status: "DRAFT", approvedAt: null }), "pt", "public")).toBeNull();
  });

  it("never shows MOCK content publicly, even if someone marks it approved", () => {
    expect(toTourContentView(approvedRecord({ source: MOCK_SOURCE }), "pt", "public")).toBeNull();
    for (const record of Object.values(MOCK_TOUR_CONTENT)) expect(toTourContentView(record, "en", "public")).toBeNull();
  });

  it("shows approved content in the requested locale, orders the itinerary and puts the cover first", () => {
    const view = toTourContentView(approvedRecord(), "en", "public");
    expect(view?.meetingPoint).toBe("Point A");
    expect(view?.itinerary.map((s) => s.title)).toEqual(["First", "Second"]);
    expect(view?.gallery[0].src).toBe("/b.jpg");
  });

  it("hides images without recorded rights publicly, but shows them in the lab preview", () => {
    expect(toTourContentView(approvedRecord(), "pt", "public")?.gallery.map((g) => g.src)).toEqual(["/b.jpg", "/a.jpg"]);
    expect(toTourContentView(approvedRecord(), "pt", "preview")?.gallery).toHaveLength(3);
  });

  it("does not fall back to Portuguese publicly; the preview falls back and reports it", () => {
    const record = approvedRecord({ meetingPoint: { pt: "Só PT" } });
    expect(toTourContentView(record, "es", "public")?.meetingPoint).toBeNull();
    const preview = toTourContentView(record, "es", "preview");
    expect(preview?.meetingPoint).toBe("Só PT");
    expect(preview?.missingLocale).toContain("meetingPoint");
  });
});

describe("RT-113 / RT-115 editorial validation (validateTourContent)", () => {
  it("accepts a complete approved record", () => {
    expect(validateTourContent(approvedRecord())).toEqual([]);
  });

  it("requires PT, EN and ES for every localized field", () => {
    const issues = validateTourContent(approvedRecord({ meetingPoint: { pt: "A", en: "A" } }));
    expect(issues).toContainEqual({ field: "meetingPoint", problem: "missing es" });
  });

  it("rejects prices inside the content (prices live on Trip only)", () => {
    const issues = validateTourContent(approvedRecord({ summary: tri("Por R$ 385", "For R$ 385", "Por R$ 385") }));
    expect(issues.some((i) => i.problem.startsWith("price-like"))).toBe(true);
  });

  it("rejects approving MOCK content, two covers, duplicate stops and invalid language codes", () => {
    const issues = validateTourContent(
      approvedRecord({
        source: MOCK_SOURCE,
        languages: ["pt", "english"],
        itinerary: [
          { position: 0, title: tri("a", "a", "a") },
          { position: 0, title: tri("b", "b", "b") },
        ],
        images: [
          { position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: true, rightsStatus: "OWNER_ATTESTED" },
          { position: 1, src: "/b.jpg", alt: tri("b", "b", "b"), isCover: true, rightsStatus: "OWNER_ATTESTED" },
        ],
      }),
    );
    const problems = issues.map((i) => i.problem);
    expect(problems).toContain("MOCK content can never be approved");
    expect(problems).toContain("more than one cover image");
    expect(problems).toContain("duplicate positions");
    expect(problems).toContain("not an ISO 639-1 code: english");
  });

  it("requires an approval date and a recorded source for approved content", () => {
    const problems = validateTourContent(approvedRecord({ approvedAt: null, source: null })).map((i) => i.field);
    expect(problems).toEqual(expect.arrayContaining(["approvedAt", "source"]));
  });
});

describe("RT-114 mock data integrity", () => {
  it("covers exactly the four existing tours and never changes the published prices", () => {
    expect(Object.keys(PUBLISHED_SNAPSHOT).sort()).toEqual(
      ["cmlhxkpy9000028zq27rhytew", "cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"].sort(),
    );
    expect(Object.fromEntries(Object.values(PUBLISHED_SNAPSHOT).map((s) => [s.id, s.priceCents]))).toEqual({
      cmlhxkpy9000028zq27rhytew: 38500,
      cmli1a6im000034zqqzc9sppb: 12000,
      cmlibniq40000z4zqkbujnutt: 24500,
      cmljo0s1u0000t0zqa0bpd23p: 90000,
    });
  });

  it("marks every mock record as MOCK and DRAFT, and every mock text as fictitious in its language", () => {
    for (const record of Object.values(MOCK_TOUR_CONTENT)) {
      expect(record.source).toMatch(/^MOCK/);
      expect(record.status).toBe("DRAFT");
      const texts = [record.meetingPoint, record.startTimeNote, record.requirements, record.accessibility, record.weatherPolicy, ...record.itinerary.map((s) => s.title)];
      for (const t of texts) {
        expect(t?.pt).toMatch(/exemplo fictício/);
        expect(t?.en).toMatch(/fictitious example/);
        expect(t?.es).toMatch(/ejemplo ficticio/);
      }
    }
  });

  it("uses only existing photos whose rights are already recorded", () => {
    const allowed = new Set([...Object.values(PUBLISHED_SNAPSHOT).map((s) => s.cover), "/media/rio-story/rio-story-sunset.jpg", "/media/rio-story/rio-story-church.jpg"]);
    for (const record of Object.values(MOCK_TOUR_CONTENT)) {
      for (const img of record.images) {
        expect(allowed.has(img.src)).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), "public", img.src))).toBe(true);
      }
    }
  });

  it("is never imported by public routes, APIs or public components", () => {
    const roots = ["app/[locale]/(site)", "app/[locale]/(public)", "app/api", "components/site", "lib/catalog/public-trips.ts"];
    const offenders: string[] = [];
    const walk = (p: string) => {
      const abs = path.join(process.cwd(), p);
      if (!fs.existsSync(abs)) return;
      if (fs.statSync(abs).isDirectory()) for (const entry of fs.readdirSync(abs)) walk(path.join(p, entry));
      else if (/\.(tsx?|mjs)$/.test(p) && fs.readFileSync(abs, "utf8").includes("tour-content.mock")) offenders.push(p);
    };
    roots.forEach(walk);
    expect(offenders).toEqual([]);
  });
});

describe("RT-114 copy and prototype rendering (round 1 + Owner addendum)", () => {
  const galleryLabels = { gallery: "Galeria", prev: "Anterior", next: "Próxima", thumb: "Mostrar foto {n} de {total}", position: "Foto {n} de {total}" };
  const render = (id: string, locale: string) => {
    const view = toTourContentView(MOCK_TOUR_CONTENT[id], locale, "preview")!;
    return renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[id]} content={view} locale={locale} reviewMode />);
  };

  it("has the same label keys in PT, EN and ES", () => {
    const keys = Object.keys(tourContentCopy.pt).sort();
    expect(Object.keys(tourContentCopy.en).sort()).toEqual(keys);
    expect(Object.keys(tourContentCopy.es).sort()).toEqual(keys);
  });

  it("passes only serializable labels to the client gallery (functions cannot cross the server/client boundary)", () => {
    for (const copy of Object.values(tourContentCopy)) {
      for (const key of ["gallery", "galleryPrev", "galleryNext", "galleryThumb", "galleryPosition"] as const) expect(typeof copy[key]).toBe("string");
      expect(copy.galleryThumb).toContain("{n}");
      expect(copy.galleryPosition).toContain("{total}");
    }
  });

  it("renders the primary CTA 'Solicitar disponibilidade' (PT/EN/ES), the sticky aside and the mobile bar", () => {
    const cta = { pt: "Solicitar disponibilidade", en: "Request availability", es: "Solicitar disponibilidad" } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const html = render("cmlhxkpy9000028zq27rhytew", locale);
      expect(html).toContain(cta[locale]);
      for (const id of ["tour-cta", "tour-cta-aside", "tour-cta-mobile", "tour-mobile-cta", "tour-request", "mock-banner"]) expect(html).toContain(`data-testid="${id}"`);
      for (const section of ["tour-practical", "tour-benefits", "tour-itinerary", "tour-includes", "tour-notes", "image-gallery"]) expect(html).toContain(`data-testid="${section}"`);
    }
  });

  it("never carries old catalog prices, durations or routes into the prototype; price shows as pending", () => {
    for (const id of Object.keys(PROTOTYPE_OFFER)) {
      expect(PROTOTYPE_OFFER[id].priceCents).toBeNull();
      expect(PROTOTYPE_OFFER[id].modality.status).toBe("CONFIRMED");
      const html = render(id, "pt");
      for (const old of ["R$ 385,00", "R$ 120,00", "R$ 245,00", "R$ 900,00", "5–6 horas", "5 a 6 horas", "Transporte em van", "8 horas", "3 a 4 horas"]) {
        expect(html, `${id} must not show ${old}`).not.toContain(old);
      }
      expect(html).toContain("Em definição");
      expect(html).toContain('data-status="PENDING"');
    }
  });

  it("uses the Design System dark surface (Home 'Experiences' tokens), not a dominant beige", () => {
    const html = render("cmljo0s1u0000t0zqa0bpd23p", "pt");
    expect(html).toContain('data-testid="tour-page-surface"');
    expect(html).toMatch(/bg-\[var\(--site-charcoal,#0B0E11\)\]/);
    expect(html).not.toMatch(/bg-\[var\(--site-cream/);
    expect(html).toContain("bg-[var(--site-gold,#C8A86B)]"); // DS primary CTA (solid matte gold)
  });

  it("adapts the gallery to the number of images: 1 image has no controls or empty slots; 8 images get 8 thumbnails", () => {
    const one = renderToStaticMarkup(<ImageGallery images={[{ src: "/a.jpg", alt: "a" }]} labels={galleryLabels} />);
    expect(one).toContain('data-count="1"');
    expect(one).not.toContain('data-testid="gallery-thumbs"');
    expect(one).not.toContain("Próxima");
    const eight = renderToStaticMarkup(<ImageGallery images={Array.from({ length: 8 }, (_, i) => ({ src: `/p${i}.jpg`, alt: `p${i}` }))} labels={galleryLabels} />);
    expect(eight).toContain('data-count="8"');
    expect((eight.match(/Mostrar foto \d de 8/g) ?? []).length).toBe(8);
    expect(eight).toContain("object-contain"); // the main photo is never cropped
  });

  it("converts and validates the framing focal point", () => {
    expect(focalToPosition(undefined, null)).toBe("50% 50%");
    expect(focalToPosition(0.3, 0.75)).toBe("30% 75%");
    expect(focalToPosition(2, -1)).toBe("100% 0%");
    const record = approvedRecord({ images: [{ position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: true, rightsStatus: "OWNER_ATTESTED", focalX: 1.4 }] });
    expect(validateTourContent(record).map((i) => i.problem)).toContain("focal point must be between 0 and 1");
  });
});
