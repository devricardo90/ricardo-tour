# RT-79 — The three remaining decisions (Hero, people in tour photos, Quem Somos)

- Jira: RT-79 (Sprint 9 — Commercial Foundation). Source of truth: Volume II §5 and §11 (row of 14/10/2026). Date: 2026-10-15.
- Continues `docs/legal/rt-s9-79-media-rights-inventory.md` and the RT-79 Jira comment of 14/10/2026. The Owner's earlier attestations (institutional marks, authorship of the 4 tour photos, logo) **remain valid and are not asked again**.
- **Investigation only.** No image was replaced, cropped, edited, removed or re-encoded; `hero-media-status.ts` is unchanged; nothing was published; no database was read. No license, authorship or consent is presumed: a fact is listed as **proven** only when the repository, Git history or a recorded Owner decision shows it.
- Visual references: the decision page published for the Owner (link in the RT-79 Jira comment of 15/10/2026) shows every image below. In the repository the images are referenced by path and SHA-256 prefix only; no new media was committed.

## B1 — Hero (3 layers + 3 mobile derivatives), public on the Home

| Scene | Master | Mobile derivative | Content | People |
|---|---|---|---|---|
| Rio arrival (`rio-04`) | `components/home/hero/assets/rio-aerial-arrival.webp` (`fd1b02f98987042e`) | `derivatives/rio-04/mobile.webp` (`9e9d24352c0d8e36`) | Dusk aerial view: Sugarloaf, Botafogo bay, Christ on the right | none |
| Helicopter (`helicopter-05`) | `rio-helicopter-cockpit.webp` (`71f398b160fcb621`) | `derivatives/helicopter-05/mobile.webp` (`73a15914ed05d4f1`) | View through a cockpit windshield: Christ, Sugarloaf, sunset | none |
| Christ finale (`christ-06`) | `rio-christ-finale.webp` (`4a6203a29cf86a2a`) | `derivatives/christ-06/mobile.webp` (`52007449cfa4b0f0`) | Christ the Redeemer seen from behind, golden hour, bay | none |

**Proven**
- First appearance in Git: commit `7cd344f` (2026-09-24, "feat(rt-17): checkpoint accepted cinematic baseline"), under the lab route `app/[locale]/rebuild-lab/cinematic-3d-poc/assets/`. Moved to the public Home by `f36f829` (2026-10-01, RT-57).
- Until 2026-09-20 the RT-17 evidence documents state that **no photograph** was used (Version A/B: inline vector/CSS; Version C: "No photograph of Rio, the helicopter or Christ the Redeemer is introduced"). The images therefore entered between 2026-09-20 and the Owner checkpoint of 2026-09-23, **with no record of who supplied them or from where**.
- The code and the RT-26 manifest mark all three `PROTOTYPE_ONLY` / `RIGHTS_NOT_VERIFIED` / `replaceBeforeProduction: true` (`components/home/hero/hero-media-status.ts`, `scripts/media-pipeline/manifest.json`). The mobile derivatives inherit the master's status (RT-26/RT-28).
- RT-24 (`docs/architecture/rt-24-final-media-selection.md` §2, §4) found no license/author/provenance file and flags `rio-christ-finale.webp` as the highest risk ("looks professionally composed", possible unlicensed stock).

**Unknown**
- Author, source (own photo, stock bank, generated image, third-party site), license and permitted use, for all three.

**Technical observations (not evidence of origin)**
- None of the files carries metadata: simple lossy WebP (`VP8`), no EXIF, XMP, ICC or C2PA/content-credential chunk. Re-encoding removes metadata, so this neither proves nor rules out any origin.
- All three masters have the same dimensions, 1672×941, which is not a camera format. This indicates a common processing step, not a source.

**Correction to an earlier record.** The "AI-generated helicopter montage that was rejected and removed from the preview" (RT-10, 16/09/2026; backlog RT-CONTENT-001) refers to the **tour photo** `public/images/trips/imagem-helicoptero-cristo.jpg`, not to any Hero layer. The inventory (§2.5) has been corrected accordingly.

**Decision B1 (Owner)**: what is the origin of the three Hero images?
1. **Own photography** (yours or your team's) → state the author; status can become `RIGHTS_VERIFIED` by Owner attestation.
2. **Licensed (image bank or photographer)** → send the license (name of the bank, license type, date); its terms decide web/commercial use.
3. **AI-generated** → state the tool. Then the tool's commercial-use terms apply, and the Volume I rule applies: **no generated image may be presented as a real photograph**. Owner decides whether this is acceptable in the Hero.
4. **Unknown** → the code already requires replacement before production. Replacement is a separate task, with images you approve (RT-24 candidates or new); nothing is replaced without your approval.

## B2 — Identifiable people in the tour photos (authorship already declared)

| Photo (tour) | People visible | Identifiability (agent's visual assessment) |
|---|---|---|
| `public/images/trips/imagem-pao-de-acucar.jpg` (`dcd0c2be35c9a951`), Cristo Redentor + Pão de Açúcar | 1 woman, from behind / three-quarter rear, pointing at the view | **Low**: face not visible; hair, clothing and silhouette only |
| `public/images/trips/imagem-tour-favela-rocinha.jpg` (`516affed264fb65d`), Tour Favela Rocinha | (a) woman in the foreground, partial profile (cheek, eye, ear); (b) man in a brown T-shirt, from behind; (c) person with curly hair, from behind, age not determinable; (d) partial figure at the right edge | **(a) medium-high**: the most identifiable person in the photo; (b)–(d) low |

**Proven:** the Owner declared authorship (14/10/2026). **Unknown:** whether the people shown authorized the use of their image.

Note for legal review (not a legal opinion): under Brazilian law the commercial use of the image of an identifiable person generally requires that person's authorization (Constitution art. 5, X; Civil Code art. 20; STJ Súmula 403: damages for unauthorized commercial use do not require proof of harm). An image of a person who cannot be identified carries lower risk. If any person shown is a minor, extra care applies (LGPD art. 14). Under the LGPD, an image of an identifiable person is personal data.

**Decision B2 (Owner)**, one answer per photo:
1. **The people authorized** → keep (record: who, how; for example a message or a signed term).
2. **Not authorized / unknown** → choose: (a) keep anyway, assuming the risk (Owner decision; low risk for the Pão de Açúcar photo); (b) a cropped or blurred version that removes the identifiable person (a new derivative, made only after your approval); (c) replace with another photo of yours.

## B3 — Quem Somos photo

| File | Where | Content |
|---|---|---|
| `public/images/about/ricardo-guia-home.webp` (`f30cf3c6a9d1e980`, 1000×1250) | **PUBLIC**: Home About block (`components/about-rick-travel-section.tsx:60`) and `/quem-somos` (`app/[locale]/(site)/quem-somos/page.tsx:43`) | A guide in a Brazil football shirt and cap, wearing an ID badge, at a viewpoint over Botafogo/Sugarloaf |
| `public/images/about/ricardo-guia-cracha.webp` (`5f3dafd381e7a78c`, 1122×1402) | Master of the file above; no longer rendered | Same photo |

**Proven**
- The public file is the 1000 px derivative made in RT-34 (commit `ff44d0f`, 2026-09-30: "one authentic founder photo (existing public /quem-somos media)").
- The master was added on 2026-05-14 (commit `7dddcbe`, task RT-FINAL-05F, `docs/ops/backlog.md`): "replace the placeholder photo on the Quem Somos page with the **real photo of the guide with badge**", copied from the Downloads folder together with the three testimonial photos. The repository records the supplied file, not the photographer.
- **This is not the photo that Volume I calls "provisional".** The provisional photo in the approved Home baseline is a different image: `docs/baseline/rt-home-design-approved/preview/complete-home/about-ricardo-review/ricardo-pao-de-acucar-owner-supplied.png` (a selfie at "Estação III Pão de Açúcar"). It is "Owner-supplied … provisional for publication" (`MANIFEST.md`, `OWNER-APPROVAL.md`), and it was **never published**. Volume II §3 separately records "substitute the Quem Somos photo later" (Sprint 10).

**Unknown**
- Who took the photo, and whether the person shown authorized its publication. If the person shown is the Owner, the Owner's own consent suffices and only authorship remains.
- Whether the image was edited. Observations: the `.webp` master is actually a PNG file; it has exactly the same dimensions (1122×1402) as the baseline selfie (a common processing step); the badge text cannot be read even at full resolution, so no personal data on the badge is exposed. None of this proves anything. It is listed so the Owner can confirm that the picture is an authentic, unaltered photo, because the site presents it as the real guide.

**Decision B3 (Owner):**
1. **Keep until the Sprint 10 replacement**: confirm who is shown, that the person authorizes publication, who took it, and that it is a real, unaltered photo (or describe the editing).
2. **Replace now**: send the photo you approve. The replacement itself is a separate, authorized change, never chosen by the agent.

## What closes RT-79 after the answers
- B1 answer 1 or 2 (with evidence) → status `RIGHTS_VERIFIED` recorded in `hero-media-status.ts` and the manifest (code change in a separate commit, with the Owner's approval). Answer 3 or 4 → a replacement task.
- B2 and B3 answers recorded in Jira and in this document.
- Not blocking RT-79: the Tour Privativo Premium photo (`PENDING OWNER REPLACEMENT PHOTO`), the hidden people photos and the legacy videos (housekeeping), and RT-109 (SuperTur).
