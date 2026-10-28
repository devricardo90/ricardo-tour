import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { approvalFor, approvalMatches, approveRecord, contentFingerprint, toTourContentView, validateTourContent, type TourContentRecord } from "@/lib/catalog/tour-content";
import { diffRecords, loadProblems, planLoad, rocinhaLoadRecord } from "@/lib/catalog/content-load";

// RT-119 local preparation (17/10/2026): controlled load + approval invalidated by any later edit.
const ROC = "cmli1a6im000034zqqzc9sppb";
const next = () => rocinhaLoadRecord();
const approved = (r: TourContentRecord) => approveRecord(r, new Date("2026-10-17T12:00:00Z"));
// Test-only: SIMULATES a future documentary rights verification (the real Rocinha media stays UNVERIFIED / pending).
const verified = (r: TourContentRecord): TourContentRecord => ({ ...r, images: r.images.map((m) => ({ ...m, rightsStatus: "LICENSED" as const, rightsNote: "SIMULATED verification (test)" })) });

describe("RT-119 — Rocinha load record", () => {
  it("is complete, valid in PT/EN/ES, DRAFT, and carries no approval", () => {
    const r = next();
    expect(r.tripId).toBe(ROC);
    expect(loadProblems(r)).toEqual([]);
    expect(r.status).toBe("DRAFT");
    expect(r.approvedContentHash).toBeNull();
    expect(r.itinerary).toHaveLength(8);
    expect(r.faq).toHaveLength(7);
    for (const l of ["pt", "en", "es"] as const) for (const f of r.faq!) expect(f.question[l] && f.answer[l]).toBeTruthy();
    expect(r.images.filter((m) => (m.mediaType ?? "IMAGE") === "IMAGE")).toHaveLength(5);
    expect(r.images.filter((m) => m.mediaType === "VIDEO")).toHaveLength(1);
    // Owner declaration 28/10/2026 (replaces the 17/10 rule): own photos and the clip are authorised; the mural photo
    // stays pending because the artwork's rights are uncertain.
    expect(r.images.filter((m) => m.rightsStatus === "OWNER_ATTESTED" && /^Owner, 28\/10\/2026/.test(m.rightsNote ?? ""))).toHaveLength(5);
    expect(r.images[2].rightsStatus).toBe("UNVERIFIED");
    expect(r.images[2].rightsNote).toMatch(/^PENDING rights verification: the mural artwork shown/);
  });

  it("never carries prices, internal costs or the operator fee", () => {
    const text = JSON.stringify(next());
    expect(text).not.toMatch(/R\$|\b(45000|58000|75000|88000|29000|25000|22000)\b|provisionalPricing|tarifa do operador|operator fee|remunera|margem/i);
    const src = fs.readFileSync(path.join(process.cwd(), "lib/catalog/content-load.ts"), "utf8");
    expect(src).not.toMatch(/PROVISIONAL_PRICING|provisionalPricing|priceCents/);
  });
});

describe("RT-119 — load planning (dry run) refuses unsafe loads", () => {
  it("creates when nothing is stored and refuses when the trip does not exist", () => {
    expect(planLoad(null, next(), { tripExists: true }).action).toBe("create");
    const p = planLoad(null, next(), { tripExists: false });
    expect(p.action).toBe("refused");
    expect(p.reasons[0]).toMatch(/never creates trips/);
  });

  it("refuses missing languages, missing required fields, price-like text and mock content", () => {
    const base = next();
    const noEs = { ...base, faq: base.faq!.map((f, i) => (i === 0 ? { ...f, answer: { pt: f.answer.pt, en: f.answer.en } } : f)) };
    expect(planLoad(null, noEs, { tripExists: true }).reasons).toEqual(expect.arrayContaining(["faq[0].answer: missing es"]));
    expect(planLoad(null, { ...base, operationalConditions: null }, { tripExists: true }).reasons).toContain("operationalConditions: required");
    const priced = { ...base, optionalServicesNote: { pt: "Capoeira R$ 50", en: "Capoeira R$ 50", es: "Capoeira R$ 50" } };
    expect(planLoad(null, priced, { tripExists: true }).action).toBe("refused");
    expect(planLoad(null, { ...base, source: "MOCK test" }, { tripExists: true }).reasons).toContain("source: mock content can never be loaded");
    expect(planLoad(null, { ...base, images: base.images.map((m) => ({ ...m, isCover: false })) }, { tripExists: true }).reasons).toContain("images: a cover image is required");
  });

  it("is idempotent: identical content (even with reordered JSON keys, as jsonb returns it) plans no change", () => {
    const stored = JSON.parse(JSON.stringify(next(), (_k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).reverse()) : v))) as TourContentRecord;
    expect(diffRecords(stored, next())).toEqual([]);
    expect(planLoad(stored, next(), { tripExists: true }).action).toBe("noop");
  });

  it("never replaces approved content silently", () => {
    const stored = approved(next());
    const changed = { ...next(), summary: { pt: "Outro resumo", en: "Other summary", es: "Otro resumen" } };
    expect(planLoad(stored, next(), { tripExists: true })).toMatchObject({ action: "noop", approvalKept: true });
    expect(planLoad(stored, changed, { tripExists: true }).action).toBe("refused");
    const forced = planLoad(stored, changed, { tripExists: true, allowReplaceApproved: true });
    expect(forced.action).toBe("update");
    expect(forced.reasons.join(" ")).toMatch(/approval invalidated/);
  });

  it("reports media rights changes in the diff (a rights change is never invisible)", () => {
    const changed = { ...next(), images: next().images.map((m, i) => (i === 4 ? { ...m, rightsStatus: "LICENSED" as const } : m)) };
    expect(diffRecords(next(), changed)).toContain("media[4] changed");
  });
});

describe("RT-119 — approval invalidated by any later content edit (fail-closed)", () => {
  const base = approved(verified(next()));

  it("an approved, unchanged record is public", () => {
    expect(approvalMatches(base)).toBe(true);
    expect(toTourContentView(base, "pt", "public")).not.toBeNull();
  });

  it.each([
    ["FAQ answer", (r: TourContentRecord) => ({ ...r, faq: r.faq!.map((f, i) => (i === 6 ? { ...f, answer: { ...f.answer, pt: "Editado" } } : f)) })],
    ["FAQ order", (r: TourContentRecord) => ({ ...r, faq: [...r.faq!].reverse() })],
    ["itinerary title", (r: TourContentRecord) => ({ ...r, itinerary: r.itinerary.map((s, i) => (i === 0 ? { ...s, title: { ...s.title, en: "Edited" } } : s)) })],
    ["inclusions", (r: TourContentRecord) => ({ ...r, inclusions: { ...r.inclusions, pt: [...(r.inclusions?.pt ?? []), "Item novo"] } })],
    ["operating conditions", (r: TourContentRecord) => ({ ...r, operationalConditions: { ...r.operationalConditions, es: "Editado" } })],
    ["photo replaced", (r: TourContentRecord) => ({ ...r, images: r.images.map((m, i) => (i === 1 ? { ...m, src: "/other.jpg" } : m)) })],
    ["credit", (r: TourContentRecord) => ({ ...r, images: r.images.map((m, i) => (i === 2 ? { ...m, credit: { pt: "X", en: "X", es: "X" } } : m)) })],
  ])("editing the %s after approval blocks publication and requires a new review", (_name, edit) => {
    const edited = edit(base);
    expect(contentFingerprint(edited)).not.toBe(base.approvedContentHash);
    expect(toTourContentView(edited, "pt", "public")).toBeNull();
    expect(validateTourContent(edited).map((i) => i.problem)).toContain("approval does not match the current content — new review required");
  });

  it("an approval without fingerprint is never public (no status-only approval)", () => {
    expect(toTourContentView({ ...base, approvedContentHash: null }, "pt", "public")).toBeNull();
  });

  it("media rights stay item by item: revoking a photo's rights hides it without re-approving the text", () => {
    const revoked = { ...base, images: base.images.map((m, i) => (i === 4 ? { ...m, rightsStatus: "UNVERIFIED" as const } : m)) };
    const view = toTourContentView(revoked, "pt", "public")!;
    expect(view.gallery).toHaveLength(4);
  });
});

describe("RT-119 — review follow-ups (independent review, 17/10/2026)", () => {
  const base = () => rocinhaLoadRecord();

  it("approvalFor refuses mock or invalid content (no approval stamp on bad data)", () => {
    expect(() => approvalFor({ ...base(), source: "MOCK x" })).toThrow(/MOCK/);
    expect(() => approvalFor({ ...base(), summary: { pt: "Só PT" } })).toThrow(/does not validate/);
    expect(() => approvalFor(base())).not.toThrow();
  });

  it("refuses empty itinerary, empty FAQ and missing inclusions/exclusions", () => {
    const b = base();
    const reasons = (r: TourContentRecord) => planLoad(null, r, { tripExists: true }).reasons;
    expect(reasons({ ...b, itinerary: [] })).toContain("itinerary: at least one stop required");
    expect(reasons({ ...b, faq: [] })).toContain("faq: at least one item required");
    expect(reasons({ ...b, inclusions: null })).toContain("inclusions: required");
    expect(reasons({ ...b, exclusions: null })).toContain("exclusions: required");
  });

  it("refuses media without recorded rights, without rights note, with missing files or unsafe paths", () => {
    const b = base();
    const withMedia = (i: number, patch: Partial<TourContentRecord["images"][number]>) => ({ ...b, images: b.images.map((m, k) => (k === i ? { ...m, ...patch } : m)) });
    const reasons = (r: TourContentRecord) => planLoad(null, r, { tripExists: true }).reasons;
    // Pending (UNVERIFIED) media can be stored — it is never public — but its note must say what is pending.
    expect(reasons(b)).toEqual([]);
    expect(reasons(withMedia(1, { rightsNote: null }))).toContain("images[1].rightsNote: required (rights status or what is pending)");
    expect(reasons(withMedia(1, { src: "/media/does-not-exist.jpg" }))).toContain("images[1].src: file not found under public/");
    expect(reasons(withMedia(5, { posterSrc: "../secret.jpg" }))).toContain("images[5].posterSrc: must be a site-relative path");
    expect(reasons(withMedia(5, { mobileSrc: "/media/missing-mobile.mp4" }))).toContain("images[5].mobileSrc: file not found under public/");
  });

  it("treats absent and undefined keys alike (jsonb round trip) for idempotency and the fingerprint", () => {
    const b = base();
    const roundTrip = JSON.parse(JSON.stringify(b)) as TourContentRecord; // drops undefined keys, like jsonb
    expect(diffRecords(roundTrip, b)).toEqual([]);
    expect(contentFingerprint(roundTrip)).toBe(contentFingerprint(b));
  });

  it("does not report a stale approval as kept, and the view flags it", () => {
    const appr = approved(base());
    const stale = { ...appr, faq: appr.faq!.map((f, i) => (i === 0 ? { ...f, answer: { ...f.answer, pt: "Mudou" } } : f)) };
    // identical to the source → noop; but the stored approval no longer matches its own content
    expect(planLoad(stale, stale, { tripExists: true })).toMatchObject({ action: "noop", approvalKept: false });
    expect(toTourContentView(stale, "pt", "preview")!.approvalValid).toBe(false);
    expect(toTourContentView(appr, "pt", "preview")!.approvalValid).toBe(true);
  });

  it.each([
    ["summary", (r: TourContentRecord) => ({ ...r, summary: { ...r.summary, pt: "Outro" } })],
    ["description", (r: TourContentRecord) => ({ ...r, description: { ...r.description, en: "Other" } })],
    ["languages", (r: TourContentRecord) => ({ ...r, languages: ["pt", "en"] })],
    ["FAQ added", (r: TourContentRecord) => ({ ...r, faq: [...r.faq!, r.faq![0]] })],
    ["stop removed", (r: TourContentRecord) => ({ ...r, itinerary: r.itinerary.slice(0, 7) })],
    ["media removed", (r: TourContentRecord) => ({ ...r, images: r.images.slice(0, 5) })],
    ["alt text", (r: TourContentRecord) => ({ ...r, images: r.images.map((m, i) => (i === 0 ? { ...m, alt: { ...m.alt, pt: "Outro alt" } } : m)) })],
    ["cover switched", (r: TourContentRecord) => ({ ...r, images: r.images.map((m, i) => ({ ...m, isCover: i === 1 })) })],
    ["focal point", (r: TourContentRecord) => ({ ...r, images: r.images.map((m, i) => (i === 0 ? { ...m, focalY: 0.1 } : m)) })],
    ["video duration", (r: TourContentRecord) => ({ ...r, images: r.images.map((m) => (m.mediaType === "VIDEO" ? { ...m, durationSeconds: 99 } : m)) })],
  ])("editing the %s after approval also invalidates it", (_name, edit) => {
    const appr = approved(base());
    expect(toTourContentView(edit(appr), "pt", "public")).toBeNull();
  });
});

describe("RT-119 — media: editorial approval, rights and publication are separate (Owner decision 17/10/2026)", () => {
  const at = new Date("2026-10-17T12:00:00Z");
  const appr = () => approveRecord(verified(rocinhaLoadRecord()), at);
  const photos = (r: TourContentRecord) => toTourContentView(r, "pt", "public")!.gallery.length;

  it("REAL state: an approval act authorizes the attested Rocinha media and never the pending mural photo", () => {
    const real = approveRecord(rocinhaLoadRecord(), at);
    expect(real.images.filter((m) => m.publicationApprovedAt === null).map((m) => m.src)).toEqual(["/media/tours/favela-rocinha/rocinha-03-mural.jpg"]);
    const view = toTourContentView(real, "pt", "public")!;
    expect(view.gallery.map((g) => g.src)).not.toContain("/media/tours/favela-rocinha/rocinha-03-mural.jpg");
    expect(view.gallery).toHaveLength(4);
    expect(view.videos).toHaveLength(1);
    // Without an approval act nothing is public, attested or not.
    expect(toTourContentView(rocinhaLoadRecord(), "pt", "public")).toBeNull();
  });

  it("approved content without edits stays public with all verified media", () => {
    expect(photos(appr())).toBe(5);
    expect(toTourContentView(appr(), "pt", "public")!.videos).toHaveLength(1);
  });

  it("media without verified rights never appears publicly (and is not authorized by the approval)", () => {
    const r = verified(rocinhaLoadRecord());
    const withUnverified = approveRecord({ ...r, images: r.images.map((m, i) => (i === 4 ? { ...m, rightsStatus: "UNVERIFIED" as const } : m)) }, at);
    expect(withUnverified.images[4].publicationApprovedAt).toBeNull();
    expect(photos(withUnverified)).toBe(4);
  });

  it("a later rights clearance does NOT publish automatically; a new explicit approval does", () => {
    const r = verified(rocinhaLoadRecord());
    const before = approveRecord({ ...r, images: r.images.map((m, i) => (i === 4 ? { ...m, rightsStatus: "UNVERIFIED" as const } : m)) }, at);
    // rights cleared later (the DB trigger keeps publicationApprovedAt NULL on a rights change)
    const cleared = { ...before, images: before.images.map((m, i) => (i === 4 ? { ...m, rightsStatus: "OWNER_ATTESTED" as const, publicationApprovedAt: null } : m)) };
    expect(photos(cleared)).toBe(4);
    expect(photos(approveRecord(cleared, new Date("2026-10-18T09:00:00Z")))).toBe(5);
  });

  it("a revocation hides the media immediately without unpublishing the rest", () => {
    const revoked = { ...appr(), images: appr().images.map((m, i) => (i === 1 ? { ...m, rightsStatus: "UNVERIFIED" as const } : m)) };
    expect(photos(revoked)).toBe(4);
    expect(toTourContentView(revoked, "pt", "public")!.faq).toHaveLength(7);
  });

  it("an authorization from an earlier approval act does not count for the current one", () => {
    const a = appr();
    const stale = { ...a, images: a.images.map((m, i) => (i === 0 ? { ...m, publicationApprovedAt: new Date("2026-10-01T00:00:00Z") } : m)) };
    expect(photos(stale)).toBe(4);
  });

  it("credit or visual approval alone never authorizes media (only verified rights + the approval act)", () => {
    const r = rocinhaLoadRecord();
    const draftWithCredits = { ...r, images: r.images.map((m) => ({ ...m, credit: { pt: "Crédito", en: "Credit", es: "Crédito" } })) };
    expect(toTourContentView(draftWithCredits, "pt", "public")).toBeNull();
    expect(draftWithCredits.images.every((m) => !m.publicationApprovedAt)).toBe(true);
  });
});
