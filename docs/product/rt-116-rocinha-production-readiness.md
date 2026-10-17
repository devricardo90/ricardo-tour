# Favela Rocinha — production readiness (17/10/2026)

- Tour: `cmli1a6im000034zqqzc9sppb` (Tour Favela Rocinha com Guia Local).
- State: **visual integration APPROVED by the Owner (17/10/2026)**: RT-114 v2 layout, main photo, the five photos and their order, short silent video, desktop and mobile, identity and proportions. Local commit `dc58359`, branch `sprint10/tours-content` (not pushed).
- **Visual approval is not a publication authorisation.** Nothing below may be executed in production without a specific Owner authorisation.
- Sources: Jira (17/10: RT-81, RT-112, RT-115, RT-116, RT-117 in progress; RT-114 in review; RT-104…108, RT-110, RT-118, RT-119 backlog), Volume II, `docs/product/rt-s10-02-owner-intake.md` (RT-112), `docs/product/rt-116-rocinha-media-selection.md`, `docs/product/rt-116-rocinha-performance.md`.

## Summary
| Area | Ready? | Blocking items |
|---|---|---|
| Visual / media | **Yes** (approved) | Credit spelling to confirm; written consent kept on file (recommended) |
| Technical | **No** | Public page not wired (RT-114); data model not on the hosted DB (RT-113/RT-119); video and credit not in the schema; media hosting; RT-110; Preview isolation |
| Commercial | **No** | Price, operator, duration, meeting/pickup, start time, languages, inclusions, children/minimum age (RT-112) |
| Legal | **No** | Terms (RT-81) incl. weather/cancellation; per-tour conditions (RT-118); Privacy (RT-80) |
| Content | **No** | All PT/EN/ES texts are mock (RT-115); alt texts and video caption need review |
| Publication | **No** | Owner authorisation, controlled update procedure (RT-119), production promotion control (RT-107), rollback plan |

## 1. Technical
| # | Item | Status / why it blocks | Ticket |
|---|---|---|---|
| T1 | Public `/tours/[id]` still uses the old page; the approved RT-114 sections exist only in the rebuild lab | Wiring is a separate authorised change: only approved content, no placeholders, Playwright (list + detail), JSON-LD, Lighthouse | RT-114 |
| T2 | `TripContent`/`TripItineraryStop`/`TripImage` tables exist only in local throw-away databases | Migration on the hosted DB not authorised; order when authorised: migration → code; needs Preview isolation first | RT-113, RT-119, RT-106 |
| T3 | Rocinha content is a MOCK/DRAFT record in code; the public gate never shows it | Real content must be entered as `OWNER_APPROVED`, non-MOCK, validated (`validateTourContent`) through the RT-119 procedure | RT-119 |
| T4 | **Video and photo credit are not in the data model** (prototype-only fields) | Either add `TripVideo` + `TripImage.credit` (migration) or publish the first version without video/credit | RT-113 follow-up (Sprint 11) |
| T5 | **Media in `public/media/tours/favela-rocinha/`** | Anything in `public/` becomes reachable by direct URL as soon as it is in a deploy, even with the page hidden. `main` auto-deploys production: these files must not reach `main` before publication is authorised. Alternative: Vercel Blob/CDN with controlled release | RT-116, RT-107 |
| T6 | Performance: slow-4G stalls (8–9, 2.4 s); extra main-thread work; LCP inconclusive locally | Lighter video rendition for mobile; Lighthouse on isolated Preview (RT-114 criterion 5) | RT-114 |
| T7 | Booking API does not enforce the public gate | Blocks any publication tied to booking (the CTA leads to the request flow) | RT-110 |
| T8 | Preview shares production resources; no deny-by-default guard; main not protected | Needed to validate safely before production | RT-104…108 |
| T9 | `OptimizedImage` can stay blurred when an image loads before hydration | Public components that still use it must be checked when wiring | RT-114 |
| T10 | Media weight in git (≈ 6 MB for one tour) | Acceptable for one tour; for four tours prefer external media storage | — |

## 2. Commercial (RT-112 — Owner decisions)
| # | Item | Current state |
|---|---|---|
| C1 | **Price** | The published R$ 120 belongs to the old catalog and is not approved for the private experience (Owner, 16/10). The prototype shows "Em definição", which cannot go public. Decision A8; any price change only via RT-119 with authorisation |
| C2 | Modality | **Confirmed**: private experience |
| C3 | Operator (own / partner) | Open (A1) — needed by the Terms |
| C4 | Duration | Open (old "3 a 4 horas" not approved) |
| C5 | Meeting / pickup | "Busca no hotel" provisional (A4: which areas?) |
| C6 | Start time / how dates work | Open (A3) |
| C7 | Guide languages | Open (A2) |
| C8 | Included / not included | Open (old list not approved) |
| C9 | Children and minimum age; physical effort (stairs, alleys) | Open (A5) — relevant for this tour |
| C10 | Official product name | Current title is provisional |

## 3. Legal
| # | Item | Status | Ticket |
|---|---|---|---|
| L1 | Terms of use (operator, cancellation, weather, liability) | In progress, drafts v0.3, Owner decisions pending | RT-81 |
| L2 | Per-tour conditions summary with link to the Terms | Blocked by RT-81 | RT-118 |
| L3 | Privacy policy (incl. request form data) | In progress | RT-80 |
| L4 | Image rights of the people shown | Owner declared consent/authorisation (17/10). **Recommendation:** keep written authorisations on file (the Cristo register already lists "attach proof" as pending — same practice here). No legal opinion given | RT-116 / RT-79 |
| L5 | Mural (IMG_1252) | Credit authorised; confirm exact handle. Works permanently in public places may be represented (Lei 9.610/98 art. 48) — to be confirmed by legal review | RT-116 |
| L6 | Location privacy | GPS removed from every web file (tested) | — |
| L7 | Institutional data on the page (CNPJ, razão social, Cadastur) | CNPJ confirmed (49.142.341/0001-90); razão social and Cadastur to confirm | RT-80/81 |

## 4. Content (RT-115)
| # | Item | Status |
|---|---|---|
| K1 | Summary, description, pitch, benefits, itinerary, inclusions, requirements, accessibility, weather note | All MOCK ("exemplo fictício") — real PT/EN/ES texts depend on RT-112 answers |
| K2 | Photo alt texts (PT/EN/ES) | Written from what each photo shows; to be reviewed in RT-115 |
| K3 | Video caption and "A Rocinha em movimento" title | Proposed, PT/EN/ES; to be reviewed in RT-115 |
| K4 | Community-respectful wording | Editorial rule to apply in RT-115 (no "poverty tourism" framing; local guide and community benefit, if confirmed) |

## 5. Publication
| # | Item | Status |
|---|---|---|
| X1 | Specific Owner authorisation for publication | Not given |
| X2 | Controlled update of the hosted content (RT-119) | Backlog, not authorised |
| X3 | Production promotion only by the Owner; protected `main` | Backlog (RT-107); today `main` auto-deploys production |
| X4 | Isolated Preview for final checks | Backlog (RT-106) |
| X5 | Rollback plan (code revert + `rollback.sql` for the RT-113 tables + media removal) | Documented for RT-113; to be completed for media |
| X6 | Post-publication checks | Playwright public suite, JSON-LD, Lighthouse, Web Vitals, gate tests (mock never public) |

## 6. Proposed order to reach publication (each step needs its own authorisation)
1. RT-112 answers (C1–C10) → RT-115 texts PT/EN/ES → Owner approval of the content.
2. RT-81/RT-118 conditions approved; RT-80 privacy.
3. RT-104…108 (guards, isolated Preview, protected main) and RT-110 (booking API gate).
4. Decide video/credit in the model (T4) and media hosting (T5); lighter video rendition (T6).
5. RT-114 public wiring + tests; Lighthouse on Preview.
6. RT-119: migration and content entry on the hosted DB, with rollback ready.
7. Owner authorises publication → promotion → post-publication checks.
