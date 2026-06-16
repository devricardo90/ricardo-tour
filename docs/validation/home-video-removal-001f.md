# RT-UX-001F - Home Video Removal Validation

Date: 2026-06-16
State: REVIEW
Type: focused UX/performance implementation

## Scope

Removed the public Home hero video and replaced it with a lightweight static visual using an existing image asset.

## Restrictions Preserved

- No multilingual SEO changes.
- No route or locale changes.
- No typography overhaul.
- No full Home redesign.
- No package or lockfile changes.
- No dependency install.
- No deploy.
- `.agents/` and `skills-lock.json` were not touched.
- No commit was made.

## Git Status Before Work

Command:

```powershell
git status --short --untracked-files=all
git rev-parse --short HEAD
git rev-parse --short origin/main
git status -sb
```

Result:

```text
HEAD: b4bc556
origin/main: b4bc556
branch: main...origin/main
untracked before work:
?? .agents/
?? skills-lock.json
```

Notes:
- Starting HEAD was exactly `b4bc556`.
- `main` and `origin/main` were synchronized.
- Existing untracked `.agents/` and `skills-lock.json` were left untouched.

## Files Changed

```text
components/hero-section.tsx
docs/validation/home-video-removal-001f.md
docs/ops/backlog.md
docs/ops/status.md
docs/ops/session-handoff.md
docs/ops/execution-log.md
```

## Implementation Summary

`components/hero-section.tsx`:
- Removed the Home hero `<video>` element.
- Removed the direct `src="/videos/newhero.mp4"` and `poster="/videos/imagem-rio-perfil.jpg"` usage from the hero video.
- Added `next/image`.
- Reused existing lightweight static image asset:
  - `public/videos/imagem-rio-perfil.jpg`
- Preserved hero layout, copy, CTAs, support badges, locale-aware links, and premium tourism positioning.
- Preserved the existing overlay treatment and added one lightweight static gradient layer to keep text contrast and visual depth.

Asset decision:
- Video files were not deleted in this task.
- The static image exists and was validated:
  - `public/videos/imagem-rio-perfil.jpg`
  - size: `589790` bytes

## Route Validation

Local server:
- Initial sandboxed dev-server start failed with `spawn EPERM`.
- Dev server was started with approval for local validation.
- URL: `http://127.0.0.1:3217`.

| Route | Expected | Actual |
|---|---:|---:|
| `/pt` | 200 | 200 |
| `/en` | 200 | 200 |
| `/es` | 200 | 200 |
| `/sv` | 200 | 200 |

Content types:

```text
/pt 200 text/html; charset=utf-8
/en 200 text/html; charset=utf-8
/es 200 text/html; charset=utf-8
/sv 200 text/html; charset=utf-8
```

## Video and Asset Checks

Search result:
- No `<video>` usage remains in `components/hero-section.tsx`.
- No `newhero.mp4`, `poster=`, `preload=`, or `autoPlay` reference remains in `components/hero-section.tsx`.

Static asset check:

```text
public/videos/imagem-rio-perfil.jpg exists: true
```

## Desktop and Mobile Visual Smoke

Playwright smoke against `http://127.0.0.1:3217/pt`:

| Viewport | Video count | Hero image count | Image loaded | Horizontal overflow | H1 visible | Primary CTA visible | Screenshot bytes |
|---|---:|---:|---|---|---|---|---:|
| Desktop 1440x900 | 0 | 1 | true | false | true | true | 97597 |
| Mobile 390x844 | 0 | 1 | true | false | true | true | 70239 |

Interpretation:
- Home loads without video.
- The static hero image loads.
- Desktop and mobile first viewport render without horizontal overflow.
- Primary content and CTA remain visible.

## Automated Validation

Commands:

```powershell
npm.cmd run lint
npm.cmd run typecheck
git diff --check
```

Results:
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- `git diff --check`: PASS with known LF/CRLF warnings only.

## Scope Confirmation

No diff in:
- `package.json`
- `package-lock.json`
- route files
- locale config
- SEO metadata files

No Home copy, CTA behavior, route, SEO metadata, locale behavior, package, lockfile, deployment, `.agents/`, or `skills-lock.json` changes were made.

## Recommendation

RT-UX-001F is ready for review.

Recommendation:
- Commit after reviewing the focused `components/hero-section.tsx` diff and validation evidence.
