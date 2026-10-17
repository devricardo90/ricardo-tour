# RT-114 — Design System audit for the tour page (Owner addendum, 16/10/2026)

- Trigger: the Owner rejected the dominant beige of the RT-114 prototype ("looks like the Claude AI identity and is out of line with the rest of the Ricardo Tour website") and asked to audit the existing Design System before changing colors. No new identity, no new tokens without documenting gaps first.

## 1. Official tokens (`app/[locale]/(site)/site-theme.css`, RT-52; values approved in RT-10/RT-11/RT-12/RT-13)
| Group | Token | Value |
|---|---|---|
| Surfaces | `--site-charcoal` / `--site-charcoal-raised` | `#0b0e11` / `#15191d` |
| Surfaces | `--site-cream` / `--site-cream-soft` | `#f3efe6` / `#fbf8f2` |
| Text | `--site-ink` / `--site-ink-muted` | `#171a1e` / `#53565a` |
| Text on dark | `--site-on-dark` / `-muted` / `-subtle` | `#f4f0e8` / `#cac7bf` / `#9da3a5` |
| Accent | `--site-gold` / `-bright` / `-deep` | `#c8a86b` / `#e8c780` / `#8a6a2b` |
| Rules/focus | `--site-rule-light`, `--site-rule-dark`, `--site-focus` | `#cfc7ba`, `rgb(255 255 255 / .1)`, `#e8c780` |
| Type | `--site-display` (Cormorant Garamond) / `--site-body` (Inter) | RT-11 |

Buttons (documented in RT-10 §CTA and RT-14 §3.3, **not** as CSS variables): primary CTA = solid gold `#C8A86B` with charcoal text, hover `#E8C780` (lift −1px), pressed `#A9864E`, border 1px, radius 6px, min-height 42px, text ≥ 14px. Secondary = gold outline (Home "Ver detalhes", header "Planeje sua viagem").

## 2. How the public pages use them (code, 16/10)
| Surface | Background | Notes |
|---|---|---|
| Header, footer | charcoal | gold rule, on-dark text |
| Home hero (globe) | dark | — |
| **Home "Experiences" — where tours are presented** | **charcoal `#0B0E11`, cards raised `#15191D`** | gold eyebrow, on-dark titles, gold-outline "Ver detalhes", duration chips |
| Home "Why", "Rio Story", "About" | cream / cream-soft | institutional/editorial sections |
| Current public tour page (`/tours/[id]`, RT-54) | cream | the light treatment the prototype inherited |

Production references: `docs/baseline/rt-114-prototype/round-1/reference-home-experiences-*.png`, `reference-tour-page-production-*.png`.

## 3. Decision for the tour page (RT-114)
Use the surface the Home already uses for the **same content** (tours): charcoal page, raised cards with a 10% white border, matte gold eyebrows and icons, on-dark text, **solid-gold primary CTA** "Solicitar disponibilidade" and gold-outline secondary. Cream is no longer dominant (it stays for institutional sections of the Home). Typography, radius and spacing are unchanged.

Contrast on charcoal (WCAG): gold 8.54:1 · gold-bright 11.90:1 · on-dark 17.03:1 · on-dark-muted 11.46:1 · on-dark-subtle 7.57:1 · CTA text (charcoal on gold) 8.54:1 — all pass AA (AAA for most). This also removes the small-label problem found on cream (`--site-gold-deep` on cream 4.38:1, below 4.5:1), so the extra token tried earlier in round 1 (`--site-gold-text`) was **reverted**: no new token is needed.

## 4. Gaps in the Design System (documented, not filled)
1. **Button states are not tokens.** Primary/secondary CTA colors and states exist only in RT-10/RT-14 docs; components hard-code them. Proposal (needs Owner approval): `--site-cta-bg`, `--site-cta-bg-hover`, `--site-cta-bg-pressed`, `--site-cta-fg`.
2. **No shared Button component for the public site**; each section writes its own classes. Proposal: a `SiteButton` (primary / secondary) used by header, Experiences cards and the tour page.
3. **No token for the raised-card border on dark** (`border-white/10` is repeated in code).
4. **No semantic status colors** (the review chips CONFIRMED / PROVISIONAL / PENDING / MOCK use literal colors and exist only in the rebuild lab; the public page never shows them).
5. **`--site-gold-deep` on cream fails AA for small text** (4.38:1) — an identity decision already tracked in RT-46; not changed here.

## 5. Consistency checklist (round 1)
Typography ✔ (Cormorant display + Inter body, RT-11) · Colors ✔ (only existing tokens/values) · Buttons ✔ (RT-10 primary/secondary) · Borders/radius ✔ (cards `rounded-xl` like Experiences; CTA 6px) · Spacing ✔ (page gutters and max-width 1280px unchanged) · Header/footer ✔ (unchanged).
