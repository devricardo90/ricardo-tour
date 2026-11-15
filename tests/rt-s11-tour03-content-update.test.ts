import { execSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { launchLoadRecord } from "@/lib/catalog/content-load";
import { inScope, planContentDiffUpdate } from "@/lib/catalog/content-diff-update";
import type { TourContentRecord } from "@/lib/catalog/tour-content";

/**
 * A1b (Owner 15/11/2026): TOUR-03 diff-only update. Pure plan tests + script refusals (no database) and a LIVE block,
 * SKIPPED unless S11_LOCAL_DB_URL points at a disposable local database (127.0.0.1:5433/rt_s11_*): it puts TOUR-03 in
 * the state found on the preview (A2: 7 photos, stale commercial texts, FAQ 6 and "TEST ONLY" rights notes, approved)
 * and proves that only the differing fields/rows are written, the rollback, the fingerprint and the Owner confirmations.
 */
const TOUR01 = "cmlhxkpy9000028zq27rhytew";
const TOUR02 = "cmli1a6im000034zqqzc9sppb";
const TOUR03 = "cmlibniq40000z4zqkbujnutt";
const SCOPE = ["meetingPoint", "inclusions", "weatherPolicy", "operationalConditions", "faq[5]", "media["];
const DIR = "/media/tours/centro-historico-cultural";
const OLD = (pt: string) => ({ pt, en: `${pt} (en)`, es: `${pt} (es)` });
const OLD_COVER = { position: 0, src: `${DIR}/centro-historico-img-1337.webp`, alt: OLD("Real Gabinete"), isCover: true, rightsStatus: "OWNER_ATTESTED", rightsNote: "TEST ONLY — ensaio no Preview" } as TourContentRecord["images"][number];
const MUSEU = { position: 6, src: `${DIR}/centro-historico-museu-do-amanha.webp`, alt: OLD("Museu do Amanhã"), isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: "TEST ONLY — ensaio no Preview" } as TourContentRecord["images"][number];

/** TOUR-03 texts as the preview stores them (A2): four stale commercial fields, stale FAQ 6, "TEST ONLY" notes. */
function staleTexts(): TourContentRecord {
  const next = launchLoadRecord(TOUR03);
  const inclusions = { pt: [...(next.inclusions?.pt ?? [])], en: [...(next.inclusions?.en ?? [])], es: [...(next.inclusions?.es ?? [])] };
  inclusions.pt[2] = "Veículo alugado.";
  inclusions.en[2] = "Rented vehicle.";
  inclusions.es[2] = "Vehículo alquilado.";
  const faq = (next.faq ?? []).map((f) => ({ ...f }));
  faq[5] = { ...faq[5], answer: OLD("Os prazos ainda aguardam aprovação.") };
  return {
    ...next,
    meetingPoint: OLD("Sem sobretaxa específica aprovada."),
    inclusions,
    weatherPolicy: OLD("Termos ainda precisam ser aprovados."),
    operationalConditions: OLD("Veículo alugado dirigido por Ricardo."),
    faq,
    images: next.images.map((m) => ({ ...m, rightsNote: "TEST ONLY — ensaio no Preview" })),
  };
}
function previewLike(): TourContentRecord {
  const stale = staleTexts();
  return { ...stale, status: "OWNER_APPROVED", approvedAt: new Date("2026-10-23T13:47:38Z"), approvedContentHash: "old", images: [OLD_COVER, ...stale.images.map((m) => ({ ...m, isCover: false })), MUSEU] };
}

describe("A1b: TOUR-03 diff-only plan (pure)", () => {
  it("from the preview state: 4 text fields, FAQ 6 and the media; itinerary and FAQ 1–5 untouched", () => {
    const plan = planContentDiffUpdate(previewLike(), launchLoadRecord(TOUR03), { tripExists: true, allowedChanges: SCOPE });
    expect(plan.action).toBe("update");
    expect(plan.contentFields).toEqual(["meetingPoint", "inclusions", "weatherPolicy", "operationalConditions"]);
    expect(plan.faq).toEqual({ delete: [], update: [5], create: [], kept: [0, 1, 2, 3, 4] });
    expect(plan.itinerary.update.length + plan.itinerary.create.length + plan.itinerary.delete.length).toBe(0);
    expect(plan.media).toEqual({ delete: [0, 6], update: [1, 2, 3, 4, 5], create: [], kept: [] });
    expect(plan.outOfScope).toEqual([]);
  });

  it("refuses any difference outside the authorized scope (other text, itinerary, another FAQ)", () => {
    const next = launchLoadRecord(TOUR03);
    const summary = { ...previewLike(), summary: OLD("outro resumo") };
    expect(planContentDiffUpdate(summary, next, { tripExists: true, allowedChanges: SCOPE })).toMatchObject({ action: "refused", outOfScope: ["summary"] });
    const stops = previewLike();
    stops.itinerary = stops.itinerary.map((s, i) => (i === 0 ? { ...s, durationMinutes: (s.durationMinutes ?? 0) + 5 } : s));
    expect(planContentDiffUpdate(stops, next, { tripExists: true, allowedChanges: SCOPE }).outOfScope).toEqual(["itinerary[0] changed"]);
    const faq4 = previewLike();
    faq4.faq = faq4.faq!.map((f, i) => (i === 4 ? { ...f, answer: OLD("x") } : f));
    expect(planContentDiffUpdate(faq4, next, { tripExists: true, allowedChanges: SCOPE }).outOfScope).toEqual(["faq[4] changed"]);
  });

  it("scope matching is exact for fields and single FAQ entries", () => {
    expect(inScope("faq[5] changed", SCOPE)).toBe(true);
    expect(inScope("faq[50] changed", SCOPE)).toBe(false);
    expect(inScope("media[0] removed", SCOPE)).toBe(true);
    expect(inScope("meetingPointX", SCOPE)).toBe(false);
    expect(inScope("summary", SCOPE)).toBe(false);
  });

  it("noop when everything matches; refused without stored content or trip", () => {
    const next = launchLoadRecord(TOUR03);
    expect(planContentDiffUpdate({ ...next, status: "OWNER_APPROVED" }, next, { tripExists: true, allowedChanges: SCOPE }).action).toBe("noop");
    expect(planContentDiffUpdate(null, next, { tripExists: true, allowedChanges: SCOPE }).action).toBe("refused");
    expect(planContentDiffUpdate(previewLike(), next, { tripExists: false, allowedChanges: SCOPE }).action).toBe("refused");
  });
});

const db = vi.hoisted(() => ({ disconnect: vi.fn(async () => undefined) }));
vi.mock("@/lib/prisma", () => ({ prisma: { $disconnect: db.disconnect } }));

describe("A1b: the script updates TOUR-03 only", () => {
  it("refuses TOUR-01 / TOUR-02 / no --trip, TOUR-01 on the preview, and --apply without the approval flags, before any database call", async () => {
    const saved = { argv: process.argv, url: process.env.DATABASE_URL, target: process.env.RT_DB_TARGET };
    const LOCAL = "postgresql://u:p@127.0.0.1:5433/rt_s11_x";
    try {
      for (const [env, args, error] of [
        [{ DATABASE_URL: LOCAL }, [`--trip=${TOUR01}`], /the only tour this script updates/],
        [{ DATABASE_URL: LOCAL }, [`--trip=${TOUR02}`], /the only tour this script updates/],
        [{ DATABASE_URL: LOCAL }, [], /the only tour this script updates/],
        [{ DATABASE_URL: "postgresql://u:p@ep-raspy-resonance-zaaizaps.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require", RT_DB_TARGET: "preview" }, ["--target=preview", `--trip=${TOUR01}`], /not covered by the preview exception/],
        [{ DATABASE_URL: LOCAL }, [`--trip=${TOUR03}`, "--apply", "--confirm-owner-approval"], /--apply requires --allow-replace-approved and --confirm-owner-approval/],
      ] as const) {
        vi.resetModules();
        delete process.env.RT_DB_TARGET;
        Object.assign(process.env, env);
        process.argv = ["node", "s11-tour03-content-update.ts", ...args];
        await expect(import("../scripts/s11-tour03-content-update")).rejects.toThrow(error);
      }
    } finally {
      process.argv = saved.argv;
      for (const [k, v] of [["DATABASE_URL", saved.url], ["RT_DB_TARGET", saved.target]] as const) if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
});

const liveUrl = process.env.S11_LOCAL_DB_URL;
const liveOk = Boolean(liveUrl && /^postgresql:\/\/[^@]+@127\.0\.0\.1:5433\/rt_s11_[a-z0-9_]+$/.test(liveUrl.split("?")[0]));
const runScript = (args: string) => {
  try {
    return { code: 0, out: execSync(`npx tsx scripts/s11-tour03-content-update.ts --trip=${TOUR03} ${args}`, { env: { ...process.env, DATABASE_URL: liveUrl, RT_DB_TARGET: "" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

describe.skipIf(!liveOk)("A1b LIVE (disposable local database): preview-like TOUR-03 → approved content, only the differences written", { timeout: 300_000 }, () => {
  it("dry run, Owner confirmations, rollback, then the atomic update", async () => {
    const { assertDatabaseAccess } = await import("@/lib/db/guard-runtime.mjs");
    assertDatabaseAccess({ operation: "write", label: "A1b live test", url: liveUrl, env: { DATABASE_URL: liveUrl } });
    const { PrismaClient } = await import("@prisma/client");
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: liveUrl! }) });
    const { applyLoad, planLoad, mediaRowData } = await import("@/lib/catalog/content-load");
    const { approveTourContent } = await import("@/lib/catalog/content-approval");
    const { applyContentDiffUpdate, launchTripFieldsHash } = await import("@/lib/catalog/content-diff-update");
    const { approvalFor, loadTourContentRecord } = await import("@/lib/catalog/tour-content");
    const next = launchLoadRecord(TOUR03);

    // 1. Preview state: stale texts + FAQ 6 + TEST ONLY notes, then the two legacy photos and Candelária not cover; approved.
    const stale = staleTexts();
    const loadPlan = planLoad(await loadTourContentRecord(TOUR03, prisma), stale, { tripExists: true, allowReplaceApproved: true });
    if (loadPlan.action !== "noop") await applyLoad(prisma, stale, loadPlan, { allowReplaceApproved: true });
    await prisma.tripImage.update({ where: { tripId_position: { tripId: TOUR03, position: 1 } }, data: { isCover: false } });
    for (const m of [OLD_COVER, MUSEU]) {
      await prisma.tripImage.deleteMany({ where: { tripId: TOUR03, position: m.position } });
      await prisma.tripImage.create({ data: { id: `${TOUR03}_media_${m.position}`, tripId: TOUR03, position: m.position, ...mediaRowData(m) } });
    }
    await approveTourContent(prisma, TOUR03);

    const ids = [TOUR01, TOUR02, TOUR03];
    const snapshot = async () => ({
      content: await prisma.tripContent.findMany({ where: { tripId: { in: ids } }, orderBy: { tripId: "asc" } }),
      stops: await prisma.tripItineraryStop.findMany({ where: { tripId: { in: ids } }, orderBy: [{ tripId: "asc" }, { position: "asc" }] }),
      faq: await prisma.tripFaqItem.findMany({ where: { tripId: { in: ids } }, orderBy: [{ tripId: "asc" }, { position: "asc" }] }),
      media: await prisma.tripImage.findMany({ where: { tripId: { in: ids } }, orderBy: [{ tripId: "asc" }, { position: "asc" }] }),
      trips: await launchTripFieldsHash(prisma),
    });
    const before = await snapshot();
    const current = await loadTourContentRecord(TOUR03, prisma);
    expect(current?.status).toBe("OWNER_APPROVED");
    const plan = planContentDiffUpdate(current, next, { tripExists: true, allowedChanges: SCOPE });
    expect(plan).toMatchObject({ action: "update", contentFields: ["meetingPoint", "inclusions", "weatherPolicy", "operationalConditions"], faq: { update: [5] }, media: { delete: [0, 6], update: [1, 2, 3, 4, 5] } });

    // 2. The script: the dry run writes nothing and names both Owner confirmations; --apply without them is refused.
    const dry = runScript("");
    expect(dry.code).toBe(0);
    expect(dry.out).toContain("--confirm-own-vehicle");
    expect(dry.out).toContain("--confirm-cancellation-72h");
    expect(dry.out).toContain("dry-run: nothing written");
    const noConfirm = runScript("--apply --allow-replace-approved --confirm-owner-approval --confirm-own-vehicle");
    expect(noConfirm.code).not.toBe(0);
    expect(noConfirm.out).toMatch(/has not confirmed --confirm-cancellation-72h/);
    expect(await snapshot()).toEqual(before);

    // 3. A failure just before the approval rolls EVERYTHING back.
    await expect(applyContentDiffUpdate(prisma, next, plan, { allowedChanges: SCOPE, testHooks: { beforeApproval: () => { throw new Error("simulated failure"); } } })).rejects.toThrow("simulated failure");
    expect(await snapshot()).toEqual(before);

    // 4. The real update (one transaction: differences + new approval).
    const result = await applyContentDiffUpdate(prisma, next, plan, { allowedChanges: SCOPE });
    expect(result).toMatchObject({ authorizedMedia: 5, unauthorizedMedia: 0 });
    const after = await snapshot();
    const approved = await loadTourContentRecord(TOUR03, prisma);
    expect(approved?.status).toBe("OWNER_APPROVED");
    expect(approved?.approvedContentHash).toBe(result.fingerprint);
    expect(approvalFor(approved!, result.approvedAt).approvedContentHash).toBe(result.fingerprint);
    expect(planContentDiffUpdate(approved, next, { tripExists: true, allowedChanges: SCOPE }).action).toBe("noop");

    const t3 = (rows: Array<{ tripId: string }>) => rows.filter((r) => r.tripId === TOUR03);
    const others = (rows: Array<{ tripId: string }>) => rows.filter((r) => r.tripId !== TOUR03);
    // Other tours: nothing written. Trip rows: nothing written. Itinerary of TOUR-03: not written (same updatedAt).
    for (const key of ["content", "stops", "faq", "media"] as const) expect(others(after[key])).toEqual(others(before[key]));
    expect(after.trips).toBe(before.trips);
    expect(t3(after.stops)).toEqual(t3(before.stops));
    // FAQ of TOUR-03: only position 5 written.
    const faqBefore = t3(before.faq) as typeof before.faq;
    const faqAfter = t3(after.faq) as typeof after.faq;
    expect(faqAfter.slice(0, 5)).toEqual(faqBefore.slice(0, 5));
    expect(faqAfter[5].answer).toEqual(next.faq![5].answer);
    // TripContent of TOUR-03: the four fields now equal the code; every other text field unchanged.
    const cBefore = t3(before.content)[0] as (typeof before.content)[number];
    const cAfter = t3(after.content)[0] as (typeof after.content)[number];
    for (const f of ["summary", "description", "durationLabel", "startTimeNote", "languages", "exclusions", "requirements", "accessibility", "optionalServicesNote", "source"] as const) expect(cAfter[f]).toEqual(cBefore[f]);
    for (const f of ["meetingPoint", "inclusions", "weatherPolicy", "operationalConditions"] as const) expect(cAfter[f]).toEqual(next[f]);
    // Media: 5 photos in order, Candelária cover (same row id), approved rights notes.
    const media = t3(after.media) as typeof after.media;
    expect(media.map((m) => [m.position, m.src.split("/").pop(), m.isCover])).toEqual([
      [1, "centro-historico-img-1802.webp", true], [2, "centro-historico-img-1328.webp", false], [3, "centro-historico-img-1321.webp", false],
      [4, "centro-historico-img-1332.webp", false], [5, "centro-historico-img-1136.webp", false],
    ]);
    expect(media[0].id).toBe(`${TOUR03}_media_1`);
    expect(media.every((m) => m.rightsNote === next.images.find((n) => n.position === m.position)?.rightsNote)).toBe(true);
    expect(media.every((m) => m.publicationApprovedAt?.getTime() === result.approvedAt.getTime())).toBe(true);

    // 5. Run again: nothing to change.
    expect(runScript("").out).toContain("nothing to change");
    await prisma.$disconnect();
  });
});
