import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// The public catalog module imports Prisma; this test only needs its constant, never the database.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { LAUNCH_TRIP_IDS } from "@/lib/catalog/public-trips";
import { APPROVED_TOUR_CARDS } from "@/lib/ai-concierge/ui/tours";

// RT-96 audit gap: Daniela's recommendation cards and the site's public catalog are two separate lists. They matched by hand;
// nothing stopped them from drifting (a tour unpublished on the site would still be recommended, linking to a 404).
describe("Daniela catalog matches the public launch catalog (RT-96)", () => {
  it("recommends exactly the publicly sellable tours, no more and no fewer", () => {
    expect(APPROVED_TOUR_CARDS.map((tour) => tour.id).sort()).toEqual([...LAUNCH_TRIP_IDS].sort());
  });

  it("links every card to that tour's public page", () => {
    for (const tour of APPROVED_TOUR_CARDS) expect(tour.path).toBe(`/pt/tours/${tour.id}`);
  });

  it("uses images that exist in the public folder", () => {
    for (const tour of APPROVED_TOUR_CARDS) {
      expect(tour.image.startsWith("/")).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", tour.image))).toBe(true);
    }
  });
});
