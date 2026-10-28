import fs from "node:fs";
import path from "node:path";
import { Prisma, type PrismaClient } from "@prisma/client";
import { approvalMatches, canonicalJson, contentFingerprint, isMockRecord, loadTourContentRecord, validateTourContent, type LocalizedText, type TourContentRecord } from "@/lib/catalog/tour-content";
import { MOCK_TOUR_CONTENT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { ROCINHA_ID } from "@/lib/catalog/drafts/rocinha.draft";

/**
 * RT-119 (local preparation) — controlled load of approved editorial content into the RT-113 tables.
 * Rules (Owner, 17/10/2026):
 * - Writes ONLY TripContent / TripItineraryStop / TripFaqItem / TripImage of the given trip; never Trip (prices untouched).
 * - Loaded content is always DRAFT: loading is not an editorial approval nor a publication authorization.
 * - Idempotent: identical content → no write at all (an existing approval is kept); stable child ids per position.
 * - Fails on invalid content (languages, required fields, references, price-like text, mock data).
 * - Never overwrites approved content unless explicitly allowed; then the approval is invalidated (DRAFT, no fingerprint).
 * Server/scripts only (imports draft data): a test forbids importing it from public routes and components.
 */

export type LoadAction = "create" | "update" | "noop" | "refused";
export type LoadPlan = { tripId: string; action: LoadAction; reasons: string[]; changes: string[]; approvalKept: boolean };

const REQUIRED_TEXT = ["summary", "description", "durationLabel", "meetingPoint", "requirements", "accessibility", "operationalConditions"] as const;

/**
 * Rocinha record to load: real draft content + the 5 photos and the clip (VIDEO) visually approved by the Owner. Own media
 * is OWNER_ATTESTED (Owner declaration 28/10/2026); the mural photo stays UNVERIFIED (artwork rights uncertain). Nothing
 * is public until a new approval act authorizes the loaded content.
 */
export function rocinhaLoadRecord(): TourContentRecord {
  const base = MOCK_TOUR_CONTENT[ROCINHA_ID];
  if (!base || isMockRecord(base)) throw new Error("Rocinha content is missing or still mock");
  const video = PROTOTYPE_OFFER[ROCINHA_ID]?.video;
  const media: TourContentRecord["images"] = [...base.images];
  if (video) {
    media.push({
      position: media.length,
      src: video.src,
      alt: video.caption,
      isCover: false,
      // Own video: authorised for commercial use by the Owner's declaration of 28/10/2026 (RT-116).
      rightsStatus: "OWNER_ATTESTED",
      rightsNote: video.rightsNote,
      mediaType: "VIDEO",
      posterSrc: video.poster,
      mobileSrc: video.mobileSrc ?? null,
      durationSeconds: video.durationSeconds,
    });
  }
  return { ...base, status: "DRAFT", approvedAt: null, approvedContentHash: null, images: media };
}

/** Content problems that block a load (approval-related rules do not apply: loaded content is DRAFT). */
export function loadProblems(record: TourContentRecord): string[] {
  const problems = validateTourContent({ ...record, status: "DRAFT" }).map((i) => `${i.field}: ${i.problem}`);
  if (isMockRecord(record)) problems.push("source: mock content can never be loaded");
  for (const field of REQUIRED_TEXT) if (!record[field]) problems.push(`${field}: required`);
  if (!record.inclusions?.pt?.length) problems.push("inclusions: required");
  if (!record.exclusions?.pt?.length) problems.push("exclusions: required");
  if (record.itinerary.length === 0) problems.push("itinerary: at least one stop required");
  if ((record.faq ?? []).length === 0) problems.push("faq: at least one item required");
  if (!record.images.some((m) => m.isCover && (m.mediaType ?? "IMAGE") === "IMAGE")) problems.push("images: a cover image is required");
  // Media references: site-relative paths that exist under public/, rights status documented in the note.
  const publicDir = path.join(process.cwd(), "public");
  for (const [i, m] of record.images.entries()) {
    for (const [key, value] of [["src", m.src], ["posterSrc", m.posterSrc], ["mobileSrc", m.mobileSrc]] as const) {
      if (value === null || value === undefined) continue;
      if (!value.startsWith("/") || value.includes("..")) problems.push(`images[${i}].${key}: must be a site-relative path`);
      else if (!fs.existsSync(path.join(publicDir, value))) problems.push(`images[${i}].${key}: file not found under public/`);
    }
    // UNVERIFIED media may be stored (it is never public); the note must say what is verified or still pending.
    if (!m.rightsNote?.trim()) problems.push(`images[${i}].rightsNote: required (rights status or what is pending)`);
  }
  return problems;
}

// jsonb reorders object keys: compare canonical (key-sorted) JSON, never raw JSON.stringify.
const j = (v: unknown) => canonicalJson(v ?? null);

/** Field-level diff between what is stored and what would be loaded (texts, children by position, media rights). */
export function diffRecords(current: TourContentRecord | null, next: TourContentRecord): string[] {
  if (!current) return ["new content record"];
  const changes: string[] = [];
  for (const field of ["summary", "description", "durationLabel", "meetingPoint", "startTimeNote", "languages", "inclusions", "exclusions", "requirements", "accessibility", "weatherPolicy", "operationalConditions", "optionalServicesNote", "source"] as const) {
    if (j(current[field]) !== j(next[field])) changes.push(field);
  }
  const byPos = <T extends { position: number }>(list: T[]) => new Map(list.map((x) => [x.position, x]));
  const cmpList = <T extends { position: number }>(name: string, a: T[], b: T[], pick: (x: T) => unknown) => {
    const am = byPos(a);
    const bm = byPos(b);
    for (const pos of new Set([...am.keys(), ...bm.keys()])) {
      const x = am.get(pos);
      const y = bm.get(pos);
      if (!x) changes.push(`${name}[${pos}] added`);
      else if (!y) changes.push(`${name}[${pos}] removed`);
      else if (j(pick(x)) !== j(pick(y))) changes.push(`${name}[${pos}] changed`);
    }
  };
  cmpList("itinerary", current.itinerary, next.itinerary, (s) => [s.title, s.description, s.durationMinutes]);
  cmpList("faq", (current.faq ?? []).map((f, position) => ({ ...f, position })), (next.faq ?? []).map((f, position) => ({ ...f, position })), (f) => [f.question, f.answer]);
  cmpList("media", current.images, next.images, (m) => [m.src, m.alt, m.isCover, m.focalX ?? null, m.focalY ?? null, m.credit ?? null, m.mediaType ?? "IMAGE", m.posterSrc ?? null, m.mobileSrc ?? null, m.durationSeconds ?? null, m.rightsStatus, m.rightsNote ?? null]);
  return changes;
}

/** Pure planning step (dry run): decides what a load would do, without touching the database. */
export function planLoad(current: TourContentRecord | null, next: TourContentRecord, opts: { tripExists: boolean; allowReplaceApproved?: boolean }): LoadPlan {
  const plan: LoadPlan = { tripId: next.tripId, action: "noop", reasons: [], changes: [], approvalKept: false };
  if (!opts.tripExists) return { ...plan, action: "refused", reasons: [`trip ${next.tripId} not found (the loader never creates trips)`] };
  const problems = loadProblems(next);
  if (problems.length) return { ...plan, action: "refused", reasons: problems };
  plan.changes = diffRecords(current, next);
  if (!current) return { ...plan, action: "create" };
  if (plan.changes.length === 0) return { ...plan, action: "noop", approvalKept: current.status === "OWNER_APPROVED" && approvalMatches(current) };
  if (current.status === "OWNER_APPROVED" && !opts.allowReplaceApproved) {
    return { ...plan, action: "refused", reasons: ["stored content is OWNER_APPROVED and differs: replacing it needs --allow-replace-approved and a new Owner review"] };
  }
  return { ...plan, action: "update", reasons: current.status === "OWNER_APPROVED" ? ["approval invalidated: content becomes DRAFT and needs a new Owner review"] : [] };
}

type Tx = Prisma.TransactionClient;
const json = (v: LocalizedText | Record<string, unknown> | null | undefined) => (v === null || v === undefined ? undefined : (v as Prisma.InputJsonValue));
// Missing JSON values are written as SQL NULL (Prisma.DbNull), never as a JSON `null` literal.
const jsonOrNull = (v: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull => (v === null || v === undefined ? Prisma.DbNull : (v as Prisma.InputJsonValue));

/**
 * Applies a create/update plan in ONE transaction. Content is written as DRAFT with no approval fingerprint.
 * The plan is recomputed INSIDE the transaction against what is stored now: if anything changed since the dry run (e.g.
 * the content was approved meanwhile), the load stops instead of silently demoting it.
 */
export async function applyLoad(prisma: PrismaClient, next: TourContentRecord, plan: LoadPlan, opts: { allowReplaceApproved?: boolean } = {}): Promise<void> {
  if (plan.action !== "create" && plan.action !== "update") throw new Error(`refusing to apply a ${plan.action} plan`);
  if (plan.tripId !== next.tripId) throw new Error("plan was built for another trip");
  const tripId = next.tripId;
  const fields = {
    source: next.source,
    summary: jsonOrNull(next.summary),
    description: jsonOrNull(next.description),
    durationLabel: jsonOrNull(next.durationLabel),
    meetingPoint: jsonOrNull(next.meetingPoint),
    startTimeNote: jsonOrNull(next.startTimeNote),
    languages: next.languages,
    inclusions: jsonOrNull(next.inclusions),
    exclusions: jsonOrNull(next.exclusions),
    requirements: jsonOrNull(next.requirements),
    accessibility: jsonOrNull(next.accessibility),
    weatherPolicy: jsonOrNull(next.weatherPolicy),
    operationalConditions: jsonOrNull(next.operationalConditions),
    optionalServicesNote: jsonOrNull(next.optionalServicesNote),
    status: "DRAFT" as const,
    approvedAt: null,
    approvedContentHash: null,
  };
  await prisma.$transaction(async (tx: Tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId }, select: { id: true } });
    const current = await loadTourContentRecord(tripId, tx);
    const fresh = planLoad(current, next, { tripExists: Boolean(trip), allowReplaceApproved: opts.allowReplaceApproved });
    if (fresh.action !== plan.action || canonicalJson(fresh.changes) !== canonicalJson(plan.changes)) {
      throw new Error(`stored content changed since the dry run (planned ${plan.action}, now ${fresh.action}); re-run the dry run`);
    }
    // Replacing approved content (--allow-replace-approved) records the invalidation (audit), like the DB triggers do.
    const invalidation = current?.status === "OWNER_APPROVED" ? { approvalInvalidatedAt: new Date(), approvalInvalidationReason: "Replaced by a content load (--allow-replace-approved)" } : {};
    await tx.tripContent.upsert({ where: { tripId }, create: { tripId, ...fields }, update: { ...fields, ...invalidation } });

    const stops = next.itinerary.map((s) => s.position);
    await tx.tripItineraryStop.deleteMany({ where: { tripId, position: { notIn: stops } } });
    for (const s of next.itinerary) {
      const data = { title: json(s.title) as Prisma.InputJsonValue, description: jsonOrNull(s.description), durationMinutes: s.durationMinutes ?? null };
      await tx.tripItineraryStop.upsert({ where: { tripId_position: { tripId, position: s.position } }, create: { id: `${tripId}_stop_${s.position}`, tripId, position: s.position, ...data }, update: data });
    }

    const faq = (next.faq ?? []).map((f, position) => ({ ...f, position }));
    await tx.tripFaqItem.deleteMany({ where: { tripId, position: { notIn: faq.map((f) => f.position) } } });
    for (const f of faq) {
      const data = { question: f.question as Prisma.InputJsonValue, answer: f.answer as Prisma.InputJsonValue };
      await tx.tripFaqItem.upsert({ where: { tripId_position: { tripId, position: f.position } }, create: { id: `${tripId}_faq_${f.position}`, tripId, position: f.position, ...data }, update: data });
    }

    await tx.tripImage.deleteMany({ where: { tripId, position: { notIn: next.images.map((m) => m.position) } } });
    for (const m of next.images) {
      const data = {
        src: m.src,
        alt: m.alt as Prisma.InputJsonValue,
        isCover: m.isCover,
        focalX: m.focalX ?? null,
        focalY: m.focalY ?? null,
        rightsStatus: m.rightsStatus,
        rightsNote: m.rightsNote ?? null,
        credit: jsonOrNull(m.credit),
        mediaType: m.mediaType ?? ("IMAGE" as const),
        posterSrc: m.posterSrc ?? null,
        mobileSrc: m.mobileSrc ?? null,
        durationSeconds: m.durationSeconds ?? null,
      };
      await tx.tripImage.upsert({ where: { tripId_position: { tripId, position: m.position } }, create: { id: `${tripId}_media_${m.position}`, tripId, position: m.position, ...data }, update: data });
    }
  }, { timeout: 30_000, maxWait: 10_000 });
}

/** Fingerprint helper re-exported for scripts (e.g. to show what an approval would bind to). */
export { contentFingerprint };
