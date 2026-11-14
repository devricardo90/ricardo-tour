// Public catalog gate (RT-53): the single definition of which trips are publicly sellable.
//
// `Trip.isPublished` defaults to true, so any record created in the database becomes public by default (demo, test and
// draft rows included). The gate therefore does not trust `isPublished` alone: a trip is public only if it is in the
// Owner-approved launch set (by canonical database id, never by title) AND it passes data-integrity checks.
// The Home Experiences section, the /tours listing and (RT-54) the tour detail all consume this module, so they cannot
// drift into different definitions of "public". Excluded records are never deleted or modified; they are only hidden.
import { PRICE_ON_REQUEST_TRIP_IDS } from "@/lib/catalog/price-on-request";
import { prisma } from "@/lib/prisma";
import { normalizeTripImage } from "@/lib/image-utils";
import { getLocalizedField } from "@/lib/localized-field";
import { asLocalizedText } from "@/lib/types";
import { hasCompletePartnerLabel } from "@/lib/catalog/operation-type";
import { withApprovedCopy } from "@/lib/catalog/launch-trip-copy";

/**
 * Initial launch catalog (Owner decision, RT-53), in display order. Canonical database ids, verified against the database:
 *   cmljo0s1u0000t0zqa0bpd23p  Tour Privado Premium Rio de Janeiro
 *   cmlibniq40000z4zqkbujnutt  Confeitaria Colombo + City Tour Rio
 *   cmli1a6im000034zqqzc9sppb  Tour Favela Rocinha com Guia Local
 *   cmlhxkpy9000028zq27rhytew  Cristo Redentor + Pão de Açúcar
 * Adding a trip to the public catalog is an explicit, reviewed change to this list.
 *
 * Owner directive 27/10/2026 (commercial launch): only the three own tours TOUR-01, TOUR-02 and TOUR-03 are launched.
 * TOUR-04 (cmljo0s1u0000t0zqa0bpd23p, Tour Privado Premium) is OUT of this launch: removed from this list only, so it is
 * hidden from every public surface while its database row, bookings and history stay untouched.
 */
export const LAUNCH_TRIP_IDS = [
  "cmlibniq40000z4zqkbujnutt",
  "cmli1a6im000034zqqzc9sppb",
  "cmlhxkpy9000028zq27rhytew",
] as const;

/** Launch scope: Rio de Janeiro only. Compared exactly, so non-canonical casing/whitespace is flagged as an artifact. */
export const LAUNCH_CITY = "Rio de Janeiro";
const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

export type ExclusionReason =
  | "ARTIFACT_RECORD"
  | "NON_RIO"
  | "UNPUBLISHED"
  | "PARTNER_INACTIVE"
  | "PARTNER_OPERATOR_UNIDENTIFIED"
  | "PLACEHOLDER_MEDIA"
  | "INVALID_PRICE"
  | "INCOMPLETE_DATA"
  | "NOT_APPROVED_FOR_LAUNCH";

/** Most specific reason first. */
const REASON_PRIORITY: ExclusionReason[] = [
  "ARTIFACT_RECORD",
  "NON_RIO",
  "UNPUBLISHED",
  "PARTNER_INACTIVE",
  "PARTNER_OPERATOR_UNIDENTIFIED",
  "PLACEHOLDER_MEDIA",
  "INVALID_PRICE",
  "INCOMPLETE_DATA",
  "NOT_APPROVED_FOR_LAUNCH",
];

/** The fields the gate reads (a subset of the Prisma Trip row), so it can be tested without a database. */
export type GateTrip = {
  id: string;
  title: unknown;
  description?: unknown;
  city: string;
  location?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  isPublished: boolean;
  /**
   * RT-100: who operates the tour. Only used to hide a PARTNER tour whose partner is not ACTIVE. It never changes how an
   * UNCLASSIFIED or OWN trip is evaluated, and the value itself is never shown to visitors.
   */
  operationType?: string;
  /** RT-100: status of the linked partner (selected by the queries below; never any other partner or commercial field). */
  partner?: { status: string; publicLabel?: unknown } | null;
};

export type GateResult = {
  id: string;
  included: boolean;
  /** Every applicable reason, most specific first. Empty when included. */
  reasons: ExclusionReason[];
  primaryReason: ExclusionReason | null;
};

const stripAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const norm = (s: string) => stripAccents(s).trim().toLowerCase();

export function isLaunchApproved(id: string) {
  return (LAUNCH_TRIP_IDS as readonly string[]).includes(id);
}

/** Pure evaluation of one record against the gate. */
export function evaluatePublicTrip(trip: GateTrip): GateResult {
  const reasons = new Set<ExclusionReason>();
  const title = asLocalizedText(trip.title);
  const ptTitle = getLocalizedField<string>(title, "pt");
  const description = asLocalizedText(trip.description);
  const ptDescription = getLocalizedField<string>(description, "pt");

  if (!isLaunchApproved(trip.id)) reasons.add("NOT_APPROVED_FOR_LAUNCH");
  if (!trip.isPublished) reasons.add("UNPUBLISHED");
  // RT-100: a PARTNER tour is public only while its partner is ACTIVE (a missing partner counts as inactive).
  if (trip.operationType === "PARTNER" && trip.partner?.status !== "ACTIVE") reasons.add("PARTNER_INACTIVE");
  // Owner decision 2026-10-13: a PARTNER tour is public only with the real operator identified in PT, EN and ES.
  if (trip.operationType === "PARTNER" && !hasCompletePartnerLabel(trip.partner?.publicLabel)) reasons.add("PARTNER_OPERATOR_UNIDENTIFIED");
  if (norm(trip.city) !== norm(LAUNCH_CITY)) reasons.add("NON_RIO");

  // Artifact: non-canonical city, stray whitespace in public strings, or an explicit test marker.
  if (
    (trip.city !== LAUNCH_CITY && norm(trip.city) === norm(LAUNCH_CITY)) ||
    ptTitle !== ptTitle.trim() ||
    (trip.location != null && trip.location !== trip.location.trim()) ||
    /\b(e2e|teste?|test)\b/i.test(stripAccents(ptTitle))
  ) {
    reasons.add("ARTIFACT_RECORD");
  }

  if (!trip.imageUrl || normalizeTripImage(trip.imageUrl) === PLACEHOLDER_IMAGE) reasons.add("PLACEHOLDER_MEDIA");
  if (!Number.isFinite(trip.priceCents) || trip.priceCents <= 0) reasons.add("INVALID_PRICE");
  if (!ptTitle.trim() || !ptDescription.trim()) reasons.add("INCOMPLETE_DATA");

  const ordered = REASON_PRIORITY.filter((reason) => reasons.has(reason));
  return { id: trip.id, included: ordered.length === 0, reasons: ordered, primaryReason: ordered[0] ?? null };
}

/** Audit of arbitrary records (used by the read-only audit script and tests). */
export function auditTrips(trips: GateTrip[]) {
  return trips.map((trip) => ({ trip, ...evaluatePublicTrip(trip) }));
}

function byLaunchOrder<T extends { id: string }>(trips: T[]) {
  const order = new Map((LAUNCH_TRIP_IDS as readonly string[]).map((id, index) => [id, index]));
  return [...trips].sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

/**
 * RT-116 (Owner, 28/10/2026): the catalog rows still point to legacy /images/trips covers of unknown origin, which must
 * never be shown again. The three own tours use their own OWNER_ATTESTED cover instead (same files as their galleries).
 * Code only: the rows are not changed (no hosted write; option R, Owner 01/11/2026, keeps it that way in the release).
 * Owner 14/11/2026: TOUR-03 uses the approved Candelária photo (its gallery cover) instead of the Real Gabinete photo.
 */
export const OWN_TOUR_COVERS: Readonly<Record<string, string>> = {
  cmlhxkpy9000028zq27rhytew: "/media/tours/cristo-pao-selaron/pao-01-IMG_1162-mirante.webp",
  cmli1a6im000034zqqzc9sppb: "/media/tours/favela-rocinha/rocinha-01-panorama-bandeira.jpg",
  cmlibniq40000z4zqkbujnutt: "/media/tours/centro-historico-cultural/centro-historico-img-1802.webp",
};

function withOwnCover<T extends { id: string; imageUrl?: string | null }>(row: T): T {
  const cover = OWN_TOUR_COVERS[row.id];
  return cover ? { ...row, imageUrl: cover } : row;
}

/**
 * All publicly sellable trips, in launch order. The database query is already restricted to the approved ids; the
 * integrity checks then run on the rows that come back, so a corrupted approved record is hidden rather than shown.
 */
export async function getPublicTrips() {
  // RT-100: only the partner's status and approved public label are joined (to apply the PARTNER rules). Private commercial data
  // (TripCommercial / TripCommercialRate) is never selected by any public reader.
  const rows = await prisma.trip.findMany({
    where: { id: { in: [...LAUNCH_TRIP_IDS] }, isPublished: true },
    include: { partner: { select: { status: true, publicLabel: true } } },
  });
  return byLaunchOrder(rows.filter((row) => evaluatePublicTrip(row).included).map(toPublicRow).filter((row) => row !== null));
}

/**
 * Option R (Owner 01/11/2026): what visitors see of a launch tour row: its own cover and its approved name and summary,
 * never the legacy Trip.imageUrl/title/description (the rows themselves are not changed by the release).
 */
function toPublicRow<T extends { id: string; title: unknown; description?: unknown; imageUrl?: string | null }>(row: T): T | null {
  return withApprovedCopy(withOwnCover(row));
}

/** One public trip by id, or null when it is not part of the public catalog (RT-54 uses this to 404 hidden records). */
export async function getPublicTripById(id: string) {
  if (!isLaunchApproved(id)) return null;
  const row = await prisma.trip.findFirst({
    where: { id, isPublished: true },
    // Only OPEN schedules that have not started yet (past dates are never shown), earliest first.
    include: {
      schedules: { where: { status: "OPEN", startAt: { gte: new Date() } }, orderBy: { startAt: "asc" } },
      partner: { select: { status: true, publicLabel: true } },
    },
  });
  return row && evaluatePublicTrip(row).included ? toPublicRow(row) : null;
}

export type TripBrowseParams = {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  duration?: string;
  level?: string;
  children?: string;
};

/** Accent-insensitive text search over title, description, city and location (same behavior as the legacy listing). */
export function filterPublicTrips<
  T extends { id?: string; title: unknown; description?: unknown; city: string; location?: string | null; priceCents: number; durationDays?: number; physicalLevel?: string; childrenAllowed?: boolean }
>(trips: T[], params: TripBrowseParams, locale: string) {
  const search = norm(params.search ?? "");
  const min = params.minPrice ? Number(params.minPrice) * 100 : undefined;
  const max = params.maxPrice ? Number(params.maxPrice) * 100 : undefined;
  const duration = params.duration && params.duration !== "all" ? Number(params.duration) : undefined;
  const level = params.level && params.level !== "all" ? params.level : undefined;
  return trips.filter((trip) => {
    // Obsolete published price (price on request): a price filter must not reveal it, so such tours never match one.
    if ((min !== undefined || max !== undefined) && trip.id && PRICE_ON_REQUEST_TRIP_IDS.has(trip.id)) return false;
    if (min !== undefined && trip.priceCents < min) return false;
    if (max !== undefined && trip.priceCents > max) return false;
    if (duration !== undefined && (duration === 3 ? (trip.durationDays ?? 1) < 3 : (trip.durationDays ?? 1) !== duration)) return false;
    if (level && trip.physicalLevel !== level) return false;
    if (params.children === "true" && trip.childrenAllowed === false) return false;
    if (!search) return true;
    const haystack = [
      getLocalizedField<string>(asLocalizedText(trip.title), locale),
      getLocalizedField<string>(asLocalizedText(trip.description), locale),
      trip.city,
      trip.location ?? "",
    ].map(norm).join(" ");
    return haystack.includes(search);
  });
}
