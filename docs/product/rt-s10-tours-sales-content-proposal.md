# Sprint 10 — Tours & Sales Content: ticket proposal (NOT created, NOT started)

- Date: 2026-10-15. Source: Volume II §5 (Sprint 10), §11 (Owner decision 14/10: catalog frozen at the **four authorized tours**), Jira (Sprint 10 = id 177, 0 tickets). Proposal only: no Jira issue was created, Sprint 10 was not started, no product was added.
- Scope rule: only the four existing tours (Tour Privado Premium; Confeitaria Colombo + City Tour; Tour Favela Rocinha; Cristo Redentor + Pão de Açúcar). No new tour, no C2Rio product (RT-101 blocked), no price change (prices only with Owner confirmation).

## What the four tour pages show today (production, read-only, 15/10)
Duration, category, description, highlights, included, not included, price per person in R$, "dates arranged with the team". **Missing** against Volume II §5 and the Terms draft v0.3 §4/T8: itinerary detail, meeting point, time, languages, participation requirements, confirmed accessibility, operator (UNCLASSIFIED, RT-99), cancellation conditions, licensed photo status per tour.

## Proposed tickets (codes follow the canonical pattern; reuse instead of duplicate)
| Code | Title | Mode | Reuse / new | Depends on |
|---|---|---|---|---|
| RT-RB-S10-01 | Tour content gap matrix for the 4 tours (field × tour × source × status) | AGENT | New | Sprint 9 gate |
| RT-RB-S10-02 | Owner content intake for the 4 tours (meeting point, time, languages, itinerary, requirements, accessibility, operator) | OWNER/HYBRID | New | S10-01; Q6 (operator) |
| RT-RB-S10-03 | Display the new structured facts on the tour page (PT/EN/ES), without changing the approved design | AGENT | New | S10-02; decision on storage (structured fields need an additive migration, same discipline as RT-100) |
| RT-78 | Commercial copy PT/EN/ES for the 4 tours | HYBRID | **Reuse RT-78** (Volume II assigns it to Sprint 10; move it from Sprint 8, no duplicate) | S10-02 |
| RT-RB-S10-04 | Replace the Tour Privativo Premium photo with the Owner's photo | OWNER/AGENT | New (today tracked only as a note in RT-79) | Owner photo |
| RT-RB-S10-05 | Replace the Quem Somos photo (Volume II §3 and §5) | OWNER/AGENT | New | Owner photo |
| RT-RB-S10-06 | Per-tour conditions block (cancellation/rules summary + link to Terms) | AGENT | New | RT-81 decisions (T4, Q8, Q10) |
| RT-RB-S10-07 | Controlled procedure to update the 4 tours' content in the hosted database (backup, dry run on a local clone, Owner authorization per change) | HYBRID | New | No admin editing exists until Sprint 11; production data change needs express authorization; Preview isolation (RT-106, deferred) |
| RT-RB-S10-GATE | Owner Content Gate: copy, photos, prices confirmed | OWNER | New | All above |

Not proposed (already owned elsewhere): Hero license (RT-79, backlog, blocks RT-51); JSON-LD/SEO (RT-47, Sprint 12 per Volume II); Lighthouse (RT-45); any PARTNER tour, "Operado por…" label (only after RT-101).

## Acceptance and tests (from Volume II §5, Sprint 10)
- Each publishable tour has complete content in PT/EN/ES and licensed media; no price without Owner approval.
- Tests: message parity PT/EN/ES, Playwright listing and detail, Lighthouse of the tour pages, JSON-LD validation.

## Conditions before creating these tickets
Sprint 9 gate decided by the Owner (RT-103), and the Owner approves this list (or edits it). Creation happens only then, in Sprint 10 (id 177), without starting the sprint.
