import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Owner 30/10/2026: everything in public/ is served by URL with the release, even when no page shows it. Legacy files of
// the old site with no reference anywhere in the repository (faces, testimonials, unused trip photos, old hero videos) were
// removed from the artifact (git history keeps them). The legacy covers that are still referenced (Concierge cards, lab
// mock, seed/import data) stay until those references are replaced.
const root = path.resolve(__dirname, "..");
const pub = path.join(root, "public");

const REMOVED = [
  "avatars/camila.jpg", "avatars/dany.jpg", "avatars/julia.jpg", "avatars/lucas.jpg", "avatars/mariana.jpg", "avatars/rafael.jpg",
  "images/about/founder-team.jpg", "images/about/guide-ricardo.jpg", "images/about/ricardo-guia-cracha.webp",
  "images/seals/cadastur-official.png",
  "images/testimonials/beyjamin-bonfim.webp", "images/testimonials/carlos-moura.webp", "images/testimonials/danyela-viana.webp",
  "images/trips/imagem-casal-pao-de-acucar.jpg", "images/trips/imagem-confeitaria-colombo.jpg",
  "images/trips/imagem-rio-carnaval.jpg", "images/trips/imagem-vista-favela.jpg",
  "videos/imagem-rio-perfil.jpg", "videos/newhero.mp4", "videos/rio-de-janeiro-hero.mp4", "videos/video-site-hero.mp4",
  "plane.svg",
];

/** Still referenced: kept until the references are replaced with own media. */
const LEGACY_KEPT = [
  "images/trips/confeitaria-colombo-city-tour.jpeg", "images/trips/imagem-igreja-centro-rio.jpg", "images/trips/imagem-pao-de-acucar.jpg",
  "images/trips/imagem-tour-favela-rocinha.jpg", "images/trips/imagem-buzios-praia.jpg", "images/trips/imagem-escadaria-selarao-brasil.jpg",
  "images/trips/imagem-floresta-tijuca.jpg", "images/trips/imagem-helicoptero-cristo.jpg",
];

/**
 * Not referenced in the repository, but the imageUrl of retired catalog rows in the database (Morro da Urca, Tour Praias):
 * the admin still lists those rows, so the files stay until the rows are archived (no destructive database change).
 */
const DB_REFERENCED = ["images/trips/imagem-morro-pao-de-acucar.jpg", "images/trips/imagem-praia-ipanema.jpg"];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [path.relative(pub, full).split(path.sep).join("/")];
  });

/** Repository files (tracked or new, docs excluded) that mention the file name. */
function referencesTo(fileName: string) {
  const out = execFileSync("git", ["grep", "-l", "--untracked", "-F", fileName, "--", ".", ":!docs", ":!*.md", ":!tests/rt-s11-legacy-public-media.test.ts"], { cwd: root, encoding: "utf8" }).trim();
  return out ? out.split("\n") : [];
}
function safeReferencesTo(fileName: string) {
  try {
    return referencesTo(fileName);
  } catch {
    return []; // git grep exits 1 when nothing matches
  }
}

describe("public/ ships no orphan legacy media (Owner 30/10/2026)", { timeout: 120_000 }, () => {
  it("the removed legacy files are not in the artifact and nothing points to them", () => {
    for (const file of REMOVED) {
      expect(existsSync(path.join(pub, file)), file).toBe(false);
      expect(safeReferencesTo(path.basename(file)), file).toEqual([]);
    }
    // No customer faces or testimonials are served at all.
    for (const dir of ["avatars", "images/testimonials", "videos"]) expect(existsSync(path.join(pub, dir)), dir).toBe(false);
  });

  it("every file left in public/ is referenced somewhere (a new orphan fails here)", () => {
    const orphans = walk(pub).filter((file) => !DB_REFERENCED.includes(file) && safeReferencesTo(path.basename(file)).length === 0);
    expect(orphans).toEqual([]);
  });

  it("the still-referenced legacy covers are kept until their references are replaced", () => {
    for (const file of [...LEGACY_KEPT, ...DB_REFERENCED]) expect(existsSync(path.join(pub, file)), file).toBe(true);
  });

  it("the approved own media, logo, Cadastur mark and the About portrait are untouched", () => {
    const covers = [...readFileSync(path.join(root, "lib/catalog/public-trips.ts"), "utf8").matchAll(/"(\/media\/tours\/[^"]+)"/g)].map((m) => m[1]);
    expect(covers).toHaveLength(3);
    for (const cover of covers) expect(existsSync(path.join(pub, cover)), cover).toBe(true);
    for (const file of ["images/ricardo-tour-logo.png", "cadastro/cadastur.png", "logos/logo-turismo.webp", "images/about/ricardo-guia-home.webp", "images/placeholder.svg"]) {
      expect(existsSync(path.join(pub, file)), file).toBe(true);
    }
    expect(walk(path.join(pub, "media")).length).toBe(26);
  });
});
