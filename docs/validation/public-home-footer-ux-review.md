# RT-UX-002A Public Home Footer UX Review

Date: 2026-06-24

Status: REVIEW

## Scope

RT-UX-002A is a small UX polish task. It removes the support microcopy row below the public Home hero CTAs and records a footer review for possible future polish.

This task does not redesign the homepage, add new sections, remove the Cadastur trust mark, add credibility claims, or change booking/payment/auth/backend behavior.

## Guidance Used

Read-only guidance was reviewed from:

- `.agents/skills/frontend-design/SKILL.md`
- `.agents/skills/web-design-guidelines/SKILL.md`
- `.agents/skills/copywriting/SKILL.md`
- `.agents/skills/copywriting/references/copy-frameworks.md`
- `.agents/skills/copywriting/references/natural-transitions.md`

No `.agents/` file and no `skills-lock.json` file was edited, staged, formatted, moved, or deleted.

## Playwright Before-State Inspection

Local `/pt` was attempted first, but the local page became unreliable because the Home route queries Prisma through `components/trip-list.tsx` and the local database connection returned `ECONNREFUSED`.

Local evidence:

- Next dev server started on `http://localhost:3217`.
- Local `/pt` initially compiled, then returned repeated HTTP 500 responses.
- Playwright post-check against local `/pt` returned `LOCAL_STATUS 500`.
- Server error referenced `prisma.trip.findMany()` in `components/trip-list.tsx`.

Because local visual inspection was blocked by the missing local DB, production `/pt` was used as the visual before-state reference, per task instruction.

Production before screenshots:

- Desktop: `C:\tmp\rt-ux-002a-before-desktop.png`
- Mobile: `C:\tmp\rt-ux-002a-before-mobile.png`

Production Playwright observations:

- Desktop viewport: 1440 x 1200.
- Mobile viewport: 390 x 844.
- Horizontal overflow: false on both desktop and mobile.
- Cadastur trust mark present with `alt="Cadastur"`.
- Footer text includes logo, company description, Empresa, Servicos, Suporte, Cadastro turistico, and copyright.

## Before Observations

### Hero

- The hero CTA area included the two requested support microcopy items below the buttons:
  - "Orientação pelo WhatsApp"
  - "Monte seu roteiro com ajuda da nossa equipe"
- On desktop, the row made the CTA cluster feel busier than necessary.
- On mobile, the row wrapped into a second line below the two stacked CTAs, adding visual noise in the first viewport.
- The primary and secondary CTAs were otherwise clear and should remain unchanged.

### Footer

- The footer has a clear dark visual treatment and preserves brand continuity with the rest of the page.
- Link grouping is understandable: Empresa, Servicos, Suporte.
- Cadastur is present and positioned in the lower footer area.
- There is no horizontal overflow on the inspected desktop or mobile screenshots.
- The footer itself is compact, but the page has a large empty vertical area above the footer when the catalog area has little visible content.
- On mobile, the footer stacks correctly, though the Cadastur area is visually understated and could be reviewed later for legibility and placement.

## Changes Made

Changed file:

- `components/hero-section.tsx`

Change:

- Removed the hero support microcopy row below the main CTA buttons.
- Removed the now-unused support-copy helper.
- Removed the now-unused `Clock3` and `MessageCircleMore` icon imports.
- Preserved the hero title, description, search, primary CTA, secondary WhatsApp CTA, background image, and visual layout.

No footer implementation change was made in this task. The footer review is documented as recommendations below.

## Recommendations Not Implemented

These are recommendations only and were not implemented in RT-UX-002A:

- Review the large empty vertical space between the catalog heading and footer when the tour catalog content is sparse or unavailable.
- Consider a future small footer pass to improve mobile Cadastur legibility without changing the trust mark or adding claims.
- Consider localizing static footer column titles such as "Empresa", "Servicos", and "Suporte" if a separate locale/copy task is approved.
- Review whether the footer description should use the same accent handling as the rest of the Portuguese UI. Do not add credentials, guarantees, ratings, reviews, or legal claims.

## Protected Trust and Claim Rules

- Cadastur was preserved.
- The Cadastur logo/trust mark was not removed.
- No unsupported credibility claims were added.
- No testimonials, ratings, review counts, guarantees, insurance claims, official partnership claims, or legal claims were added.

## Validation Commands

Pre-edit evidence:

- `git status --short --untracked-files=all`
- `git status -sb`
- `git rev-parse HEAD`
- `git rev-parse origin/main`
- `git log --oneline -3 --decorate origin/main`
- `Select-String -Path components/**/*.tsx,messages/*.json -Pattern "Orientação pelo WhatsApp|Monte seu roteiro|atendimento humano|Cadastro turístico|Cadastur" -Context 2,2`

Visual inspection:

- Local Next dev server attempted on `http://localhost:3217`.
- Local Playwright `/pt` check returned `LOCAL_STATUS 500` because of the local Prisma DB connection.
- Production Playwright `/pt` screenshots captured as before-state reference:
  - `C:\tmp\rt-ux-002a-before-desktop.png`
  - `C:\tmp\rt-ux-002a-before-mobile.png`

Post-edit validation to run:

- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `Select-String -Path components/**/*.tsx,messages/*.json -Pattern "Orientação pelo WhatsApp|Monte seu roteiro" -Context 2,2`
- `Select-String -Path components/**/*.tsx,messages/*.json -Pattern "Cadastur|Cadastro turístico" -Context 2,2`
- `git status --short --untracked-files=all`
- `git status -sb`

## Non-Implementation Statement

RT-UX-002A did not perform broad redesign, a full homepage rewrite, new section creation, Cadastur removal, unsupported credibility expansion, AI Concierge documentation, backend work, API work, database work, migration, seed, auth change, booking or payment logic change, package or lockfile change, dependency install, deploy, `.agents/` change, or `skills-lock.json` change.
