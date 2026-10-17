# Favela Rocinha — commercial and editorial closing: Owner review pack (17/10/2026)

Branch `sprint10/tours-content` (local, not pushed). Canonical commercial record: **Manual Mestre v0.2** (Google Drive, `📄 Ricardo Tour — Manual Mestre (.md)`, id `1mtSYIISghr0jGQ3HSkZVxar0CgFkO2-IjW7iMTpJIe0`), §11 TOUR-02 and §14.5 (internal costs, confidential — not reproduced here or in the code).

| Status | What |
|---|---|
| **VISUAL APPROVED** | RT-114 v2 layout; Rocinha photos (IMG_1243 cover, IMG_1253, IMG_1252, img-favela-deck, IMG_1247) and the silent clip (Owner, 17/10) |
| **CONTENT READY FOR OWNER REVIEW** | PT/EN/ES texts (RT-115) integrated in the local preview; EN/ES names are editorial proposals |
| **OPERATIONAL VALIDATION PENDING** | Safety/operation checklist (Manual §11.23), costs/taxes (prices are internal targets), physical requirements, schedules |
| **PRODUCTION NOT AUTHORIZED** | No push, merge, deploy, migration or price change; public route unchanged; record DRAFT (never public) |

## 1. Consolidated commercial sheet (from the Owner's decisions)
| Field | Value | State |
|---|---|---|
| Name | PT: Tour Favela Rocinha — Experiência Cultural Privativa · EN: Rocinha Favela — Private Cultural Experience · ES: Tour Favela Rocinha — Experiencia Cultural Privada | PT approved; EN/ES proposals |
| Model | Private only; 1–4 participants; adults 18+; PT/EN/ES subject to guide availability; booking subject to human confirmation | Approved |
| Duration | About 3 hours (estimate) | Approved |
| Meeting point | Near São Conrado metro station; exact spot by WhatsApp; hotel transport not included; ends near the meeting point | Approved |
| Route (10 steps) | Meeting → briefing → motorcycle taxi up → guided cultural walk → history and everyday life → cultural spots depending on the operation → available rooftop/viewpoint → permitted photos → motorcycle taxi down → end at meeting point. Adjustable for safety, operator, weather, access, operation | Approved preliminarily |
| Included / not included | 9 / 8 items (Manual §11.16–11.17); optional third-party services never guaranteed nor mandatory | Approved |
| Prices | Closed price per booking: 1 → R$ 450 · 2 → R$ 580 · 3 → R$ 750 · 4 → R$ 880 | **Internal targets — NOT FOR PUBLICATION** (lab review mode only, labelled) |
| Booking & payment | Request → human check → confirmation → proposal → 30% deposit → confirmed → 70% before start; PIX, credit card, cash; no automatic payment; CTA "Solicitar disponibilidade"; WhatsApp prefilled PT/EN/ES on the canonical number | Approved (model) |
| Cancellation | Escalated policy approved as a principle; the 30% deposit is not automatically a 30% penalty; terms depend on RT-81 | Pending (legal) |
| Children / accessibility | 18+ as commercial policy (no claim of a general ban); not universally accessible; case-by-case assessment | Approved; physical requirements pending |

## 2. Content (RT-115)
Full texts: `docs/product/rt-115-rocinha-content.md` (generated from `lib/catalog/drafts/rocinha.draft.ts`, the same source as the preview). Covers name, subtitle, short and full description, benefits, duration, type, participants, meeting point, route, inclusions, exclusions, practical information, operating conditions, 7 FAQs and CTA, in PT/EN/ES. Editorial rules applied: no "largest favela" claim, no romanticising, history/culture/residents valued, nothing pending stated as fact, no safety guarantee, the local operator fee is not described as an entry fee, prices kept out of the texts.

## 3. Local preview (rebuild lab, production-hidden)
`/{pt|en|es}/rebuild-lab/tour-content-preview/cmli1a6im000034zqqzc9sppb` on a local server. RT-114 v2 layout and Design System kept; content sections added inside the existing structure: "Sobre a experiência", meeting point/participants/minimum age in the essentials, optional third-party services, operating conditions, FAQ (native disclosure). Review mode shows "PRÉVIA PARA REVISÃO DO OWNER" and the provisional price table "PREÇOS PROVISÓRIOS — NÃO PUBLICAR" below the CTA; the reader view keeps "Em definição".

## 4. Test evidence (local production build)
| Check | Result |
|---|---|
| Unit tests | `tests/rt-113-tour-content.test.tsx` 35/35 (6 new RT-115: real non-mock DRAFT content valid in 3 locales and hidden publicly; forbidden claims and internal-cost words absent; provisional prices only in review mode with consistent totals; canonical WhatsApp prefill; new sections and localized title; other three tours untouched). Full suite 796 passed, 6 skipped |
| Lint / typecheck / build | clean / clean / OK (lab 404 in production without the flag, verified earlier today) |
| Navigation and gallery (Playwright) | desktop PT/EN/ES + mobile PT: HTTP 200, 5/5 photos in order, credit on photo 3 only, no horizontal overflow, CTA above the fold 4/4 (a regression found during this round — provisional table above the CTA — was fixed by moving the review-only table below the buttons), 0 console errors |
| Video | no autoplay; 0 bytes before play; desktop plays the full clip (3.6 MB), phones the light one (1.9 MB); slow 4G: start 0.73–0.74 s, 0–1 stall (≤ 27 ms) |
| Accessibility check | 12/12 (one h1, alt on every image, named buttons, live gallery position, visible focus, `lang` per locale) |
| Leak scan of the rendered HTML | no internal cost values, no "largest favela", no mock texts; the only word "custos" is the review-only note under the provisional table |
| Lighthouse | **Not run**: no Lighthouse installed locally, and the right environment is an isolated Preview (RT-106, not available). Plan: run on the isolated Preview with the same 4G profiles (`docs/product/rt-116-rocinha-performance.md`) |

## 5. What still blocks publication (no gap filled with invented information)
| Area | Blocking item | Ticket |
|---|---|---|
| Owner | Approval of the PT/EN/ES content and of the EN/ES names (content gate) | RT-115, RT-120 |
| Commercial/financial | Prices are internal targets: complete costs, taxes, card fee and minimum margin still to validate | RT-112 |
| Legal | Terms (cancellation, weather, operator responsibilities, consumer rights); per-tour conditions summary; privacy | RT-81, RT-118, RT-80 |
| Operation/safety | Checklist Manual §11.23: providers' regularity, legal conditions of motorcycle taxis, helmets/equipment, route safety, suspension rule and decision owner, emergency procedures, physical requirements, legal check of services | RT-112 |
| Rights | Written image authorisations of the people photographed (declared, not documented); mural artist identity ("@WARK ROCINHA..." inscription only) | RT-116 |
| Data/technical | Content still in code (DRAFT); FAQ, operating conditions, optional services, credit and video are not in the database schema; migration and content load on the hosted DB not authorised; media in `public/` reachable once deployed | RT-113 follow-up, RT-119 |
| Technical | Public page wiring with approved content only + Playwright on the public route + JSON-LD + Lighthouse on an isolated Preview; booking API gate; production guards and isolated Preview | RT-114, RT-110, RT-104…108 |
| Publication | Separate technical and commercial authorisations by the Owner; controlled deploy plan with rollback | RT-119, RT-107 |

## 6. Template for the other three tours
The same path, without rebuilding design or structure: Owner decisions → Manual Mestre §10/12/13 → draft module in `lib/catalog/drafts/` → exported review document → preview → tests (the RT-115 test block is the template) → Owner content gate.
