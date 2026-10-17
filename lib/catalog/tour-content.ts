import { createHash } from "node:crypto";
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
export type TourMediaType = "IMAGE" | "VIDEO";

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
  /** RT-113 complement (DB-backed since 17/10/2026): operational conditions, optional third-party services, FAQ (TripFaqItem). */
  operationalConditions?: LocalizedText | null;
  optionalServicesNote?: LocalizedText | null;
  faq?: Array<{ question: LocalizedText; answer: LocalizedText }> | null;
  approvedAt?: Date | string | null;
  /** RT-119 approval fingerprint: SHA-256 of the public content at approval time (contentFingerprint). Any later edit of
   *  texts, itinerary, FAQ or media changes the fingerprint, so the public gate refuses the record until a new review. */
  approvedContentHash?: string | null;
  /** Durable invalidation recorded by the database triggers (informational; status is already DRAFT). */
  approvalInvalidatedAt?: Date | string | null;
  approvalInvalidationReason?: string | null;
  itinerary: Array<{ position: number; title: LocalizedText; description?: LocalizedText | null; durationMinutes?: number | null }>;
  /** Media of the tour (TripImage): images and, since the RT-113 complement, videos (mediaType VIDEO: poster, optional
   *  mobile rendition, duration). `credit` is public text only and never implies rights — rightsStatus decides. */
  images: Array<{
    position: number;
    src: string;
    alt: LocalizedText;
    isCover: boolean;
    rightsStatus: TourImageRightsStatus;
    rightsNote?: string | null;
    focalX?: number | null;
    focalY?: number | null;
    credit?: LocalizedText | null;
    mediaType?: TourMediaType;
    posterSrc?: string | null;
    mobileSrc?: string | null;
    durationSeconds?: number | null;
    /** Media publication authorization (set only by the approval act, for verified rights; cleared by DB triggers). */
    publicationApprovedAt?: Date | string | null;
  }>;
};

export type TourContentView = {
  tripId: string;
  status: TourContentStatus;
  isMock: boolean;
  /** True only for OWNER_APPROVED content whose approval fingerprint matches the current content. */
  approvalValid: boolean;
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
  operationalConditions: string | null;
  optionalServicesNote: string | null;
  faq: Array<{ question: string; answer: string }>;
  itinerary: Array<{ position: number; title: string; description: string | null; durationMinutes: number | null }>;
  /** `objectPosition` is the CSS focal point ("50% 30%") used where a frame must crop; the main view never crops. */
  gallery: Array<{ src: string; alt: string; isCover: boolean; rightsStatus: TourImageRightsStatus; objectPosition: string; credit: string | null }>;
  /** Videos (same rights gate as the gallery: UNVERIFIED is never public). `description` is the localized alt text. */
  videos: Array<{ src: string; mobileSrc: string | null; poster: string; durationSeconds: number | null; description: string; credit: string | null; rightsStatus: TourImageRightsStatus }>;
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

/** Canonical, key-sorted JSON (undefined → null) so the fingerprint does not depend on property order. */
function canonical(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value.map(canonical);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    // Absent and undefined keys are equivalent (jsonb drops undefined); explicit null is kept.
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/**
 * RT-119 — fingerprint of everything the public page would show: localized texts, languages, itinerary, FAQ (in order)
 * and media (src, alt, cover, framing, credit, video fields). Excluded on purpose: status/approval fields, `source`, and
 * media rights (rightsStatus/rightsNote are enforced separately by the rights gate, item by item).
 */
export function contentFingerprint(record: TourContentRecord): string {
  const payload = {
    tripId: record.tripId,
    summary: record.summary,
    description: record.description,
    durationLabel: record.durationLabel,
    meetingPoint: record.meetingPoint,
    startTimeNote: record.startTimeNote,
    languages: [...record.languages],
    inclusions: record.inclusions,
    exclusions: record.exclusions,
    requirements: record.requirements,
    accessibility: record.accessibility,
    weatherPolicy: record.weatherPolicy,
    operationalConditions: record.operationalConditions,
    optionalServicesNote: record.optionalServicesNote,
    itinerary: [...record.itinerary].sort((a, b) => a.position - b.position).map((st) => ({ position: st.position, title: st.title, description: st.description, durationMinutes: st.durationMinutes })),
    faq: (record.faq ?? []).map((f) => ({ question: f.question, answer: f.answer })),
    media: [...record.images]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ position: m.position, src: m.src, alt: m.alt, isCover: m.isCover, focalX: m.focalX, focalY: m.focalY, credit: m.credit, mediaType: m.mediaType ?? "IMAGE", posterSrc: m.posterSrc, mobileSrc: m.mobileSrc, durationSeconds: m.durationSeconds })),
  };
  return createHash("sha256").update(JSON.stringify(canonical(payload))).digest("hex");
}

/** Key-order-independent JSON (PostgreSQL jsonb does not preserve key order), used to compare stored and new content. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonical(value));
}

const sameInstant = (a: Date | string | null | undefined, b: Date | string | null | undefined) =>
  a !== null && a !== undefined && b !== null && b !== undefined && new Date(a).getTime() === new Date(b).getTime();

/**
 * RT-119 media rule (Owner decision 17/10/2026): editorial approval, rights and publication are separate. A media item is
 * public only when the content approval is valid AND its rights are verified now AND it was authorized by the CURRENT
 * approval act (publicationApprovedAt equals the content's approvedAt). A later rights clearance never publishes it.
 */
export function mediaPublishable(record: TourContentRecord, media: TourContentRecord["images"][number]): boolean {
  return media.rightsStatus !== "UNVERIFIED" && sameInstant(media.publicationApprovedAt, record.approvedAt);
}

/** True only when the record carries an approval fingerprint equal to its current content (fail-closed). */
export function approvalMatches(record: TourContentRecord): boolean {
  return Boolean(record.approvedContentHash) && record.approvedContentHash === contentFingerprint(record);
}

/**
 * Fields that make a record approved. The approval is an explicit Owner act; nothing calls this automatically.
 * Refuses mock content and content that does not validate (missing locale, price-like text, invalid media…).
 */
export function approvalFor(record: TourContentRecord, approvedAt: Date = new Date()) {
  if (isMockRecord(record)) throw new Error("approvalFor: MOCK content can never be approved");
  const issues = validateTourContent({ ...record, status: "DRAFT", approvedAt: null, approvedContentHash: null });
  if (issues.length) throw new Error(`approvalFor: content does not validate (${issues.map((i) => `${i.field}: ${i.problem}`).join("; ")})`);
  return { status: "OWNER_APPROVED" as const, approvedAt, approvedContentHash: contentFingerprint(record) };
}

/**
 * In-memory equivalent of the approval act (tests, lab): content approval + publication authorization for the media
 * whose rights are verified at this moment. The database version is approveTourContent (lib/catalog/content-approval.ts).
 */
export function approveRecord(record: TourContentRecord, approvedAt: Date = new Date()): TourContentRecord {
  const approval = approvalFor(record, approvedAt);
  return {
    ...record,
    ...approval,
    approvalInvalidatedAt: null,
    approvalInvalidationReason: null,
    images: record.images.map((m) => ({ ...m, publicationApprovedAt: m.rightsStatus !== "UNVERIFIED" ? approvedAt : null })),
  };
}

export function toTourContentView(record: TourContentRecord | null | undefined, locale: string, audience: TourContentAudience): TourContentView | null {
  if (!record) return null;
  if (audience === "public" && (record.status !== "OWNER_APPROVED" || isMockRecord(record) || !approvalMatches(record))) return null;
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
    approvalValid: record.status === "OWNER_APPROVED" && approvalMatches(record),
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
    operationalConditions: text(record.operationalConditions, "operationalConditions"),
    optionalServicesNote: text(record.optionalServicesNote, "optionalServicesNote"),
    faq: (record.faq ?? [])
      .map((item, i) => ({ question: text(item.question, `faq[${i}].question`) ?? "", answer: text(item.answer, `faq[${i}].answer`) ?? "" }))
      .filter((item) => item.question && item.answer),
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
      .filter((img) => (img.mediaType ?? "IMAGE") === "IMAGE")
      .filter((img) => audience === "preview" || mediaPublishable(record, img))
      .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position)
      .map((img, i) => ({ src: img.src, alt: text(img.alt, `images[${i}].alt`) ?? "", isCover: img.isCover, rightsStatus: img.rightsStatus, objectPosition: focalToPosition(img.focalX, img.focalY), credit: text(img.credit, `images[${i}].credit`) })),
    videos: [...record.images]
      .filter((media) => media.mediaType === "VIDEO" && Boolean(media.posterSrc))
      .filter((media) => audience === "preview" || mediaPublishable(record, media))
      .sort((a, b) => a.position - b.position)
      .map((media, i) => ({
        src: media.src,
        mobileSrc: media.mobileSrc ?? null,
        poster: media.posterSrc as string,
        durationSeconds: media.durationSeconds && media.durationSeconds > 0 ? media.durationSeconds : null,
        description: text(media.alt, `videos[${i}].alt`) ?? "",
        credit: text(media.credit, `videos[${i}].credit`),
        rightsStatus: media.rightsStatus,
      })),
  };
}

export type ContentIssue = { field: string; problem: string };

const LOCALIZED_TEXT_FIELDS = ["summary", "description", "durationLabel", "meetingPoint", "startTimeNote", "requirements", "accessibility", "weatherPolicy", "operationalConditions", "optionalServicesNote"] as const;
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
  (record.faq ?? []).forEach((item, i) => {
    checkText(`faq[${i}].question`, item.question);
    checkText(`faq[${i}].answer`, item.answer);
  });
  if (record.images.filter((img) => img.isCover).length > 1) issues.push({ field: "images", problem: "more than one cover image" });
  const mediaPositions = record.images.map((img) => img.position);
  if (new Set(mediaPositions).size !== mediaPositions.length) issues.push({ field: "images", problem: "duplicate positions" });
  record.images.forEach((img, i) => {
    checkText(`images[${i}].alt`, img.alt);
    checkText(`images[${i}].credit`, img.credit);
    if (!img.src.trim()) issues.push({ field: `images[${i}].src`, problem: "empty" });
    // Same rules as the DB CHECKs of the RT-113 complement migration.
    const has = (v: unknown) => v !== null && v !== undefined;
    if ((img.mediaType ?? "IMAGE") === "VIDEO") {
      if (!img.posterSrc?.trim()) issues.push({ field: `images[${i}].posterSrc`, problem: "a video needs a poster" });
      if (has(img.mobileSrc) && !img.mobileSrc?.trim()) issues.push({ field: `images[${i}].mobileSrc`, problem: "blank mobile rendition" });
      if (img.isCover) issues.push({ field: `images[${i}].isCover`, problem: "a video cannot be the cover" });
      if (img.durationSeconds !== null && img.durationSeconds !== undefined && img.durationSeconds <= 0) issues.push({ field: `images[${i}].durationSeconds`, problem: "duration must be positive" });
    } else if (has(img.posterSrc) || has(img.mobileSrc) || has(img.durationSeconds)) {
      issues.push({ field: `images[${i}]`, problem: "video-only fields on an image" });
    }
    for (const [axis, v] of [["focalX", img.focalX], ["focalY", img.focalY]] as const) {
      if (v !== null && v !== undefined && (v < 0 || v > 1)) issues.push({ field: `images[${i}].${axis}`, problem: "focal point must be between 0 and 1" });
    }
  });
  if (record.status === "OWNER_APPROVED") {
    if (isMockRecord(record)) issues.push({ field: "source", problem: "MOCK content can never be approved" });
    if (!record.approvedAt) issues.push({ field: "approvedAt", problem: "approved content needs an approval date" });
    if (!record.source?.trim()) issues.push({ field: "source", problem: "approved content needs a recorded source" });
    if (!approvalMatches(record)) issues.push({ field: "approvedContentHash", problem: "approval does not match the current content — new review required" });
  }
  return issues;
}

/** Loads the structured content of one tour through the publication gate. Callers must already have resolved the trip
 *  through the public catalog gate (getPublicTripById) for the public audience. */
export async function getTourContent(tripId: string, locale: string, audience: TourContentAudience): Promise<TourContentView | null> {
  const record = await loadTourContentRecord(tripId);
  return toTourContentView(record, locale, audience);
}

/** Reads one tour's structured content from the database as a TourContentRecord (no gate applied). */
export async function loadTourContentRecord(tripId: string, client: Pick<typeof prisma, "tripContent"> = prisma): Promise<TourContentRecord | null> {
  const row = await client.tripContent.findUnique({
    where: { tripId },
    include: {
      trip: {
        select: {
          itinerary: { select: { position: true, title: true, description: true, durationMinutes: true } },
          images: {
            select: { position: true, src: true, alt: true, isCover: true, rightsStatus: true, rightsNote: true, focalX: true, focalY: true, credit: true, mediaType: true, posterSrc: true, mobileSrc: true, durationSeconds: true, publicationApprovedAt: true },
          },
          faq: { select: { position: true, question: true, answer: true }, orderBy: { position: "asc" } },
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
    operationalConditions: row.operationalConditions as LocalizedText | null,
    optionalServicesNote: row.optionalServicesNote as LocalizedText | null,
    faq: row.trip.faq.map((item) => ({ question: item.question as LocalizedText, answer: item.answer as LocalizedText })),
    approvedAt: row.approvedAt,
    approvedContentHash: row.approvedContentHash,
    approvalInvalidatedAt: row.approvalInvalidatedAt,
    approvalInvalidationReason: row.approvalInvalidationReason,
    itinerary: row.trip.itinerary.map((s) => ({ ...s, title: s.title as LocalizedText, description: s.description as LocalizedText | null })),
    images: row.trip.images.map((img) => ({ ...img, alt: img.alt as LocalizedText, credit: img.credit as LocalizedText | null })),
  };
  return record;
}
