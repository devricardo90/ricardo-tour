import { describe, expect, it } from "vitest";
import { loadGlobeTextures } from "@/components/home/hero/globe-textures";

// RT-45 second review (#2): without a worker the textures are drawn on the main thread. If drawing fails (here: no canvas
// API at all in Node), the loader must resolve null — the hero then shows its static frame as "unavailable" — instead of
// throwing out of the GSAP matchMedia callback and leaving the journey without a timeline.
describe("globe texture loader", () => {
  it("never throws and resolves null when drawing is impossible", async () => {
    let loader: ReturnType<typeof loadGlobeTextures> | undefined;
    expect(() => { loader = loadGlobeTextures(); }).not.toThrow();
    await expect(loader!.promise).resolves.toBeNull();
    expect(() => loader!.cancel()).not.toThrow();
  });
});
