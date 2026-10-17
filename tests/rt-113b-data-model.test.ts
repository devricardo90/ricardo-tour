import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contentFingerprint, toTourContentView, validateTourContent, type TourContentRecord } from "@/lib/catalog/tour-content";

// RT-113 complement (17/10/2026): FAQ, operating conditions, optional services, media credit and video support.
const tri = (pt: string, en: string, es: string) => ({ pt, en, es });

function record(overrides: Partial<TourContentRecord> = {}): TourContentRecord {
  const r: TourContentRecord = {
    tripId: "fixture",
    status: "OWNER_APPROVED",
    source: "fixture",
    approvedAt: "2026-10-17",
    languages: ["pt", "en", "es"],
    operationalConditions: tri("Percurso pode mudar.", "Route may change.", "El recorrido puede cambiar."),
    optionalServicesNote: tri("Opcional.", "Optional.", "Opcional."),
    faq: [
      { question: tri("P1?", "Q1?", "P1?"), answer: tri("R1.", "A1.", "R1.") },
      { question: tri("P2?", "Q2?", "P2?"), answer: tri("R2.", "A2.", "R2.") },
    ],
    itinerary: [],
    images: [
      { position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: true, rightsStatus: "OWNER_ATTESTED", credit: tri("Mural X", "Mural X", "Mural X") },
      { position: 1, src: "/b.jpg", alt: tri("b", "b", "b"), isCover: false, rightsStatus: "UNVERIFIED", credit: tri("Foto de terceiros", "Third-party photo", "Foto de terceros") },
      { position: 2, src: "/v.mp4", alt: tri("vídeo", "video", "video"), isCover: false, rightsStatus: "OWNER_ATTESTED", mediaType: "VIDEO", posterSrc: "/v.jpg", mobileSrc: "/v-m.mp4", durationSeconds: 15.5 },
      { position: 3, src: "/w.mp4", alt: tri("w", "w", "w"), isCover: false, rightsStatus: "UNVERIFIED", mediaType: "VIDEO", posterSrc: "/w.jpg" },
    ],
    ...overrides,
  };
  return r.status === "OWNER_APPROVED" && !("approvedContentHash" in overrides) ? stamp(r) : r;
}

/** Test-only approval stamp WITHOUT the approvalFor guard, so invalid/mock "approved" fixtures can prove that validation
 *  and the public gate still reject them. Real approvals go through approveRecord/approveTourContent (guarded). */
function stamp(r: TourContentRecord): TourContentRecord {
  return { ...r, approvedContentHash: contentFingerprint(r), images: r.images.map((m) => ({ ...m, publicationApprovedAt: m.rightsStatus !== "UNVERIFIED" ? r.approvedAt : null })) };
}

describe("RT-113 complement — public projection (fail-closed)", () => {
  it("keeps videos out of the gallery and applies the same rights gate to them", () => {
    const pub = toTourContentView(record(), "en", "public")!;
    expect(pub.gallery.map((g) => g.src)).toEqual(["/a.jpg"]);
    expect(pub.videos).toEqual([{ src: "/v.mp4", mobileSrc: "/v-m.mp4", poster: "/v.jpg", durationSeconds: 15.5, description: "video", credit: null, rightsStatus: "OWNER_ATTESTED" }]);
    const preview = toTourContentView(record(), "en", "preview")!;
    expect(preview.gallery).toHaveLength(2);
    expect(preview.videos.map((v) => v.src)).toEqual(["/v.mp4", "/w.mp4"]);
  });

  it("never treats a credit as a rights approval", () => {
    const pub = toTourContentView(record(), "pt", "public")!;
    expect(pub.gallery.find((g) => g.src === "/b.jpg")).toBeUndefined(); // credited but UNVERIFIED → hidden
    expect(pub.gallery[0].credit).toBe("Mural X");
  });

  it("returns FAQ in stored order, per locale, without falling back to Portuguese publicly", () => {
    expect(toTourContentView(record(), "es", "public")!.faq).toEqual([{ question: "P1?", answer: "R1." }, { question: "P2?", answer: "R2." }]);
    const missing = record({ faq: [{ question: { pt: "Só PT?" }, answer: { pt: "Sim." } }] });
    expect(toTourContentView(missing, "en", "public")!.faq).toEqual([]);
    expect(toTourContentView(missing, "en", "preview")!.faq).toEqual([{ question: "Só PT?", answer: "Sim." }]);
  });

  it("exposes operating conditions and optional services only for approved, non-mock content", () => {
    expect(toTourContentView(record(), "pt", "public")!.operationalConditions).toBe("Percurso pode mudar.");
    expect(toTourContentView(record(), "en", "public")!.optionalServicesNote).toBe("Optional.");
    expect(toTourContentView(record({ status: "DRAFT", approvedAt: null }), "pt", "public")).toBeNull();
    expect(toTourContentView(record({ source: "MOCK fixture" }), "pt", "public")).toBeNull();
  });
});

describe("RT-113 complement — validation (mirrors the DB CHECKs)", () => {
  const problems = (r: TourContentRecord) => validateTourContent(r).map((i) => i.problem);

  it("accepts the valid fixture", () => {
    expect(validateTourContent(record())).toEqual([]);
  });

  it("requires a poster for videos, forbids video covers and non-positive durations", () => {
    const bad = record({
      images: [
        { position: 0, src: "/v.mp4", alt: tri("v", "v", "v"), isCover: true, rightsStatus: "OWNER_ATTESTED", mediaType: "VIDEO", posterSrc: null, durationSeconds: 0 },
      ],
    });
    expect(problems(bad)).toEqual(expect.arrayContaining(["a video needs a poster", "a video cannot be the cover", "duration must be positive"]));
  });

  it("treats empty video fields on images exactly like the DB CHECK (empty string or zero still count)", () => {
    const bad = record({ images: [{ position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: false, rightsStatus: "OWNER_ATTESTED", posterSrc: "", durationSeconds: 0 }] });
    expect(problems(bad)).toContain("video-only fields on an image");
  });

  it("rejects video-only fields on images and duplicate media positions", () => {
    const bad = record({
      images: [
        { position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: false, rightsStatus: "OWNER_ATTESTED", posterSrc: "/p.jpg" },
        { position: 0, src: "/b.jpg", alt: tri("b", "b", "b"), isCover: false, rightsStatus: "OWNER_ATTESTED" },
      ],
    });
    expect(problems(bad)).toEqual(expect.arrayContaining(["video-only fields on an image", "duplicate positions"]));
  });

  it("requires PT/EN/ES for FAQ, conditions, optional services and credits", () => {
    const bad = record({
      operationalConditions: { pt: "Só PT" },
      faq: [{ question: tri("P?", "Q?", "P?"), answer: { pt: "R", en: "A" } }],
      images: [{ position: 0, src: "/a.jpg", alt: tri("a", "a", "a"), isCover: true, rightsStatus: "OWNER_ATTESTED", credit: { pt: "Crédito" } }],
    });
    const fields = validateTourContent(bad).map((i) => i.field);
    expect(fields).toEqual(expect.arrayContaining(["operationalConditions", "faq[0].answer", "images[0].credit"]));
  });

  it("rejects price-like text in the new fields (prices live on Trip only)", () => {
    const bad = record({ optionalServicesNote: tri("Capoeira por R$ 50", "Capoeira for R$ 50", "Capoeira por R$ 50") });
    expect(problems(bad)).toEqual(expect.arrayContaining(["price-like text in pt (prices live on Trip only)"]));
  });
});

describe("RT-113 complement — schema and migration discipline", () => {
  const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8").replace(/\r\n/g, "\n");
  const block = (name: string) => schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`))?.[0] ?? "";
  const dir = path.join(process.cwd(), "prisma/migrations/20261017180000_rt113_faq_conditions_media");

  it("has no price, cost, margin or supplier field in the public content models", () => {
    for (const name of ["TripContent", "TripFaqItem", "TripImage", "TripItineraryStop"]) {
      const fields = block(name)
        .split("\n")
        .filter((line) => /^\s{2}\w/.test(line))
        .map((line) => line.trim().split(/\s+/)[0]);
      expect(fields.length, name).toBeGreaterThan(0);
      expect(fields.filter((f) => /price|cost|margin|fee|supplier|partner|commission/i.test(f)), name).toEqual([]);
    }
  });

  it("reuses TripImage for videos (no parallel gallery model) and adds an ordered FAQ table", () => {
    expect(block("TripImage")).toMatch(/mediaType\s+TripMediaType\s+@default\(IMAGE\)/);
    expect(block("TripFaqItem")).toMatch(/@@unique\(\[tripId, position\]\)/);
    expect(schema).not.toMatch(/model Trip(Video|Media|Gallery)\b/);
  });

  it("ships an additive migration with CHECK rules and a rollback", () => {
    const sql = fs.readFileSync(path.join(dir, "migration.sql"), "utf8");
    const statements = sql.split("\n").filter((l) => !l.startsWith("--"));
    expect(statements.join("\n")).not.toMatch(/\bDROP\b|\bTRUNCATE\b|\bDELETE FROM\b|\bUPDATE "|ALTER COLUMN|RENAME/);
    for (const check of ["TripFaqItem_position_check", "TripImage_media_poster_check", "TripImage_media_video_fields_check", "TripImage_media_cover_check", "TripImage_duration_check", "TripImage_media_src_check"]) {
      expect(sql).toContain(check);
    }
    const rollback = fs.readFileSync(path.join(dir, "rollback.sql"), "utf8");
    expect(rollback).toMatch(/BEGIN;[\s\S]*DROP TABLE IF EXISTS "TripFaqItem"[\s\S]*DROP TYPE IF EXISTS "TripMediaType"[\s\S]*COMMIT;/);
    expect(rollback).toContain("20261017180000_rt113_faq_conditions_media");
  });

  it("does not modify the previous RT-113 migration (exact checksum of the committed file)", () => {
    const prev = fs.readFileSync(path.join(process.cwd(), "prisma/migrations/20261016120000_rt113_tour_content_gallery/migration.sql"));
    expect(createHash("sha256").update(prev).digest("hex")).toBe("b3179d3fba249328f2fac7c0f479f89380120758b6c5008c0c7d74b6a4031198");
  });
});
