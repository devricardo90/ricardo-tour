# RT-10 — Design Tokens: Approved Contract and Code Mapping

## Status

- Canonical code: RT-RB-S1-01
- Jira: RT-10, classification HYBRID, Sprint 1 — Design Foundation
- Acceptance Criteria (Jira): "Tokens documentados e mapeáveis para código."
- **State: Owner-approved with adjustments, 2026-09-16.** Approved by Ricardo Souza Francisco in the RT-10 review round preserved at `docs/baseline/rt-10-approved/approved-parameters.md`.
- This is documentation and mapping only. **No change was made to `app/globals.css`, any Tailwind config, or any production component.** Applying these tokens to the real codebase is a separate, not-yet-authorized implementation step (see "Non-goals" below).

## What Ricardo approved

1. Paleta A refinada: charcoal `#0B0E11`, dourado fosco `#C8A86B`, luz dourada `#E8C780`, núcleo de luz `#FFF1CC`, off-white `#F3EFE6`.
2. Alternância entre seções escuras e off-white conforme o Wireframe Cinemático 2.0.
3. Direção dos tokens de superfícies, textos, controles e cores semânticas abaixo.
4. Escala de spacing, gutters `20/32/48px`, grid `4/8/12` colunas, largura máxima `1280px`.
5. Direção de raios (`radius`) e sombras (`elevation`) abaixo.
6. Logo oficial preservado com suas cores originais (`#E4BE2D`, `#0D78BD`, `#075B64`, `#68A34F`) — não tokenizado; permanece como asset fixo.
7. Azul, teal e verde preservados no logo e nas fotografias; qualquer novo uso decorativo desses tons na interface exige justificativa separada. Cores semânticas (sucesso/aviso/erro) continuam com sua própria paleta, independente dessa restrição.

Tipografia (display + interface) **não** está incluída nesta aprovação — permanece na RT-11.

## Token contract — approved values

### Interface color

| Role | Dark | Light |
| --- | --- | --- |
| Background | `#0B0E11` | `#F3EFE6` |
| Surface | `#15191D` | `#FCF9F2` |
| Raised | `#1C2227` | `#FFFDF8` |
| Muted surface | `#232A30` | `#E9E2D6` |
| Primary text | `#F4F0E8` | `#171A1E` |
| Secondary text | `#CAC7BF` | `#53565A` |
| Muted text | `#9DA3A5` | `#6B6B68` |
| Border | `#3A4147` | `#CFC7BA` |
| Brand gold | `#C8A86B` | `#C8A86B` |
| Focus / bright gold | `#E8C780` | `#8A6A2B` |

### Action states

| State | Dark | Light |
| --- | --- | --- |
| CTA default | `#C8A86B` on `#0B0E11` | `#C8A86B` on `#171A1E` |
| CTA hover | `#E8C780`, lift `-1px`, shadow low | `#B99559`, lift `-1px`, shadow low |
| CTA pressed | `#A9864E`, no lift | `#A98448`, no lift |
| Focus ring | `3px #E8C780`, offset `3px` | `3px #8A6A2B`, offset `3px` |
| Disabled | `#252B30` / `#767D82` / border `#343B42` | `#E3DFD6` / `#686863` / border `#CBC5BB` |

### Semantic colors

| Role | Dark: text / bg | Light: text / bg |
| --- | --- | --- |
| Success | `#8FCB9B` / `#1A3324` | `#276A42` / `#E6F3EA` |
| Warning | `#E5B96A` / `#352915` | `#815E1E` / `#FFF2CF` |
| Error | `#F28C8C` / `#3A1E22` | `#A52F36` / `#FBE7E8` |

### Spacing and grid

- Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 112px`.
- Gutters: mobile `20px`, tablet `32px`, desktop `48px`.
- Max content width: `1280px`.
- Grid: 4 columns / gap `16px` (mobile); 8 columns / gap `20px` (tablet); 12 columns / gap `24px` (desktop).

### Radius and elevation

- Radius: `6, 12, 16, 24, 28px`, plus pill only when semantically necessary.
- Shadow low: `0 8px 24px rgba(0,0,0,.14)`.
- Shadow medium: `0 16px 44px rgba(0,0,0,.24)`.
- Shadow high: `0 28px 70px rgba(0,0,0,.34)`.
- Light surface shadow: `0 18px 45px rgba(23,26,30,.08)`.
- Cinematic media shadow: `0 24px 70px rgba(0,0,0,.42)`.

### Media-only lighting effects (recalibrated 2026-09-16, not general component tokens)

Owner feedback this round softened all four values below to avoid a "neon" reading. They apply to hero/journey media treatments only — never to buttons, cards, or general UI chrome.

| Effect | Previous | Approved (recalibrated) |
| --- | --- | --- |
| Rio point halo | `0 0 18px rgba(232,199,128,.28)` | `0 0 10px rgba(232,199,128,.18)` |
| Planet rim glow | `0 0 24px rgba(232,199,128,.20)` | `0 0 15px rgba(232,199,128,.13)` |
| Planet inner gold inset | `rgba(232,199,128,.10)` | `rgba(232,199,128,.08)` |
| Light-ray spread (desktop) | `390px` line length | `190px` line length |
| Light-ray spread (mobile) | `210px` | `110px` |
| Rio core (unchanged — keep intensity to preserve title/Cristo legibility) | `#FFF1CC` | `#FFF1CC` (unchanged) |

The isolated working preview applied these values to the planet and Rio-point treatments. Its HTML/CSS working files were intentionally not versioned during consolidation. **The values are not applied to final hero media or to the production application**; see `docs/baseline/rt-10-approved/approved-parameters.md`, section "Limites e pendências preservados".

## Mapping to code — candidate, not applied

This repo's actual theme lives in `app/globals.css` as Tailwind v4 `@theme inline` CSS custom properties (`--background`, `--primary`, etc., redefined under `.dark`). The table below is the candidate mapping for when a future, explicitly authorized task (Sprint 1 component work at the earliest, gated by RT-15) applies this palette. **No file below has been edited by RT-10.**

| RT-10 token | Candidate CSS custom property | Candidate Tailwind utility |
| --- | --- | --- |
| Background (dark) | `--background: #0B0E11` | `bg-background` |
| Background (light) | `--background: #F3EFE6` (outside `.dark`) | `bg-background` |
| Surface | `--card: #15191D` / `#FCF9F2` | `bg-card` |
| Raised | new token `--surface-raised` | `bg-surface-raised` (new) |
| Muted surface | `--muted: #232A30` / `#E9E2D6` | `bg-muted` |
| Primary text | `--foreground: #F4F0E8` / `#171A1E` | `text-foreground` |
| Secondary text | `--muted-foreground: #CAC7BF` / `#53565A` | `text-muted-foreground` |
| Border | `--border: #3A4147` / `#CFC7BA` | `border-border` |
| Brand gold | new token `--brand-gold: #C8A86B` | `text-brand-gold` / `bg-brand-gold` (new) |
| Focus / bright gold | `--ring: #E8C780` / `#8A6A2B` | `ring-ring` |
| Success / Warning / Error | new semantic tokens, distinct from existing `--destructive` | `text-success`, `text-warning`, `text-destructive` |
| Radius scale | `--radius` currently a single `1rem`; RT-10 proposes a scale (`--radius-sm/md/lg/xl`) | `rounded-sm/md/lg/xl` |
| Shadow low/med/high | new tokens alongside existing `--shadow-soft`, `--shadow-soft-lg`, `--shadow-dark` | `shadow-[var(--shadow-*)]` |

Open point carried forward, not decided here: whether the current `--primary` (`#123a28`, the existing green) is retired in favor of `--brand-gold` as the interactive/brand color, or kept as a secondary accent. RT-10's approval covers the token *values*; it does not decide this replacement question, which belongs to the Sprint 1 component-spec task (RT-14) and the RT-15 Owner Visual Gate.

## Non-goals of this token registration

- Does not edit `app/globals.css`, any Tailwind config, or any component.
- Does not change the production Home.
- Does not decide the `--primary` retirement question above.
- Does not constitute the RT-15 Owner Visual Gate or Sprint 1 closure.
- Does not include typography (RT-11).

## Evidence

- Approved values, rationale, integrity record and scope limits: `docs/baseline/rt-10-approved/approved-parameters.md`.
- Approved rendered proof: `docs/baseline/rt-10-approved/desktop-approved.png`, `docs/baseline/rt-10-approved/mobile-approved.png` and `docs/baseline/rt-10-approved/owner-review.png`.
- Jira: comment added to RT-10 recording this approval (see execution log).
