import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LAUNCH_TRIP_IDS } from "@/lib/catalog/public-trips";
import { LAUNCH_LOAD_TRIP_IDS, launchLoadRecord, loadProblems, rocinhaLoadRecord } from "@/lib/catalog/content-load";
import { PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";
import { buildPublicOffer } from "@/lib/catalog/public-tour-presentation";
import { approveRecord, isMockRecord, toTourContentView } from "@/lib/catalog/tour-content";
import { approvedTripCopy, tripCopyDiff } from "@/lib/catalog/launch-trip-copy";

/**
 * Owner 01/11/2026: the release load covers the three launch tours (not only the Rocinha) and, once loaded and approved,
 * all nine pages (3 tours x PT/EN/ES) render the approved design. EN/ES of TOUR-01 and TOUR-03 confirmed by the Owner.
 */
const TOUR_01 = "cmlhxkpy9000028zq27rhytew";
const TOUR_02 = "cmli1a6im000034zqqzc9sppb";
const TOUR_03 = "cmlibniq40000z4zqkbujnutt";
const TOUR_04 = "cmljo0s1u0000t0zqa0bpd23p";
const LOCALES = ["pt", "en", "es"] as const;
const MUST_NAME: Record<string, RegExp[]> = {
  [TOUR_01]: [/Cristo|Christ/, /Selar[oó]n/, /P[ãa]o de A[çc][úu]car|Sugarloaf|Pan de Az[úu]car/],
  [TOUR_02]: [/Rocinha/],
  [TOUR_03]: [/Centro|Center/, /Hist[óo]ric/],
};
const LEGACY = /Confeitaria Colombo|City Tour Rio|Cristo Redentor \+ Pão de Açúcar|Tour Favela Rocinha com Guia Local|R\$\s*\d/;
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Owner 01/11/2026: release load of the three launch tours", () => {
  it("the load covers exactly the launch catalog", () => {
    expect(new Set(LAUNCH_LOAD_TRIP_IDS)).toEqual(new Set(LAUNCH_TRIP_IDS));
    expect(() => launchLoadRecord(TOUR_04)).toThrow(/not a launch tour/);
  });

  it("each record is real DRAFT content that loads without problems; the Rocinha record is unchanged", () => {
    for (const id of LAUNCH_LOAD_TRIP_IDS) {
      const record = launchLoadRecord(id);
      expect(isMockRecord(record), id).toBe(false);
      expect(record).toMatchObject({ tripId: id, status: "DRAFT", approvedAt: null, approvedContentHash: null });
      expect(loadProblems(record), id).toEqual([]);
    }
    expect(launchLoadRecord(TOUR_02)).toEqual(rocinhaLoadRecord());
  });

  it("own clips are loaded as OWNER_ATTESTED videos (Pão de Açúcar, Rocinha); TOUR-03 has none; the Rocinha mural stays UNVERIFIED", () => {
    const videos = (id: string) => launchLoadRecord(id).images.filter((m) => m.mediaType === "VIDEO");
    expect(videos(TOUR_01)).toHaveLength(1);
    expect(videos(TOUR_01)[0].rightsStatus).toBe("OWNER_ATTESTED");
    expect(videos(TOUR_02)).toHaveLength(1);
    expect(videos(TOUR_03)).toHaveLength(0);
    expect(launchLoadRecord(TOUR_02).images.filter((m) => m.rightsStatus === "UNVERIFIED")).toHaveLength(1);
  });

  it("once approved, all nine pages pass the public gates with the approved title, no price and no old copy", () => {
    for (const id of LAUNCH_LOAD_TRIP_IDS) {
      const approved = approveRecord(launchLoadRecord(id));
      for (const l of LOCALES) {
        const view = toTourContentView(approved, l, "public");
        expect(view, `${id} ${l} content`).not.toBeNull();
        const offer = buildPublicOffer(PROTOTYPE_OFFER[id], l, view!, { pricePublicationAuthorized: false });
        expect(offer, `${id} ${l} approved design`).not.toBeNull();
        expect(offer!.title).toBe(PROTOTYPE_OFFER[id].titleByLocale?.[l]);
        for (const p of MUST_NAME[id]) expect(offer!.title, `${id} ${l}`).toMatch(p);
        expect(JSON.stringify({ offer, view }), `${id} ${l}`).not.toMatch(LEGACY);
        expect(view!.gallery.length, `${id} ${l} photos`).toBeGreaterThan(0);
        expect([...view!.gallery, ...view!.videos].every((m) => m.rightsStatus !== "UNVERIFIED")).toBe(true);
      }
    }
  });

  it("EN/ES of TOUR-01 and TOUR-03 mirror the PT status (Owner 01/11/2026); no translation-draft notice remains", () => {
    for (const id of [TOUR_01, TOUR_03]) {
      const offer = PROTOTYPE_OFFER[id];
      for (const l of ["en", "es"] as const) {
        expect(offer.titleStatusByLocale?.[l]).toBe(offer.titleStatusByLocale?.pt);
        expect(offer.pitchStatusByLocale?.[l]).toBe(offer.pitchStatusByLocale?.pt);
      }
      expect((offer as { translationStatusNotice?: unknown }).translationStatusNotice).toBeUndefined();
    }
  });
});

describe("Owner 01/11/2026: plan A card copy and the order of the release steps", () => {
  it("the approved card copy names each tour in PT/EN/ES and carries nothing of the old offer", () => {
    for (const id of LAUNCH_LOAD_TRIP_IDS) {
      const copy = approvedTripCopy(id);
      for (const l of LOCALES) {
        for (const p of MUST_NAME[id]) expect(copy.title[l], `${id} ${l}`).toMatch(p);
        expect(copy.title[l] + copy.description[l]).not.toMatch(LEGACY);
      }
    }
  });

  it("tripCopyDiff flags the production rows and is empty once plan A is applied", () => {
    expect(tripCopyDiff(TOUR_03, { title: { pt: "Confeitaria Colombo + City Tour Rio" }, description: { pt: "Explore o principal cartão-postal" } })).toHaveLength(6);
    for (const id of LAUNCH_LOAD_TRIP_IDS) expect(tripCopyDiff(id, approvedTripCopy(id))).toEqual([]);
  });

  it("the scripts load all three tours, refuse hosted databases, and approve only after plan A with an explicit Owner flag", () => {
    const load = read("scripts/rt-119-load-content.ts");
    expect(load).toContain("launchLoadRecord(id)");
    expect(load).toContain("LAUNCH_LOAD_TRIP_IDS");
    expect(load).not.toContain("rocinhaLoadRecord");
    const approve = read("scripts/s11-approve-launch-content.ts");
    expect(approve).toContain("tripCopyDiff(id, trip).length");
    expect(approve).toContain("--confirm-owner-approval");
    for (const file of ["scripts/rt-119-load-content.ts", "scripts/s11-launch-trip-copy.ts", "scripts/s11-approve-launch-content.ts"]) expect(read(file)).toMatch(/Refusing to run: only a local throw-away database/);
  });
});
