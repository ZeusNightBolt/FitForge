# FitForge "Forged Gold" Rebrand — Integration Manifest

Gold-on-ink (dark-first) rebrand, executed by seven parallel workstreams against
`docs/REBRAND-BLUEPRINT.md` and integrated into a clean, green state.

- **Integrated:** 2026-07-20
- **Result:** typecheck clean · both static-export builds exit 0 · **18/18 Playwright E2E passing**

---

## Per-workstream status

| WS | Scope | Status | Integration notes |
|----|-------|--------|-------------------|
| **WS-A** | Foundation: tokens, type, primitives | ✅ Integrated | `globals.css` token drop-in, next/font (Inter + Space Grotesk), metadata block, restyled Button/Card/Chip/Stepper, `withBase()` helper, 8 new icons. No changes needed. |
| **WS-B** | Brand assets & render pipeline | ✅ Integrated | LogoMark/LogoLockup, frozen illustrations barrel, favicon set + og.png + webmanifest, `assets:render` script. Barrel re-exports all four subfolders cleanly. |
| **WS-C** | Muscle map + exercise experience | ✅ Integrated | Data-driven front/back `MuscleMap` (frozen §4.1 contract), rebuilt exercise catalog + detail, 59 enriched seed exercises, shared types (`exercise-content`). Replaced WS-B `muscle-map` placeholder. |
| **WS-D** | Equipment illustrations + pickers | ✅ Integrated | 30 bespoke equipment SVGs + registry + `EquipmentIllustration`, rebuilt Equipment/Location onboarding steps. Replaced WS-B `equipment` placeholder. |
| **WS-E** | Local Mode, landing, onboarding shell & copy | ✅ Integrated | New gold landing, `(app)` onboarding gate (in AppShell), Local Mode copy kit, removed hardcoded "Gabe"/"Athlete", export/import/erase. Owned specs updated. |
| **WS-F** | Training surfaces (workout/progress/today) | ✅ Integrated | `workoutLog.ts` persistence, rest timer + plate calc + PR detection + share card in WorkoutPlayer, weekly-volume heatmap, streak card. Consumes frozen MuscleMap contract. |
| **WS-G** | Nutrition polish | ✅ Integrated | Remaining=Goal−Food hero, macro %-bars, Quick log / Copy yesterday, MacroRing additive props. |

All seven workstreams integrated with no contract violations. The frozen
illustrations barrel (`components/illustrations/index.ts`) and the frozen
`MuscleMap` / `EquipmentIllustration` prop contracts were honored; the WS-B
placeholder subfolder indexes were correctly replaced by WS-C/WS-D.

---

## Integration fixes applied by the integrator

1. **`tests/e2e/exercises.spec.ts`** — added `completeOnboarding(page)` to
   `beforeEach`. The new WS-E `(app)` gate redirects non-onboarded visits to
   `/onboarding/welcome`; the spec deep-linked into `/exercises` after only
   `resetDemo`. (Stale setup WS-C didn't update; flagged in WS-E handoff.)
2. **`tests/e2e/progress.spec.ts`** — same `completeOnboarding(page)` fix for
   `/progress` deep-link (WS-F spec).
3. **`components/features/workout/WorkoutPlayer.tsx`** — replaced the `⚡`
   emoji on the canvas "Save image" PR share card with an on-brand
   canvas-drawn 4-point gold spark (mirrors WS-A `SparkIcon`), removing the last
   rendered pictographic emoji.

No app regressions were found; no assertions were weakened.

---

## Emoji audit

No pictographic (U+1F block) color emoji remain in `apps/web/components` or
`apps/web/app`. Remaining non-alphanumeric glyphs are intentional monochrome
typographic UI (`✓` `✕` `←` `→` `↑` `↓` `⇄`) and design-annotation `★`
characters inside code comments (not rendered).

---

## Final asset list — `apps/web/public/` (staged, not gitignored)

| File | Size | Purpose |
|------|------|---------|
| `favicon.svg` | 964 B | Primary favicon (bar + anvil + spark on rounded ink square) |
| `favicon-32.png` | 932 B | 32px raster favicon |
| `apple-touch-icon.png` | 4.4 KB | 180px Apple touch icon (padded) |
| `icon-192.png` | 8.2 KB | PWA manifest icon 192 |
| `icon-512.png` | 33.5 KB | PWA manifest icon 512 |
| `og.png` | 142.7 KB | 1200×630 OpenGraph / Twitter summary_large_image card |
| `site.webmanifest` | 631 B | PWA manifest (relative `./`-scoped so base-path resolves) |

Rasters are re-rendered from `assets-src/og.html` + `favicon.svg` via
`cd apps/web && npm run assets:render` (uses preinstalled Chromium via
playwright-core; **not** part of the build chain).

Metadata in `app/layout.tsx` references all of these through `withBase()`, so
they resolve correctly under both `""` and `/FitForge` base paths (verified in
built HTML).

---

## Build + test commands

```bash
# 1. Build shared package (must precede web builds)
npm run build -w @fitforge/shared

# 2. Typecheck web (0 errors expected)
npm run typecheck -w @fitforge/web

# 3. Static export — root base path (local / E2E)
NEXT_PUBLIC_BASE_PATH="" NEXT_PUBLIC_DEMO=1 npm run build -w @fitforge/web

# 4. Static export — GitHub Pages base path
NEXT_PUBLIC_BASE_PATH="/FitForge" NEXT_PUBLIC_DEMO=1 npm run build -w @fitforge/web

# 5. Full E2E (Playwright serves the "" build's out/ dir)
cd apps/web && npx playwright test --reporter=line

# 6. (optional) re-render brand rasters after editing favicon.svg / og.html
cd apps/web && npm run assets:render
```

Note: the Playwright web server serves `apps/web/out/`, so E2E must run against
the `NEXT_PUBLIC_BASE_PATH=""` build. Building with `/FitForge` overwrites `out/`
— rebuild with `""` before running the suite.

---

## Known follow-ups (non-blocking)

- **Commit the rebrand.** The full working tree (59 modified files + new
  illustration/asset/lib files) is uncommitted on `main`. The `public/` binary
  assets are **staged** (`git add`) by the integrator so they track for the
  Pages build; the remaining rebrand files are not yet committed. A single
  rebrand commit + push + Pages redeploy is the pending release task.
- **Screenshot baselines.** `(app)` pages now prerender a blank client-hydrated
  placeholder (expected for the client-only static export); regenerate the ~8
  screenshot baselines during the visual polish pass.
- **LandingHero figure.** WS-B's hero uses a self-contained decorative "forged"
  silhouette, not WS-C's anatomical `MuscleMap`. Intentional; WS-C's map could
  optionally replace it in a later polish pass.
- **Seed JSON import path.** `ExerciseDetail` imports enriched content via a
  relative path into the repo-root `seed/` dir. Builds fine today; if a future
  Next/webpack version objects, set `externalDir: true` in `next.config` or
  relocate the file.
- **kg/lb + swap ranking (WS-F).** Plate-calculator unit toggle is local;
  quick-swap ranks by seed similarity rather than the user's exact owned
  equipment. Both work; tighten later if desired.
