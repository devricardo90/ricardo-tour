# RT-79 — Media rights inventory (RT-RB-L-04, Sprint 9 preparation)

- Jira: RT-79. Sprint 9 — Commercial Foundation. Source of truth: Volume II (Google Doc `1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw`), section 5.
- Date: 2026-10-12. Base: branch `sprint9/commercial-foundation`. **Preparation only.** Nothing was deleted, replaced, edited or published. No right, license, consent or authorship is asserted anywhere in this file: every "rights" cell is `UNVERIFIED` until the Owner supplies evidence.
- Method: `node scripts/media-reference-scan.mjs` (read-only) lists every media file under `public/` and `components/home/hero/assets/` and where its file name appears (code, data, docs). Repository evidence only: no hosted-database content was read, so which images the 4 public tours actually use (`Trip.imageUrl`) is **not verified** here.
- Existing evidence: `docs/architecture/rt-24-final-media-selection.md` already records that no license/author/provenance metadata exists in the repository for the hero candidates and that "LICENSED_VERIFIED_ASSETS: NONE".

## 1. How to read this

- **Where used**: `PUBLIC` = rendered by public pages (code reference); `DATA` = referenced by `prisma/seed.ts`, `data/real-trips.json` or `knowledge/concierge/catalog/*` (not necessarily shown to visitors); `DOCS` = only mentioned in docs; `NONE` = no reference found anywhere. **Mapping to the script output:** the script prints `USED` for both `PUBLIC` and `DATA` (any code/data reference), `DOCS` for docs-only mentions and `NOREF` for `NONE`; this document refines `USED` into `PUBLIC` vs `DATA` by reading the referencing file. Static references are not proof of runtime use (RT-7): files may also be reached through database values, `proxy.ts`, `next.config.ts` or `i18n/` (the script searches these too, since this revision).
- **Rights status** is always `UNVERIFIED` unless evidence is attached. The Owner fills the columns in section 4.
- **Decision** column proposals are only a way to organize the Owner's choices (KEEP / REPLACE / REMOVE / TBD). They are not recommendations to delete anything; RT-7 states no asset deletion is authorized.

## 2. Inventory

### 2.1 Brand
| File | Where used | Notes | Rights |
|---|---|---|---|
| `public/images/ricardo-tour-logo.png` | PUBLIC (header/footer logo, OG route, favicon source) | Official Ricardo Tour artwork supplied by the Owner (RT-94) | UNVERIFIED (expected Owner-owned; confirm authorship/designer agreement) |

### 2.2 Third-party marks and institutional seals — **needs an Owner decision (claims, not only copyright)**
| File | Where used | Notes | Rights / claim |
|---|---|---|---|
| `public/logos/logo-turismo.webp` | PUBLIC — Home, "Why Rick Travel" section, under the heading "Referências institucionais / Institutional references / Referencias institucionales" (`components/institutional-marks.tsx`, `components/why-rick-travel-section.tsx`) | One composite image containing five marks: **Cadastur, ABAV, TripAdvisor, Visit Rio, Visit Brasil** | UNVERIFIED. Showing third-party logos under "institutional references" can read as membership/affiliation/endorsement. The project rule (RT-AI-013/015) is no credential, affiliation or rating claim without Owner-approved evidence. Needs, per mark: proof of the relationship, permission/brand-use terms where required, and approved wording. |
| `public/cadastro/cadastur.png` | PUBLIC — footer (`components/site/site-footer.tsx`) | Cadastur trust mark (Volume I: "Cadastur must be preserved and described without invented claims") | UNVERIFIED: registration evidence and exact approved wording (see RT-AI-010/011/016 documents) |
| `public/images/seals/cadastur-official.png` | DOCS only | Larger Cadastur asset; **marked as deleted in the Owner's main working tree** (it still exists in the Sprint 9 worktree and on `origin/main`; not touched by this work) | UNVERIFIED |

### 2.3 People and identity (consent/personal-data aspects)
| File | Where used | Notes | Rights / consent |
|---|---|---|---|
| `public/images/about/ricardo-guia-home.webp` | PUBLIC — Home About block and `/quem-somos` | 1000 px derivative (RT-34) of `ricardo-guia-cracha.webp`, the "real photo of the guide with badge" added on 2026-05-14 (RT-FINAL-05F). *Corrected 2026-10-15:* the photo Volume I calls **provisional** is a different, never-published image (`docs/baseline/rt-home-design-approved/.../ricardo-pao-de-acucar-owner-supplied.png`); Volume II §3 still plans to replace the Quem Somos photo (Sprint 10). Details: `rt-s9-79-remaining-decisions.md` (B3) | UNVERIFIED (photographer, consent of the person shown) |
| `public/images/about/ricardo-guia-cracha.webp` | DOCS only since RT-34 (master of the file above) | Real file format is PNG, 1122×1402 | UNVERIFIED (same as above) |
| `public/images/about/guide-ricardo.jpg`, `founder-team.jpg` | DOCS only | Photos of identifiable people; unreferenced by code | UNVERIFIED (authorship + consent of the people shown) |
| `public/images/testimonials/beyjamin-bonfim.webp`, `carlos-moura.webp`, `danyela-viana.webp` | DOCS only (not rendered; hard-coded testimonials were removed in RT-AI-013) | **Named individuals' photos (~1.8 MB each) still shipped in `public/`**, therefore publicly fetchable by URL even though no page shows them | UNVERIFIED; no evidence of consent to publish or of the testimonials being genuine. Personal-data/image-rights sensitivity: Owner to decide keep/remove. |
| `public/avatars/{camila,dany,julia,lucas,mariana,rafael}.jpg` | `camila.jpg`: DOCS (one mention in `current-home-inventory.md`); the other five: NONE (no reference anywhere) | Six tiny first-name avatar files, not used by any code | UNVERIFIED |

### 2.4 Tour photographs (`public/images/trips/`)
| File | Where used | Notes |
|---|---|---|
| `confeitaria-colombo-city-tour.jpeg` (4.8 MB), `imagem-igreja-centro-rio.jpg`, `imagem-pao-de-acucar.jpg`, `imagem-tour-favela-rocinha.jpg` | DATA (`data/real-trips.json`, `knowledge/concierge/catalog/approved-tour-cards.json`) | Likely candidates for the public tours; the live mapping lives in the hosted database (not read) |
| `imagem-buzios-praia.jpg` | DATA (`data/real-trips.json`) | Búzios is outside the Rio launch scope (`LAUNCH_CITY`) |
| `imagem-escadaria-selarao-brasil.jpg`, `imagem-floresta-tijuca.jpg`, `imagem-helicoptero-cristo.jpg` (the seed also references `imagem-pao-de-acucar.jpg` and `imagem-tour-favela-rocinha.jpg`) | DATA (`prisma/seed.ts`; seed ids are not public, RT-98 F1) | `imagem-helicoptero-cristo.jpg` is a three-photo composite (RT-24 §2) |
| `imagem-casal-pao-de-acucar.jpg`, `imagem-confeitaria-colombo.jpg`, `imagem-morro-pao-de-acucar.jpg`, `imagem-praia-ipanema.jpg`, `imagem-rio-carnaval.jpg`, `imagem-vista-favela.jpg` | DOCS only | Referenced by old baselines; stored `Trip.imageUrl` values in the database may still point at some of them (RT-7: classification by static reference does not prove runtime use) |
| Rights for all of the above | | RT-24 §3: authorship not confirmed in the repository ("presumably customer/team photos already used commercially"); no license notes found. **UNVERIFIED.** Photos showing identifiable tourists need consent evidence. |

### 2.5 Hero and Home media
| File | Where used | Notes |
|---|---|---|
| `components/home/hero/assets/rio-aerial-arrival.webp`, `rio-helicopter-cockpit.webp`, `rio-christ-finale.webp` + `derivatives/*/mobile.webp` (3) | PUBLIC — cinematic hero (`hero-media.ts`) | Temporary prototype layers; `data-media-status = PROTOTYPE_ONLY`; **provenance/licensing PENDING VERIFICATION** (Volume I, RT-17 debt; RT-24; RT-27). Origin of the current layers must be stated by the Owner (own photo, stock license, AI-generated, etc.). *Corrected 2026-10-15:* the "AI-generated helicopter montage rejected and removed from the preview" recorded in Volume I/RT-10 is the **tour photo** `public/images/trips/imagem-helicoptero-cristo.jpg` (RT-CONTENT-001), not a Hero layer. Git origin and the remaining decision: `rt-s9-79-remaining-decisions.md` (B1). |
| `public/media/rio-story/*` (church, sunset, poster, desktop/mobile mp4) | PUBLIC — Home "Rio Story" (`components/rio-story-section.tsx`) | Source files are named "owner-approved" in the approved baseline (`docs/baseline/rt-home-design-approved/MANIFEST.md`), which records **visual approval, not authorship or license**. Provenance not recorded. UNVERIFIED. |
| `public/videos/newhero.mp4` (7.7 MB), `rio-de-janeiro-hero.mp4` (7.6 MB), `video-site-hero.mp4` (1.6 MB), `imagem-rio-perfil.jpg` | DOCS only (legacy hero from before RT-57; the video was deliberately removed in RT-UX-001F) | ~17 MB of unreferenced video still shipped in `public/`; rights UNVERIFIED. |

### 2.6 Other
| Item | Notes |
|---|---|
| `public/images/placeholder.svg`, `public/plane.svg` | Generic/neutral; no rights concern expected (confirm they are not third-party artwork) |
| Open Graph image (`app/[locale]/og/route.tsx`) | Brand artwork only, no photographs (RT-47); inherits the logo status |
| Fonts: Cormorant Garamond and Inter | SIL Open Font License 1.1 documented (RT-11 evidence, `docs/baseline/rt-11-approved/`) — the only item with documented licensing |

## 3. Findings summary

1. **Nothing in the repository has recorded provenance or license evidence** except the fonts. Every image/video is UNVERIFIED.
2. **Highest exposure (publicly visible now):** the five institutional marks on the Home; the hero prototype layers; the Rio Story media; the provisional Quem Somos photo; tour photos shown through the database.
3. **Shipped but not shown:** three named testimonial photos, six avatars, three founder/guide photos, ~17 MB of legacy hero videos and several unused tour photos. They are fetchable by URL. Whether to keep them is an Owner decision; this ticket deletes nothing.
4. The **live mapping of images to the 4 public tours is in the hosted database** and was not read; the Owner (or an authorized read) must confirm which files are actually public.

## 4. Owner evidence form (one row per asset or group)

| Asset / group | Author / owner | License or permission (document, link, date) | Allowed use (web, commercial, derivatives) | Attribution required? | People shown + consent? | Decision (KEEP / REPLACE / REMOVE / TBD) |
|---|---|---|---|---|---|---|
| (fill in) | | | | | | |

For each of the five institutional marks, additionally: relationship (member / listed / certified / none), proof, brand-use permission, and the exact wording the Owner approves for the site.

## 5. What this ticket can and cannot close

- **Done in preparation:** reproducible inventory (`scripts/media-reference-scan.mjs`), classification, risks, the evidence form.
- **Cannot be done by the agent (Owner-only, gate):** supplying authorship/licenses/consents; deciding KEEP/REPLACE/REMOVE; approving institutional-mark wording. RT-79's acceptance criterion ("every public media asset has recorded rights or is replaced") therefore stays **open**.
- Suggested sequencing for the Owner: (1) the five institutional marks and the hero/Rio Story media (publicly visible, highest exposure); (2) tour photos behind the 4 public tours; (3) the shipped-but-hidden people photos; (4) housekeeping of unreferenced files (separate, authorized change).
