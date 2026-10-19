import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { approveRecord, contentFingerprint, focalToPosition, isMockRecord, toTourContentView, validateTourContent, type TourContentRecord } from "@/lib/catalog/tour-content";
import { MOCK_SOURCE, MOCK_TOUR_CONTENT, PROTOTYPE_OFFER, PUBLISHED_SNAPSHOT } from "@/lib/catalog/mock/tour-content.mock";
import { tourContentCopy } from "@/components/site/tour/content/tour-content-copy";
import { TourDetailPrototype, offerForReview } from "@/components/site/tour/content/tour-detail-prototype";
import { ImageGallery } from "@/components/site/media/image-gallery";

const tri = (pt: string, en: string, es: string) => ({ pt, en, es });

function approvedRecord(overrides: Partial<TourContentRecord> = {}): TourContentRecord {
  const r: TourContentRecord = {
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
  // RT-119: an approval is bound to the content fingerprint (computed after the overrides, unless a test sets it).
  return r.status === "OWNER_APPROVED" && !("approvedContentHash" in overrides) ? stamp(r) : r;
}

/** Test-only approval stamp WITHOUT the approvalFor guard, so invalid/mock "approved" fixtures can prove that validation
 *  and the public gate still reject them. Real approvals go through approveRecord/approveTourContent (guarded). */
function stamp(r: TourContentRecord): TourContentRecord {
  return { ...r, approvedContentHash: contentFingerprint(r), images: r.images.map((m) => ({ ...m, publicationApprovedAt: m.rightsStatus !== "UNVERIFIED" ? r.approvedAt : null })) };
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
    // Rocinha and Cristo + Pão have real draft copy; Centro has only Owner-selected media. Premium stays fictitious.
    for (const record of Object.values(MOCK_TOUR_CONTENT).filter((r) => !["cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt", "cmlhxkpy9000028zq27rhytew"].includes(r.tripId))) {
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
        // RT-116: Owner-approved real photographs live under /media/tours/<tour>/ and must carry an Owner attestation.
        const ownerApproved = img.src.startsWith("/media/tours/") && img.rightsStatus === "OWNER_ATTESTED" && /^Owner, \d{2}\/\d{2}\/\d{4}/.test(img.rightsNote ?? "");
        // Third-party candidates may appear in the lab only as UNVERIFIED (the public gate hides them).
        const thirdPartyCandidate = img.src.startsWith("/media/tours/") && img.rightsStatus === "UNVERIFIED" && /^UNVERIFIED third-party photo/.test(img.rightsNote ?? "");
        // Owner-declared media whose rights are still pending documentary verification (Owner decision 17/10/2026).
        const pendingRights = img.src.startsWith("/media/tours/") && img.rightsStatus === "UNVERIFIED" && /^PENDING rights verification/.test(img.rightsNote ?? "");
        const centroLocalPreview = img.src.startsWith("/media/tours/centro-historico-cultural/") && img.rightsStatus === "UNVERIFIED" && /Commercial use and image rights remain under review/.test(img.rightsNote ?? "");
        expect(allowed.has(img.src) || ownerApproved || thirdPartyCandidate || pendingRights || centroLocalPreview, img.src).toBe(true);
        expect(fs.existsSync(path.join(process.cwd(), "public", img.src))).toBe(true);
      }
    }
  });

  it("keeps the Centro media preview local and omits unconfirmed sales facts", () => {
    const id = "cmlibniq40000z4zqkbujnutt";
    const record = MOCK_TOUR_CONTENT[id];
    const offer = PROTOTYPE_OFFER[id];
    expect(record.status).toBe("DRAFT");
    expect(record.images.map((image) => image.src)).toEqual([
      "/media/tours/centro-historico-cultural/centro-historico-img-1337.webp",
      "/media/tours/centro-historico-cultural/centro-historico-img-1802.webp",
      "/media/tours/centro-historico-cultural/centro-historico-img-1328.webp",
      "/media/tours/centro-historico-cultural/centro-historico-img-1321.webp",
      "/media/tours/centro-historico-cultural/centro-historico-img-1332.webp",
      "/media/tours/centro-historico-cultural/centro-historico-img-1136.webp",
      "/media/tours/centro-historico-cultural/centro-historico-museu-do-amanha.webp",
    ]);
    expect(record.images.every((image) => image.rightsStatus === "UNVERIFIED" && image.alt.pt && image.alt.en && image.alt.es)).toBe(true);
    expect(toTourContentView(record, "pt", "public")).toBeNull();
    expect(record.itinerary).toEqual([]);
    expect(record.languages).toEqual([]);
    expect(offer.priceCents).toBeNull();
    expect(offer.pitch).toEqual({});
    expect(offer.modality.value).toEqual({});
    expect(offer.pickup.value).toEqual({});
    expect(offer.title).toBe("Centro Histórico e Cultural do Rio");
  });

  it("is never imported by public routes, APIs or public components", () => {
    const roots = ["app/[locale]/(site)", "app/[locale]/(public)", "app/api", "components/site", "lib/catalog/public-trips.ts"];
    const offenders: string[] = [];
    const walk = (p: string) => {
      const abs = path.join(process.cwd(), p);
      if (!fs.existsSync(abs)) return;
      if (fs.statSync(abs).isDirectory()) for (const entry of fs.readdirSync(abs)) walk(path.join(p, entry));
      else if (/\.(tsx?|mjs)$/.test(p) && /tour-content\.mock|catalog\/drafts\/|catalog\/content-load|catalog\/content-approval/.test(fs.readFileSync(abs, "utf8"))) offenders.push(p);
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
      expect(PROTOTYPE_OFFER[id].modality.status).toBe(id === "cmlibniq40000z4zqkbujnutt" ? "PENDING" : "CONFIRMED");
      const html = render(id, "pt");
      // TOUR-01: "Aproximadamente 8 horas" is the Owner-approved duration (Ficha v1.0 §4.1), not the old Premium value.
      const exempt = id === "cmlhxkpy9000028zq27rhytew" ? ["8 horas"] : [];
      for (const old of ["R$ 385,00", "R$ 120,00", "R$ 245,00", "R$ 900,00", "5–6 horas", "5 a 6 horas", "Transporte em van", "8 horas", "3 a 4 horas"].filter((o) => !exempt.includes(o))) {
        expect(html, `${id} must not show ${old}`).not.toContain(old);
      }
      expect(html).toContain("Orçamento sob consulta");
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

describe("RT-116 Favela Rocinha media (Owner decision 17/10/2026)", () => {
  const ROCINHA = "cmli1a6im000034zqqzc9sppb";
  const ORDER = ["rocinha-01-panorama-bandeira.jpg", "rocinha-02-beco.jpg", "rocinha-03-mural.jpg", "rocinha-04-mirante-deck.jpg", "rocinha-05-panorama.jpg"];

  it("keeps the Owner's 5 photos in the approved order, cover first, rights pending (UNVERIFIED), with PT/EN/ES alt text", () => {
    const record = MOCK_TOUR_CONTENT[ROCINHA];
    expect(record.images.map((img) => path.basename(img.src))).toEqual(ORDER);
    expect(record.images.filter((img) => img.isCover).map((img) => path.basename(img.src))).toEqual([ORDER[0]]);
    for (const img of record.images) {
      expect(img.rightsStatus).toBe("UNVERIFIED"); // Owner decision 17/10/2026: declaration ≠ proof of rights
      for (const l of ["pt", "en", "es"] as const) {
        expect(img.alt[l]?.trim()).toBeTruthy();
        expect(img.alt[l]).not.toMatch(/fictício|fictitious|ficticio/);
      }
    }
    const view = toTourContentView(record, "pt", "preview")!;
    expect(view.gallery.map((g) => path.basename(g.src))).toEqual(ORDER);
    expect(view.gallery[2].credit).toBe("Mural com a inscrição “@WARK ROCINHA...”"); // transcription; identity not verified
    expect(PROTOTYPE_OFFER[ROCINHA].coverStatus).toBe("CONFIRMED");
    // The record stays MOCK/DRAFT: the public gate never shows it.
    expect(toTourContentView(record, "pt", "public")).toBeNull();
  });

  it("ships web copies without EXIF/GPS, XMP or ICC metadata, at most 2000 px and 700 KB", async () => {
    const sharp = (await import("sharp")).default;
    const files = [...MOCK_TOUR_CONTENT[ROCINHA].images.map((img) => img.src), PROTOTYPE_OFFER[ROCINHA].video!.poster];
    for (const src of files) {
      const file = path.join(process.cwd(), "public", src);
      const meta = await sharp(file).metadata();
      expect(meta.exif, src).toBeUndefined();
      expect(meta.xmp, src).toBeUndefined();
      expect(meta.icc, src).toBeUndefined();
      expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(2000);
      expect(fs.statSync(file).size).toBeLessThan(700 * 1024);
    }
  });

  it("uses a clip of at most 18 s, without audio, location or other metadata (MP4 atoms)", () => {
    const video = PROTOTYPE_OFFER[ROCINHA].video!;
    expect(video.durationSeconds).toBeLessThanOrEqual(18);
    expect(video.status).toBe("PROVISIONAL"); // the Owner reviews the clip before final approval
    const buf = fs.readFileSync(path.join(process.cwd(), "public", video.src));
    expect(buf.length).toBeLessThan(5 * 1024 * 1024);
    expect(buf.includes(Buffer.from("soun"))).toBe(false); // no audio track handler
    for (const atom of ["©xyz", "com.apple.quicktime.location", "com.apple.quicktime.model"]) expect(buf.includes(Buffer.from(atom, "latin1")), atom).toBe(false);
    for (const other of ["cmlibniq40000z4zqkbujnutt", "cmljo0s1u0000t0zqa0bpd23p"]) expect(PROTOTYPE_OFFER[other].video).toBeNull();
  });

  it("lets the thumbnail strip scroll inside narrow columns (5 photos overflowed a 390 px phone before the fix)", () => {
    const view = toTourContentView(MOCK_TOUR_CONTENT[ROCINHA], "pt", "preview")!;
    const html = renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[ROCINHA]} content={view} locale="pt" reviewMode />);
    expect(html).toMatch(/data-testid="image-gallery" data-count="5" class="min-w-0"/);
    expect(html).toContain('class="relative min-w-0 lg:col-span-7"');
  });

  it("renders the video block on request only (no autoplay, preload none, poster, inline) in PT/EN/ES", () => {
    const titles = { pt: "A Rocinha em movimento", en: "Rocinha in motion", es: "La Rocinha en movimiento" } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const view = toTourContentView(MOCK_TOUR_CONTENT[ROCINHA], locale, "preview")!;
      const html = renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[ROCINHA]} content={view} locale={locale} reviewMode />);
      expect(html).toContain('data-testid="tour-video"');
      expect(html).toContain(titles[locale]);
      expect(html).toContain('preload="none"');
      expect(html).toContain('poster="/media/tours/favela-rocinha/rocinha-praca-movimento-poster.jpg"');
      // `muted` is a DOM property React does not serialize on the server; the clip has no audio track at all (test above).
      expect(html).toMatch(/<video[^>]*playsInline|<video[^>]*playsinline/);
      expect(html).not.toMatch(/autoplay/i);
      expect(html).toContain('data-count="5"');
      expect(html).not.toContain("RT-116"); // the provisional-cover note is gone for the confirmed cover
    }
  });
});

describe("RT-116 lighter mobile clips and Cristo + Pão de Açúcar + Selarón preview (17/10/2026)", () => {
  const CRISTO = "cmlhxkpy9000028zq27rhytew";
  const ROCINHA = "cmli1a6im000034zqqzc9sppb";
  const file = (src: string) => fs.readFileSync(path.join(process.cwd(), "public", src));

  it("serves a lighter rendition to small screens, smaller than the full clip, without audio or location atoms", () => {
    for (const id of [ROCINHA, CRISTO]) {
      const video = PROTOTYPE_OFFER[id].video!;
      expect(video.mobileSrc, id).toBeTruthy();
      expect(video.durationSeconds).toBeLessThanOrEqual(18);
      const full = file(video.src);
      const mobile = file(video.mobileSrc!);
      expect(mobile.length).toBeLessThan(full.length);
      expect(mobile.length).toBeLessThan(2.2 * 1024 * 1024);
      for (const buf of [full, mobile]) {
        expect(buf.includes(Buffer.from("soun"))).toBe(false);
        for (const atom of ["com.apple.quicktime.location", "com.apple.quicktime.model"]) expect(buf.includes(Buffer.from(atom, "latin1"))).toBe(false);
      }
      const view = toTourContentView(MOCK_TOUR_CONTENT[id], "pt", "preview")!;
      const html = renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[id]} content={view} locale="pt" reviewMode />);
      expect(html).toContain(`<source src="${video.mobileSrc}" type="video/mp4" media="(max-width: 767px)"/>`);
      expect(html.indexOf(video.mobileSrc!)).toBeLessThan(html.indexOf(`<source src="${video.src}"`)); // mobile source listed first
      expect(html).toContain(video.title.pt!);
    }
  });

  it("shows only the 4 identified own photos (third-party candidates removed 18/10); never the unapproved IMG_1180", () => {
    const record = MOCK_TOUR_CONTENT[CRISTO];
    expect(record.images.map((img) => path.basename(img.src))).toEqual([
      "pao-01-IMG_1162-mirante.webp",
      "pao-02-IMG_1171-bondinho-cume.webp",
      "pao-03-IMG_1163-mirante-baia.webp",
      "pao-04-IMG_1181-visitante-deck.webp",
    ]);
    expect(record.images.some((img) => /1179|1180|img5/.test(img.src))).toBe(false);
    for (const img of record.images) {
      expect(fs.existsSync(path.join(process.cwd(), "public", img.src))).toBe(true);
      // Owner rule 17/10/2026 (Manual §10.17): a declaration is not proof of rights -> PENDING, never public.
      expect(img.rightsStatus).toBe("UNVERIFIED");
      expect(img.rightsNote).toMatch(/^PENDING rights verification/);
      expect(img.src).not.toContain("terceiros-");
    }
    // The cover/order is a proposal, and the third-party photos would be hidden publicly even if the record were approved.
    expect(PROTOTYPE_OFFER[CRISTO].coverStatus).toBe("PROVISIONAL");
    const nonMock = { ...record, source: "Owner test" }; // approvalFor refuses MOCK records (RT-119 guard)
    const approved = approveRecord(nonMock, new Date("2026-10-17"));
    // Even an approved record would publish none of these photos until their rights are verified.
    expect(toTourContentView(approved, "pt", "public")!.gallery).toHaveLength(0);
  });

  it("ships the photo web copies and the poster without EXIF, XMP or ICC", async () => {
    const sharp = (await import("sharp")).default;
    for (const src of [...MOCK_TOUR_CONTENT[CRISTO].images.map((img) => img.src), PROTOTYPE_OFFER[CRISTO].video!.poster]) {
      const meta = await sharp(path.join(process.cwd(), "public", src)).metadata();
      expect(meta.exif, src).toBeUndefined();
      expect(meta.xmp, src).toBeUndefined();
      expect(meta.icc, src).toBeUndefined();
    }
  });
});

describe("RT-115 / RT-112 Rocinha real content (Owner commercial closing 17/10/2026)", () => {
  const ROC = "cmli1a6im000034zqqzc9sppb";
  const record = MOCK_TOUR_CONTENT[ROC];
  const renderRoc = (locale: string, reviewMode: boolean) =>
    renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[ROC]} content={toTourContentView(record, locale, "preview")!} locale={locale} reviewMode={reviewMode} />);
  const allText = JSON.stringify({ record: { ...record, images: undefined }, offer: { ...PROTOTYPE_OFFER[ROC], provisionalPricing: undefined } });

  it("is real draft content: not MOCK, DRAFT, valid in PT/EN/ES, and never public", () => {
    expect(isMockRecord(record)).toBe(false);
    expect(record.status).toBe("DRAFT");
    expect(validateTourContent(record)).toEqual([]);
    expect(toTourContentView(record, "pt", "public")).toBeNull();
    for (const locale of ["pt", "en", "es"]) {
      const view = toTourContentView(record, locale, "preview")!;
      expect(view.missingLocale).toEqual([]);
      expect(view.paragraphs.length).toBe(4);
      expect(view.itinerary.length).toBe(8);
      expect(view.inclusions.length).toBe(6);
      expect(view.exclusions.length).toBe(7);
      expect(view.faq.length).toBe(7);
      expect(view.operationalConditions && view.optionalServicesNote && view.accessibility && view.requirements && view.meetingPoint).toBeTruthy();
    }
  });

  it("avoids unsourced or forbidden claims and never exposes internal costs", () => {
    for (const banned of [/maior favela/i, /largest favela/i, /favela más grande/i, /livre de riscos|100% segur|segurança garantida|completely safe|totally safe|risk-free|sin riesgos/i, /taxa (de entrada|obrigat)|entrance fee|tasa de entrada/i, /proibid|prohibited|prohibid/i, /custo|remunera|margem|lucro|\bcosts?\b|margin|profit/i, /R\$/, /tarifa do operador|operator fee|tarifa del operador/i, /conforme a operação do dia/i]) {
      expect(allText, String(banned)).not.toMatch(banned);
    }
    // Conditional wording for things that depend on the day or on RT-81.
    expect(record.operationalConditions?.pt).toMatch(/O percurso pode mudar por segurança, clima ou acesso/);
    expect(record.faq?.at(-1)?.answer.pt).toMatch(/condições aplicáveis antes da confirmação da reserva/);
    // No cancellation penalties, deadlines or refund percentages before RT-81 (only the 30% deposit of the booking model).
    expect(allText).not.toMatch(/multa|penalt|reembols|refund|penalidad|devoluci/i);
  });

  it("shows the provisional prices only in the lab review mode, clearly labelled, with consistent totals", () => {
    for (const row of PROTOTYPE_OFFER[ROC].provisionalPricing!) expect(row.totalCents).toBe(row.perPersonCents * row.participants);
    const review = renderRoc("pt", true);
    expect(review).toContain("PREÇOS PROVISÓRIOS — NÃO PUBLICAR");
    for (const v of ["R$ 450,00", "R$ 290,00", "R$ 580,00", "R$ 250,00", "R$ 750,00", "R$ 220,00", "R$ 880,00"]) expect(review.replace(/\u00a0/g, " ")).toContain(v);
    const reader = renderRoc("pt", false);
    expect(reader).not.toContain("NÃO PUBLICAR");
    expect(reader).not.toContain("data-testid=\"tour-provisional-prices\"");
    expect(reader.replace(/\u00a0/g, " ")).not.toMatch(/R\$ (450|290|580|250|750|220|880),00/);
    expect(reader).toContain("Orçamento sob consulta");
  });

  it("uses the canonical WhatsApp number with a prefilled message in each language", () => {
    const expected = {
      pt: encodeURIComponent("Tour Favela Rocinha — Experiência Cultural Privativa"),
      en: encodeURIComponent("Rocinha Favela — Private Cultural Tour"),
      es: encodeURIComponent("Tour Privado por la Favela de Rocinha"),
    } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const html = renderRoc(locale, false);
      expect(html).toContain("https://wa.me/5522998461906?text=");
      expect(html).toContain(expected[locale]);
      expect(html).toContain('target="_blank"');
      expect(html).not.toMatch(/5521966819928|5521971168114|travelrick/);
    }
  });

  it("renders the new sections, the localized title and the confirmed essentials", () => {
    const titles = { pt: "Tour Favela Rocinha — Experiência Cultural Privativa", en: "Rocinha Favela — Private Cultural Tour", es: "Tour Privado por la Favela de Rocinha" } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const html = renderRoc(locale, true);
      expect(html).toContain(titles[locale]);
      for (const id of ["tour-about", "tour-faq", "tour-optional", "tour-notes", "tour-itinerary", "tour-includes", "tour-video", "image-gallery"]) expect(html, id).toContain(`data-testid="${id}"`);
      expect(html).not.toContain("exemplo fictício");
      expect(html).not.toContain("fictitious example");
    }
    const pt = renderRoc("pt", true);
    for (const v of ["1 a 4 adultos", "18 anos ou mais", "Aproximadamente 3 horas", "estação de metrô São Conrado"]) expect(pt).toContain(v);
    expect(pt).not.toContain("Busca no hotel");
  });

  it("leaves the Premium tour on its fictitious placeholders", () => {
    for (const id of ["cmljo0s1u0000t0zqa0bpd23p"]) {
      expect(isMockRecord(MOCK_TOUR_CONTENT[id])).toBe(true);
      expect(PROTOTYPE_OFFER[id].provisionalPricing).toBeUndefined();
      expect(PROTOTYPE_OFFER[id].whatsappMessage).toBeUndefined();
    }
  });
});

describe("RT-115 Owner review versions (17/10/2026)", () => {
  const ROC = "cmli1a6im000034zqqzc9sppb";
  const view = (locale: string) => toTourContentView(MOCK_TOUR_CONTENT[ROC], locale, "preview")!;

  it("visual-review version hides the internal prices and shows the quote-on-request label (PT/EN/ES)", () => {
    const label = { pt: "Orçamento sob consulta", en: "Quote on request", es: "Presupuesto a consultar" } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const html = renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[ROC]} content={view(locale)} locale={locale} reviewMode showProvisionalPrices={false} />).replace(/\u00a0/g, " ");
      expect(html).toContain(label[locale]);
      expect(html).not.toContain('data-testid="tour-provisional-prices"');
      expect(html).not.toMatch(/NÃO PUBLICAR|DO NOT PUBLISH|NO PUBLICAR/);
      expect(html).not.toMatch(/R\$ ?\d/);
    }
  });

  it("keeps 'Em definição' for missing non-price facts (duration of the mock tours)", () => {
    const id = "cmlibniq40000z4zqkbujnutt";
    const html = renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[id]} content={toTourContentView(MOCK_TOUR_CONTENT[id], "pt", "preview")!} locale="pt" reviewMode />);
    expect(html).toContain("Em definição");
  });
});

describe("RT-115 Owner-approved editorial corrections (17/10/2026)", () => {
  const ROC = "cmli1a6im000034zqqzc9sppb";
  const record = MOCK_TOUR_CONTENT[ROC];
  const offer = PROTOTYPE_OFFER[ROC];
  const render = (locale: string, showProvisionalPrices = true) =>
    renderToStaticMarkup(<TourDetailPrototype offer={offer} content={toTourContentView(record, locale, "preview")!} locale={locale} reviewMode showProvisionalPrices={showProvisionalPrices} />);

  it("applies exactly the approved names, subtitles and short descriptions", () => {
    expect(offer.titleByLocale).toEqual({ pt: "Tour Favela Rocinha — Experiência Cultural Privativa", en: "Rocinha Favela — Private Cultural Tour", es: "Tour Privado por la Favela de Rocinha" });
    expect(offer.pitch.en).toBe("Discover Rocinha's history, culture and everyday life on a private, guided visit.");
    expect(offer.pitch.es).toBe("Descubre la historia, la cultura y la vida cotidiana de Rocinha en una visita privada con guía.");
    expect(record.summary?.en).toBe("Explore Rocinha on a private cultural tour with a Ricardo Tour guide, motorcycle-taxi rides in both directions included, and a planned panoramic stop.");
    expect(offer.titleStatus).toBe("CONFIRMED");
  });

  it("states that both motorcycle-taxi rides are included and that no extra mandatory charge exists (PT/EN/ES)", () => {
    const both = { pt: /Mototáxi de subida e descida/, en: /Motorcycle-taxi rides up and down/, es: /Mototaxi de subida y bajada/ } as const;
    const none = { pt: /Nenhuma compra ou atividade opcional é obrigatória/, en: /No purchase or optional activity is required/, es: /Ninguna compra ni actividad opcional es obligatoria/ } as const;
    for (const l of ["pt", "en", "es"] as const) {
      expect(record.inclusions?.[l]?.join(" | ")).toMatch(both[l]);
      expect(record.optionalServicesNote?.[l]).toMatch(none[l]);
      expect(record.faq?.[5].answer[l]).toMatch(/subida e descida|both motorcycle-taxi rides|ambos trayectos en mototaxi/);
    }
    // The optional note does not claim that every cultural activity is paid, nor promises dates.
    expect(record.optionalServicesNote?.pt).toMatch(/algumas podem ser pagas/);
    expect(record.optionalServicesNote?.pt).toMatch(/não têm data garantida/);
  });

  it("uses international Spanish (anticipo, de pago, terraza) and the 8-step route", () => {
    const es = JSON.stringify(record).toLowerCase();
    expect(es).toContain("anticipo");
    expect(es).toContain("de pago");
    expect(es).toContain("terraza");
    expect(es).not.toContain("seña");
    expect(record.itinerary.map((s) => s.title.pt)).toEqual([
      "Encontro próximo à estação São Conrado",
      "Orientações iniciais",
      "Subida de mototáxi",
      "Caminhada cultural acompanhada",
      "Paradas culturais conforme acesso",
      "Mirante ou rooftop e fotografias",
      "Descida de mototáxi",
      "Encerramento próximo ao ponto de encontro",
    ]);
  });

  it("prefills the approved WhatsApp messages", () => {
    expect(offer.whatsappMessage?.pt).toMatch(/^Olá! Quero consultar a disponibilidade do Tour Favela Rocinha — Experiência Cultural Privativa\./);
    expect(offer.whatsappMessage?.en).toMatch(/^Hello! I'd like to check availability for Rocinha Favela — Private Cultural Tour\.\nPreferred date: \nGuests \(1–4 adults\): \nPreferred language: $/);
    expect(offer.whatsappMessage?.es).toMatch(/^¡Hola! Quisiera consultar la disponibilidad del Tour Privado por la Favela de Rocinha\./);
  });

  it("visual-review banner carries no price wording; conditions and FAQ stay provisional (RT-81)", () => {
    for (const locale of ["pt", "en", "es"] as const) {
      const html = render(locale, false);
      expect(html).not.toMatch(/preços provisórios|provisional prices|precios provisionales/i);
      expect(html).toMatch(/Prévia de revisão · conteúdo não publicado\.|Review preview · content not published\.|Vista previa de revisión · contenido no publicado\./);
    }
    const html = render("pt");
    expect(html).toMatch(/tour-conditions-heading[\s\S]*?data-status="PROVISIONAL"/);
    expect(html).toMatch(/tour-faq-heading[\s\S]*?data-status="PROVISIONAL"/);
    expect(html).toMatch(/tour-about-heading[\s\S]*?data-status="CONFIRMED"/);
  });
});

describe("RT-115 final verification: approved texts as specification (17/10/2026)", () => {
  const ROC = "cmli1a6im000034zqqzc9sppb";
  const record = MOCK_TOUR_CONTENT[ROC];
  const offer = PROTOTYPE_OFFER[ROC];
  const FAQ: Array<[string, string, string]> = [
    ["Sim. O passeio é reservado exclusivamente para seu grupo, de 1 a 4 adultos.", "Yes. The tour is private for your group of one to four adults.", "Sí. El tour es privado y exclusivo para tu grupo de uno a cuatro adultos."],
    ["Pessoas a partir de 18 anos. O roteiro inclui dois trajetos de mototáxi e caminhada, com possíveis ladeiras e escadas. Informe à equipe qualquer necessidade de mobilidade antes de reservar.", "Adults aged 18 and over. The itinerary includes two motorcycle-taxi rides and walking, possibly on steep streets or stairs. Please tell our team about any mobility needs before booking.", "Personas a partir de 18 años. El recorrido incluye dos trayectos en mototaxi y caminatas, con posibles cuestas y escaleras. Informa a nuestro equipo de cualquier necesidad de movilidad antes de reservar."],
    ["Não nesta modalidade. O encontro e o encerramento acontecem nas proximidades da estação São Conrado. Enviaremos o ponto exato por WhatsApp.", "Not with this option. The tour starts and ends near São Conrado metro station. We'll send the exact meeting spot via WhatsApp.", "No en esta modalidad. El tour comienza y termina cerca de la estación São Conrado. Enviaremos el punto exacto por WhatsApp."],
    ["Solicite disponibilidade. Após confirmar a operação, nossa equipe enviará a proposta e as condições. A reserva é confirmada com sinal de 30%, e o restante é pago antes do início. O site não processa pagamentos.", "Request availability first. Once our team confirms the tour can go ahead, we'll send you a quote and the terms. A 30% deposit confirms the booking, and the balance is due before the tour starts. Payments are not processed on this website.", "Primero solicita disponibilidad. Cuando nuestro equipo confirme la operación, te enviaremos la propuesta y las condiciones. La reserva se confirma con un anticipo del 30% y el resto se paga antes de comenzar. Los pagos no se procesan en este sitio web."],
    ["A equipe informará na proposta quais meios de pagamento estão disponíveis para sua reserva. PIX, cartão ou dinheiro poderão ser oferecidos, conforme a operação confirmada.", "Our team will confirm the payment methods available for your booking in the quote. Depending on the arrangements, options may include PIX, card or cash.", "Nuestro equipo confirmará en la propuesta los medios de pago disponibles para tu reserva. Según la operación, pueden incluir PIX, tarjeta o efectivo."],
    ["Não por serviços obrigatórios do passeio. Guia, mototáxi de subida e descida e serviços locais previstos estão incluídos. Compras, comida, drone ou outras atividades de terceiros são opcionais.", "Not for the services included in your tour. Your guide, both motorcycle-taxi rides and required local services are covered. Shopping, food, drone photos and other third-party activities are optional.", "No por los servicios incluidos en el tour. El guía, ambos trayectos en mototaxi y los servicios locales necesarios están cubiertos. Las compras, la comida, las fotos con dron y otras actividades de terceros son opcionales."],
    ["O percurso pode mudar por segurança, clima ou restrições de acesso. Nossa equipe explicará as opções disponíveis e as condições aplicáveis antes da confirmação da reserva.", "The route may change because of safety, weather or access restrictions. Our team will explain the available options and applicable terms before the booking is confirmed.", "El recorrido puede cambiar por seguridad, clima o restricciones de acceso. Nuestro equipo explicará las opciones disponibles y las condiciones aplicables antes de confirmar la reserva."],
  ];
  const WHATSAPP = {
    pt: "Olá! Quero consultar a disponibilidade do Tour Favela Rocinha — Experiência Cultural Privativa.\nData desejada: \nParticipantes (1 a 4 adultos): \nIdioma preferido: ",
    en: "Hello! I'd like to check availability for Rocinha Favela — Private Cultural Tour.\nPreferred date: \nGuests (1–4 adults): \nPreferred language: ",
    es: "¡Hola! Quisiera consultar la disponibilidad del Tour Privado por la Favela de Rocinha.\nFecha deseada: \nParticipantes (1 a 4 adultos): \nIdioma preferido: ",
  } as const;
  const render = (o: typeof offer, locale: string, showProvisionalPrices: boolean) =>
    renderToStaticMarkup(<TourDetailPrototype offer={o} content={toTourContentView(record, locale, "preview")!} locale={locale} reviewMode showProvisionalPrices={showProvisionalPrices} />);

  it("keeps the 7 approved FAQ answers verbatim in PT/EN/ES", () => {
    expect(record.faq).toHaveLength(7);
    record.faq!.forEach((item, i) => {
      expect(item.answer.pt).toBe(FAQ[i][0]);
      expect(item.answer.en).toBe(FAQ[i][1]);
      expect(item.answer.es).toBe(FAQ[i][2]);
    });
  });

  it("keeps the approved subtitle (PT) and short descriptions (PT/ES)", () => {
    expect(offer.pitch.pt).toBe("Conheça a história, a cultura e o cotidiano da Rocinha em uma experiência privativa, acompanhada por um guia durante a visita.");
    expect(record.summary?.pt).toBe("Explore a Rocinha em uma visita cultural privativa com guia Ricardo Tour, mototáxi de subida e descida incluído e parada panorâmica prevista no roteiro.");
    expect(record.summary?.es).toBe("Recorre Rocinha en un tour cultural privado con guía de Ricardo Tour, subida y bajada en mototaxi incluidas y una parada panorámica prevista.");
  });

  it("sends the exact approved WhatsApp messages to the canonical number", () => {
    for (const l of ["pt", "en", "es"] as const) {
      expect(offer.whatsappMessage?.[l]).toBe(WHATSAPP[l]);
      const html = render(offer, l, false);
      expect(html).toContain(`https://wa.me/5522998461906?text=${encodeURIComponent(WHATSAPP[l].trim())}`.replace(/'/g, "&#x27;"));
    }
  });

  it("keeps the approved PT inclusion and exclusion lists and the EN/ES route titles", () => {
    expect(record.inclusions?.pt).toEqual([
      "Guia Ricardo Tour durante a visita",
      "Caminhada cultural acompanhada",
      "Mototáxi de subida e descida",
      "Serviços locais necessários ao roteiro",
      "Parada panorâmica planejada",
      "Ajuda do guia com fotos de celular",
    ]);
    expect(record.exclusions?.pt).toEqual([
      "Transporte entre o hotel e São Conrado",
      "Alimentação e bebidas",
      "Compras pessoais",
      "Fotografia profissional de terceiros",
      "Serviços de drone",
      "Atividades pagas opcionais",
      "Outros serviços contratados voluntariamente",
    ]);
    for (const l of ["en", "es"] as const) {
      expect(record.inclusions?.[l]).toHaveLength(6);
      expect(record.exclusions?.[l]).toHaveLength(7);
      expect(record.itinerary.map((st) => st.title[l]).every(Boolean)).toBe(true);
    }
    expect(record.itinerary.map((st) => st.title.en)).toEqual([
      "Meeting near São Conrado station", "Short briefing", "Motorcycle-taxi ride up", "Guided cultural walk",
      "Cultural stops, depending on access", "Viewpoint or rooftop and photos", "Motorcycle-taxi ride down", "Finish near the meeting point",
    ]);
  });

  it("keeps the CTA labels unchanged", () => {
    expect([tourContentCopy.pt.cta, tourContentCopy.pt.ctaWhatsapp]).toEqual(["Solicitar disponibilidade", "Conversar no WhatsApp"]);
    expect([tourContentCopy.en.cta, tourContentCopy.en.ctaWhatsapp]).toEqual(["Request availability", "Chat on WhatsApp"]);
    expect([tourContentCopy.es.cta, tourContentCopy.es.ctaWhatsapp]).toEqual(["Solicitar disponibilidad", "Hablar por WhatsApp"]);
  });

  it("strips the internal prices from the offer before rendering in the no-price mode (defence in depth)", () => {
    const stripped = offerForReview(offer, false);
    expect("provisionalPricing" in stripped).toBe(false);
    expect(offerForReview(offer, true).provisionalPricing).toEqual(offer.provisionalPricing);
    // Even if the flag were wrong, a stripped offer cannot render prices.
    const html = render(stripped, "pt", true).replace(/\u00a0/g, " ");
    expect(html).not.toMatch(/R\$ ?\d/);
    expect(html).not.toContain("tour-provisional-prices");
    // Internal prices unchanged.
    expect(offer.provisionalPricing?.map((r) => r.totalCents)).toEqual([45000, 58000, 75000, 88000]);
  });

  it("leaves the Premium tour exactly as before (title, mock pitch, no real-content fields)", () => {
    const expectedPitch: Record<string, string> = {
      cmljo0s1u0000t0zqa0bpd23p: "Um dia inteiro no Rio, com roteiro desenhado para o seu grupo (exemplo fictício)",
    };
    for (const [id, pitch] of Object.entries(expectedPitch)) {
      const o = PROTOTYPE_OFFER[id];
      expect(o.title).toBe(PUBLISHED_SNAPSHOT[id].title);
      expect(o.pitch.pt).toBe(pitch);
      expect(o.titleByLocale).toBeUndefined();
      expect(o.contentStatus).toBeUndefined();
      expect(o.pitchStatus).toBe("MOCK");
    }
  });
});

describe("RT-112 / RT-115 TOUR-01 Cristo Redentor + Pão de Açúcar (Ficha Comercial v1.0 + T1, 18/10/2026)", () => {
  const ID = "cmlhxkpy9000028zq27rhytew";
  const html = (locale: string) =>
    renderToStaticMarkup(<TourDetailPrototype offer={offerForReview(PROTOTYPE_OFFER[ID], false)} content={toTourContentView(MOCK_TOUR_CONTENT[ID], locale, "preview")!} locale={locale} reviewMode showProvisionalPrices={false} />).replace(/\u00a0/g, " ");

  it("is real DRAFT content (not mock), never public, with full PT/EN/ES parity", () => {
    const record = MOCK_TOUR_CONTENT[ID];
    expect(isMockRecord(record)).toBe(false);
    expect(record.status).toBe("DRAFT");
    expect(toTourContentView(record, "pt", "public")).toBeNull();
    const texts = [record.summary, record.description, record.durationLabel, record.meetingPoint, record.startTimeNote, record.requirements, record.accessibility, record.operationalConditions];
    for (const t of texts) for (const l of ["pt", "en", "es"] as const) expect(t?.[l]?.length, l).toBeGreaterThan(5);
    for (const l of ["pt", "en", "es"] as const) {
      expect(record.inclusions?.[l]).toHaveLength(10); // CR-11 / Ficha §11
      expect(record.exclusions?.[l]).toHaveLength(9); // Ficha §12
    }
    expect(record.itinerary).toHaveLength(6);
    expect(record.faq).toHaveLength(8);
    for (const item of [...record.itinerary.map((i) => i.title), ...record.faq!.flatMap((f) => [f.question, f.answer])]) for (const l of ["pt", "en", "es"] as const) expect(item[l]).toBeTruthy();
  });

  it("states the approved facts and never a price (PT/EN/ES)", () => {
    const facts = {
      pt: ["Cristo Redentor + Pão de Açúcar — Tour Privativo", "Aproximadamente 8 horas", "Escadaria Selarón", "Mirante Dona Marta", "Trem do Corcovado", "van oficial", "Copacabana, Ipanema, Leblon, Botafogo, Flamengo e Centro", "0 a 2 anos", "1 a 4 turistas", "Orçamento sob consulta", "Solicitar pelo WhatsApp"],
      en: ["Christ the Redeemer + Sugarloaf Mountain — Private Tour", "Approximately 8 hours", "Selarón Steps", "Dona Marta viewpoint", "Corcovado Train", "official van", "Copacabana, Ipanema, Leblon, Botafogo, Flamengo and Centro", "0 to 2", "1 to 4 guests", "Quote on request", "Request on WhatsApp"],
      es: ["Cristo Redentor + Pan de Azúcar — Tour Privado", "Aproximadamente 8 horas", "Escalera Selarón", "Mirador Dona Marta", "Tren del Corcovado", "van oficial", "Copacabana, Ipanema, Leblon, Botafogo, Flamengo y Centro", "0 a 2 años", "1 a 4 personas", "Presupuesto a consultar", "Solicitar por WhatsApp"],
    } as const;
    for (const locale of ["pt", "en", "es"] as const) {
      const page = html(locale);
      for (const f of facts[locale]) expect(page, `${locale}: ${f}`).toContain(f);
      expect(page).not.toMatch(/R\$ ?\d/); // no price at all (old R$ 385 or any proposal)
      expect(page).not.toContain("terceiros-");
      expect(page).toContain('data-testid="tour-request-whatsapp"');
      expect(page).toContain("https://wa.me/");
    }
  });

  it("marks transport (own vehicle, regularization pending) as PENDING and keeps internal data out", () => {
    const offer = PROTOTYPE_OFFER[ID];
    expect(offer.transport?.status).toBe("PENDING");
    expect(offer.provisionalPricing).toBeUndefined();
    expect(offer.priceCents).toBeNull();
    const all = JSON.stringify({ offer, record: MOCK_TOUR_CONTENT[ID] });
    // Internal data (vehicle, costs, margins, price proposals) lives only in the Manual Mestre's confidential section.
    for (const internal of ["Mégane", "Megane", "margem", "margin", "custo", " cost", " fee", "cachê", "diária", "combustível", "aluguel", "gasolina", "rental"]) expect(all, internal).not.toContain(internal);
    expect(all).not.toMatch(/R\$/);
  });

  it("explains the CR-18 payment rule without amounts", () => {
    const answer = MOCK_TOUR_CONTENT[ID].faq!.find((f) => f.question.pt?.includes("pagamento"))!.answer;
    expect(answer.pt).toContain("30% dos serviços");
    expect(answer.pt).toContain("70% restantes");
    expect(answer.en).toContain("30% of the services");
    expect(answer.es).toContain("30% de los servicios");
  });
});

describe("RT-112/RT-114 TOUR-01 gallery backdrop (Owner visual correction, 18/10/2026)", () => {
  const view = (id: string) => toTourContentView(MOCK_TOUR_CONTENT[id], "pt", "preview")!;
  const html = (id: string) => renderToStaticMarkup(<TourDetailPrototype offer={PROTOTYPE_OFFER[id]} content={view(id)} locale="pt" reviewMode />);

  it("uses the immersive blurred backdrop for TOUR-01 only, keeping the main photo whole (object-contain)", () => {
    const page = html("cmlhxkpy9000028zq27rhytew");
    expect(page).toContain('data-backdrop="immersive"');
    expect(page).toMatch(/data-testid="gallery-main-image"/);
    const mainImg = page.match(/<img[^>]*data-testid="gallery-main-image"[^>]*>/)?.[0] ?? "";
    expect(mainImg).toContain("object-contain"); // whole photo, never cropped
    expect(page).not.toContain("opacity-45 blur-2xl"); // the faint grey-looking backdrop is gone on TOUR-01
  });

  it("leaves the approved galleries of the other tours unchanged (soft backdrop)", () => {
    for (const id of ["cmli1a6im000034zqqzc9sppb", "cmlibniq40000z4zqkbujnutt"]) {
      const page = html(id);
      expect(page, id).not.toContain('data-backdrop="immersive"');
      expect(page, id).toContain("opacity-45 blur-2xl");
    }
  });

  it("keeps the backdrop decorative (hidden from assistive technology) and the thumbnails/navigation", () => {
    const page = html("cmlhxkpy9000028zq27rhytew");
    expect(page).toMatch(/aria-hidden="true" class="absolute inset-0" data-testid="gallery-backdrop"/);
    expect(page).toContain('data-testid="gallery-thumbs"');
    const thumbLabel = (n: number) => tourContentCopy.pt.galleryThumb.replace("{n}", String(n)).replace("{total}", "4");
    for (let n = 1; n <= 4; n += 1) expect(page).toContain(`aria-label="${thumbLabel(n)}"`);
  });
});
