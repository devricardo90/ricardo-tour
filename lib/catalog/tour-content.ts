import { prisma } from "@/lib/prisma";

/**
 * RT-113 (RT-RB-S10-03): structured tour content (operational facts, itinerary, gallery), PT/EN/ES.
 *
 * Publication gate (single place, reused by the public page and the lab preview):
 *  - `public`  audience: content is returned ONLY when status = OWNER_APPROVED, and only images whose rights are
 *    recorded (OWNER_ATTESTED / LICENSED). Mock content can never be approved (validateTourContent + DB check).
 *  - `preview` audience (rebuild lab only, production-hidden): everything, with flags, so drafts/mocks can be reviewed.
 * No price lives in this content; prices stay on Trip and change only by Owner decision.
 */

export const CONTENT_LOCALES = ["pt", "en", "es"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];
export type LocalizedText = Partial<Record<ContentLocale, string>>;
export type LocalizedList = Partial<Record<ContentLocale, string[]>>;
export type TourContentAudience = "public" | "preview";

export type TourContentStatus = "DRAFT" | "OWNER_APPROVED";
export type TourImageRightsStatus = "UNVERIFIED" | "OWNER_ATTESTED" | "LICENSED";

/** Shape stored in the database (and used by mock data), independent of Prisma types so it is easy to test. */
export type TourContentRecord = {
  tripId: string;
  status: TourContentStatus;
  source: string | null;
  summary?: LocalizedText | null;
  description?: LocalizedText | null;
  durationLabel?: LocalizedText | null;
  meetingPoint?: LocalizedText | null;
  startTimeNote?: LocalizedText | null;
  languages: string[];
  inclusions?: LocalizedList | null;
  exclusions?: LocalizedList | null;
  requirements?: LocalizedText | null;
  accessibility?: LocalizedText | null;
  weatherPolicy?: LocalizedText | null;
  approvedAt?: Date | string | null;
  itinerary: Array<{ position: number; title: LocalizedText; description?: LocalizedText | null; durationMinutes?: number | null }>;
  images: Array<{ position: number; src: string; alt: LocalizedText; isCover: boolean; rightsStatus: TourImageRightsStatus; rightsNote?: string | null; focalX?: number | null; focalY?: number | null; /** Public credit (e.g. mural artist). Not a DB column yet (RT-116 gap, Sprint 11). */ credit?: LocalizedText | null }>;
};

export type TourContentView = {
  tripId: string;
  status: TourContentStatus;
  isMock: boolean;
  /** Fields that fell back to Portuguese because the requested locale is missing (preview only; public never falls back). */
  missingLocale: string[];
  summary: string | null;
  paragraphs: string[];
  durationLabel: string | null;
  meetingPoint: string | null;
  startTimeNote: string | null;
  languages: string[];
  inclusions: string[];
  exclusions: string[];
  requirements: string | null;
  accessibility: string | null;
  weatherPolicy: string | null;
  itinerary: Array<{ position: number; title: string; description: string | null; durationMinutes: number | null }>;
  /** `objectPosition` is the CSS focal point ("50% 30%") used where a frame must crop; the main view never crops. */
  gallery: Array<{ src: string; alt: string; isCover: boolean; rightsStatus: TourImageRightsStatus; objectPosition: string; credit: string | null }>;
};

const MOCK_MARKER = /\bMOCK\b/;
const ISO_LANGUAGE = /^[a-z]{2}$/;
const PRICE_PATTERN = /R\$\s*\d|\bUS?\$\s*\d|€\s*\d|\d+[.,]?\d*\s*(?:reais|dólares|dolares|euros)\b/i;

/** Focal point (0–1) to a CSS object-position; defaults to the centre. Out-of-range values are clamped. */
export function focalToPosition(x: number | null | undefined, y: number | null | undefined) {
  const pct = (v: number | null | undefined) => `${Math.round(Math.min(1, Math.max(0, v ?? 0.5)) * 100)}%`;
  return `${pct(x)} ${pct(y)}`;
}

export function isMockRecord(record: Pick<TourContentRecord, "source">) {
  return Boolean(record.source && MOCK_MARKER.test(record.source));
}

function resolveLocale(locale: string): ContentLocale {
  return (CONTENT_LOCALES as readonly string[]).includes(locale) ? (locale as ContentLocale) : "pt";
}

/**
 * Picks the requested locale. In `preview` a missing locale falls back to Portuguese and is reported; in `public` there
 * is no fallback (approved content is validated to have all three locales, see validateTourContent).
 */
function pick<T>(value: Partial<Record<ContentLocale, T>> | null | undefined, locale: ContentLocale, field: string, audience: TourContentAudience, missing: string[]): T | null {
  if (!value) return null;
  const own = value[locale];
  if (own !== undefined && own !== null && !(typeof own === "string" && own.trim() === "")) return own;
  if (audience === "preview" && value.pt !== undefined) {
    missing.push(field);
    return value.pt ?? null;
  }
  return null;
}

export function toTourContentView(record: TourContentRecord | null | undefined, locale: string, audience: TourContentAudience): TourContentView | null {
  if (!record) return null;
  if (audience === "public" && (record.status !== "OWNER_APPROVED" || isMockRecord(record))) return null;
  const l = resolveLocale(locale);
  const missing: string[] = [];
  const text = (v: LocalizedText | null | undefined, f: string) => {
    const s = pick(v, l, f, audience, missing);
    return typeof s === "string" && s.trim() ? s.trim() : null;
  };
  const list = (v: LocalizedList | null | undefined, f: string) => (pick(v, l, f, audience, missing) ?? []).map((s) => s.trim()).filter(Boolean);
  const description = text(record.description, "description");
  return {
    tripId: record.tripId,
    status: record.status,
    isMock: isMockRecord(record),
    missingLocale: missing,
    summary: text(record.summary, "summary"),
    paragraphs: description ? description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [],
    durationLabel: text(record.durationLabel, "durationLabel"),
    meetingPoint: text(record.meetingPoint, "meetingPoint"),
    startTimeNote: text(record.startTimeNote, "startTimeNote"),
    languages: record.languages.filter((code) => ISO_LANGUAGE.test(code)),
    inclusions: list(record.inclusions, "inclusions"),
    exclusions: list(record.exclusions, "exclusions"),
    requirements: text(record.requirements, "requirements"),
    accessibility: text(record.accessibility, "accessibility"),
    weatherPolicy: text(record.weatherPolicy, "weatherPolicy"),
    itinerary: [...record.itinerary]
      .sort((a, b) => a.position - b.position)
      .map((stop, i) => ({
        position: stop.position,
        title: text(stop.title, `itinerary[${i}].title`) ?? "",
        description: text(stop.description, `itinerary[${i}].description`),
        durationMinutes: stop.durationMinutes && stop.durationMinutes > 0 ? stop.durationMinutes : null,
      }))
      .filter((stop) => stop.title),
    gallery: [...record.images]
      .filter((img) => audience === "preview" || img.rightsStatus !== "UNVERIFIED")
      .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position)
      .map((img, i) => ({ src: img.src, alt: text(img.alt, `images[${i}].alt`) ?? "", isCover: img.isCover, rightsStatus: img.rightsStatus, objectPosition: focalToPosition(img.focalX, img.focalY), credit: text(img.credit, `images[${i}].credit`) })),
  };
}

export type ContentIssue = { field: string; problem: string };

const LOCALIZED_TEXT_FIELDS = ["summary", "description", "durationLabel", "meetingPoint", "startTimeNote", "requirements", "accessibility", "weatherPolicy"] as const;
const LOCALIZED_LIST_FIELDS = ["inclusions", "exclusions"] as const;

/**
 * Editorial/governance validation (RT-113 + RT-115). Returns every problem; an OWNER_APPROVED record must have none.
 * Rules: every localized field that exists has PT, EN and ES; languages are ISO 639-1 codes; itinerary positions are
 * unique; at most one cover image; no price inside the content; a MOCK record can never be approved.
 */
export function validateTourContent(record: TourContentRecord): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const checkText = (field: string, value: LocalizedText | null | undefined) => {
    if (!value) return;
    for (const l of CONTENT_LOCALES) {
      const v = value[l];
      if (!v || !v.trim()) issues.push({ field, problem: `missing ${l}` });
      else if (PRICE_PATTERN.test(v)) issues.push({ field, problem: `price-like text in ${l} (prices live on Trip only)` });
    }
  };
  for (const f of LOCALIZED_TEXT_FIELDS) checkText(f, record[f]);
  for (const f of LOCALIZED_LIST_FIELDS) {
    const value = record[f];
    if (!value) continue;
    const counts = CONTENT_LOCALES.map((l) => value[l]?.length ?? 0);
    for (const l of CONTENT_LOCALES) if (!value[l]?.length) issues.push({ field: f, problem: `missing ${l}` });
    if (new Set(counts).size > 1) issues.push({ field: f, problem: `different item counts per locale (${counts.join("/")})` });
    for (const l of CONTENT_LOCALES) for (const item of value[l] ?? []) if (PRICE_PATTERN.test(item)) issues.push({ field: f, problem: `price-like text in ${l}` });
  }
  for (const code of record.languages) if (!ISO_LANGUAGE.test(code)) issues.push({ field: "languages", problem: `not an ISO 639-1 code: ${code}` });
  const positions = record.itinerary.map((s) => s.position);
  if (new Set(positions).size !== positions.length) issues.push({ field: "itinerary", problem: "duplicate positions" });
  record.itinerary.forEach((s, i) => checkText(`itinerary[${i}].title`, s.title));
  record.itinerary.forEach((s, i) => checkText(`itinerary[${i}].description`, s.description));
  if (record.images.filter((img) => img.isCover).length > 1) issues.push({ field: "images", problem: "more than one cover image" });
  record.images.forEach((img, i) => {
    checkText(`images[${i}].alt`, img.alt);
    checkText(`images[${i}].credit`, img.credit);
    if (!img.src.trim()) issues.push({ field: `images[${i}].src`, problem: "empty" });
    for (const [axis, v] of [["focalX", img.focalX], ["focalY", img.focalY]] as const) {
      if (v !== null && v !== undefined && (v < 0 || v > 1)) issues.push({ field: `images[${i}].${axis}`, problem: "focal point must be between 0 and 1" });
    }
  });
  if (record.status === "OWNER_APPROVED") {
    if (isMockRecord(record)) issues.push({ field: "source", problem: "MOCK content can never be approved" });
    if (!record.approvedAt) issues.push({ field: "approvedAt", problem: "approved content needs an approval date" });
    if (!record.source?.trim()) issues.push({ field: "source", problem: "approved content needs a recorded source" });
  }
  return issues;
}

/** Loads the structured content of one tour through the publication gate. Callers must already have resolved the trip
 *  through the public catalog gate (getPublicTripById) for the public audience. */
export async function getTourContent(tripId: string, locale: string, audience: TourContentAudience): Promise<TourContentView | null> {
  const row = await prisma.tripContent.findUnique({
    where: { tripId },
    include: {
      trip: {
        select: {
          itinerary: { select: { position: true, title: true, description: true, durationMinutes: true } },
          images: { select: { position: true, src: true, alt: true, isCover: true, rightsStatus: true, rightsNote: true, focalX: true, focalY: true } },
        },
      },
    },
  });
  if (!row) return null;
  const record: TourContentRecord = {
    tripId: row.tripId,
    status: row.status,
    source: row.source,
    summary: row.summary as LocalizedText | null,
    description: row.description as LocalizedText | null,
    durationLabel: row.durationLabel as LocalizedText | null,
    meetingPoint: row.meetingPoint as LocalizedText | null,
    startTimeNote: row.startTimeNote as LocalizedText | null,
    languages: row.languages,
    inclusions: row.inclusions as LocalizedList | null,
    exclusions: row.exclusions as LocalizedList | null,
    requirements: row.requirements as LocalizedText | null,
    accessibility: row.accessibility as LocalizedText | null,
    weatherPolicy: row.weatherPolicy as LocalizedText | null,
    approvedAt: row.approvedAt,
    itinerary: row.trip.itinerary.map((s) => ({ ...s, title: s.title as LocalizedText, description: s.description as LocalizedText | null })),
    images: row.trip.images.map((img) => ({ ...img, alt: img.alt as LocalizedText })),
  };
  return toTourContentView(record, locale, audience);
}
