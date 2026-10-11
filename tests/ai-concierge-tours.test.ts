import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { RuntimeResult } from "@/lib/ai-concierge/runtime/types";
import { toConciergeReply } from "@/lib/ai-concierge/ui/reply";
import { APPROVED_TOUR_CARDS, MAX_TOUR_CARDS, resolveTourCards, tourIdsFromSourceIds } from "@/lib/ai-concierge/ui/tours";

// RT-71 recommendation cards: the closed allow-list must stay traceable to approved material.
const root = process.cwd();
const catalog = JSON.parse(readFileSync(resolve(root, "knowledge/concierge/catalog-current.json"), "utf8")) as { entries: Array<{ source_id: string; snapshot_path: string }> };
const snapshot = (tripId: string) => {
  const entry = catalog.entries.find((e) => e.source_id === `public-tour-catalog:${tripId}:pt`);
  expect(entry, `catalog entry for ${tripId}`).toBeTruthy();
  return JSON.parse(readFileSync(resolve(root, entry!.snapshot_path), "utf8")) as { title: string; description: string; public_url: string };
};

describe("approved tour card allow-list", () => {
  it("each card matches the approved catalog snapshot: title, public path and a verbatim summary excerpt", () => {
    for (const tour of APPROVED_TOUR_CARDS) {
      const approved = snapshot(tour.id);
      expect(tour.title, tour.id).toBe(approved.title);
      expect(tour.path, tour.id).toBe(approved.public_url);
      expect(approved.description, tour.id).toContain(tour.summary);
      // a whole sentence/clause boundary on both sides, so an excerpt cannot silently change the meaning
      expect(approved.description.split(/(?<=\.)\s+/).some((sentence) => sentence.replace(/\.$/, "").includes(tour.summary)), tour.id).toBe(true);
    }
  });

  it("states no price, duration, schedule or availability, and the photo exists in the repository", () => {
    for (const tour of APPROVED_TOUR_CARDS) {
      expect(`${tour.title} ${tour.summary}`, tour.id).not.toMatch(/R\$|\d+\s*(?:horas?|h|min)\b|\bvagas?\b|\bdisponível|\bdesconto|\bpor pessoa/i);
      expect(existsSync(resolve(root, "public", tour.image.replace(/^\//, ""))), tour.image).toBe(true);
      expect(tour.imageAlt.length).toBeGreaterThan(8);
      expect(tour.path).toMatch(/^\/pt\/tours\/[a-z0-9]+$/);
    }
  });

  it("the photos are the ones configured for the published trips in the launch data", () => {
    const real = JSON.parse(readFileSync(resolve(root, "data/real-trips.json"), "utf8")) as Array<{ nome: string; imageUrl: string }>;
    for (const tour of APPROVED_TOUR_CARDS) expect(real.find((t) => t.nome === tour.title)?.imageUrl, tour.title).toBe(tour.image);
  });

  it("resolves ids against the closed list: unknown dropped, duplicates removed, at most three, order kept", () => {
    const [a, b, c, d] = APPROVED_TOUR_CARDS.map((t) => t.id);
    expect(resolveTourCards(undefined)).toEqual([]);
    expect(resolveTourCards(["nope", a, a, b]).map((t) => t.id)).toEqual([a, b]);
    expect(resolveTourCards([d, c, b, a]).map((t) => t.id)).toEqual([d, c, b]);
    expect(MAX_TOUR_CARDS).toBe(3);
  });
});

describe("server mapper exposes only allow-listed trip ids, never source internals", () => {
  const base: RuntimeResult = { outcome: "ANSWER", answer: "Texto.", response_kind: "grounded", source_ids: [], source_versions: ["sha256:abc"], chunk_ids: ["deadbeef"] };

  it("extracts catalog trip ids from source ids", () => {
    expect(tourIdsFromSourceIds(["approved-faq:pt", "public-tour-catalog:cmlhxkpy9000028zq27rhytew:pt", "public-tour-catalog:bad id:pt"])).toEqual(["cmlhxkpy9000028zq27rhytew"]);
  });

  it("maps grounded catalog sources to tour_ids and strips every internal field", () => {
    const reply = toConciergeReply({ ...base, answer: "Sugestão: Cristo Redentor + Pão de Açúcar.", source_ids: ["public-tour-catalog:cmlhxkpy9000028zq27rhytew:pt", "public-tour-catalog:unknownid123:pt", "approved-faq:pt"] });
    expect(reply.tour_ids).toEqual(["cmlhxkpy9000028zq27rhytew"]);
    expect(JSON.stringify(reply)).not.toMatch(/public-tour-catalog|approved-faq|sha256|deadbeef/);
  });

  it("attaches a card only when the answer names the tour (retrieved sources alone are not a recommendation)", () => {
    const sources = ["public-tour-catalog:cmlhxkpy9000028zq27rhytew:pt", "public-tour-catalog:cmli1a6im000034zqqzc9sppb:pt"];
    const named = toConciergeReply({ ...base, answer: "Um bom começo é o passeio Cristo Redentor + Pão de Açúcar.", source_ids: sources });
    expect(named.tour_ids).toEqual(["cmlhxkpy9000028zq27rhytew"]);
    const unnamed = toConciergeReply({ ...base, answer: "O ponto de encontro é informado na página do passeio.", source_ids: sources });
    expect(unnamed.tour_ids).toBeUndefined();
    const accentless = toConciergeReply({ ...base, answer: "sugiro cristo redentor + pao de acucar", source_ids: sources });
    expect(accentless.tour_ids).toEqual(["cmlhxkpy9000028zq27rhytew"]);
  });

  it("never attaches cards to refusals, handoffs or degraded replies", () => {
    for (const kind of ["refusal", "handoff", "degraded"] as const) {
      expect(toConciergeReply({ ...base, answer: "Cristo Redentor + Pão de Açúcar", response_kind: kind, source_ids: ["public-tour-catalog:cmlhxkpy9000028zq27rhytew:pt"] }).tour_ids).toBeUndefined();
    }
  });
});
