# FitForge — Build Manifest

Integrator's light-assembly record for the parallel build against `docs/BLUEPRINT.md`.
Generated 2026-07-19. **203 source files** (excluding `.git`), no `node_modules`/`dist`/`.next` present (dependencies not installed).

## Repository tree (top 3 levels)

```
fitforge/
├── .env.example
├── .github/workflows/ci.yml
├── .gitignore
├── package.json                 # npm workspaces: apps/web, packages/*, seed
├── turbo.json
├── apps/
│   ├── ios/                      # SwiftUI app (XcodeGen; not an npm workspace)
│   │   └── FitForge/{App,Core,Features,Resources,Tests}
│   └── web/                      # Next.js 15 App Router
│       ├── app/{(marketing),(auth),(app),onboarding,auth}
│       ├── components/{ui,onboarding,auth,features}
│       ├── lib/{supabase,onboarding}
│       └── tests/
├── docs/
│   ├── BLUEPRINT.md
│   └── BUILD-MANIFEST.md         # this file
├── packages/
│   └── shared/                   # @fitforge/shared
│       └── src/{types,schemas,rules,api,fixtures}
├── seed/                         # @fitforge/seed (content pipeline)
│   ├── data/  lib/  test/
└── supabase/
    ├── config.toml
    ├── migrations/               # 0001–0005
    ├── functions/delete-account/
    ├── seed/seed.sql
    └── tests/{schema,rpc}
```

## Per-workstream status

| WS | Area | Status | Files | Notes |
|----|------|--------|-------|-------|
| WS-1 | Database Core | ✅ present | 9 | `config.toml`, migrations 0001–0004, 4 pgTAP schema tests. All claimed files exist. |
| WS-2 | Seed Content | ✅ present | 13 | 6 data JSONs + TS pipeline + tests (12 under `seed/`) and generated `supabase/seed/seed.sql` (~101 KB). WS-1's seed-file worry is resolved — the file exists. |
| WS-3 | Shared TS (`@fitforge/shared`) | ✅ present | 31 | types/schemas/rules/api/fixtures + vitest suites. `database.ts` is hand-written (flagged below). |
| WS-4 | Web Foundation & Onboarding | ✅ present | 55 | Next.js scaffold, `components/ui/*` (9 primitives, 18 barrel exports), auth, full 13-step onboarding. Part of `apps/web` (79 total). |
| WS-5 | Web App Features | ✅ present | 24 | Authed shell + all §2.3 pages under `app/(app)/**` and `components/features/**`. Uses `_stubs` + `_mock` (flagged below). |
| WS-6 | Database Intelligence | ✅ present | 7 | `0005_functions.sql` (3 views + 10 RPCs), `delete-account` Edge Function, 5 pgTAP RPC tests. |
| WS-7 | Root tooling / CI | ✅ present (no handoff) | 5 | `package.json`, `turbo.json`, `ci.yml`, `.env.example`, `.gitignore`. No structured handoff was supplied, but all expected outputs exist. |
| WS-8 | iOS App (SwiftUI) | ✅ present | 58 | `project.yml`, 46+ Swift files, JSON fixtures, XCTest suites, `apps/ios/README.md`. |

`supabase/` = 17 files (WS-1 9 + WS-2 1 + WS-6 7). `apps/web/` = 79 files (WS-4 55 + WS-5 24). All workstreams fully present; nothing claimed is missing.

## Integration follow-ups

1. **Primitive swap (WS-5 → WS-4).** 11 files under `apps/web/components/features/**` import UI from `@/components/features/_stubs`. Replace that import path with `@/components/ui` (prop contracts are byte-identical per both handoffs) and delete the `_stubs` folder.
2. **Data-plane swap (WS-5 stubs).** Replace `@/components/features/_mock/data` accessors with live Supabase reads / `@fitforge/shared` `rpc.ts` wrappers. Also wire the deferred live paths WS-5 flagged: create a `workout_sessions` row on entry to `/workout/[sessionId]` (currently receives a routine_day id), `progress-photos` upload, settings "Re-generate my plan" → `generate_starter_routine` + `set_user_equipment`, and delete-account → the Edge Function.
3. **Regenerate DB types.** `packages/shared/src/types/database.ts` is hand-written (carries the "regenerate with supabase gen types" header). After the stack is up, replace it via `supabase gen types typescript` (WS-7/integration).
4. **Persona metric reconciliation.** WS-3 (`fixtures/personas.json`), WS-6 (`02_nutrition_targets.sql`), and the blueprint each pin unspecified body metrics independently; the persona *macro* numbers differ slightly between handoffs (e.g. P1 1650 vs 1700 kcal). Align inputs to one source before asserting cross-suite parity. Blueprint §6.4 exercise count is also unreconciled (header "48" / footer "58" / 59 rows transcribed).
5. **Build order.** `@fitforge/shared` exports resolve to `./dist/*`, so it MUST be built before `apps/web` typecheck/`next build`. Run root `npm install`, then build shared first.
6. **Seed + DB test harness.** `config.toml` `[db.seed]` points at `supabase/seed/seed.sql` (present). pgTAP suites (WS-1 schema, WS-6 rpc) require the `pgtap` extension + `supabase_test_helpers` `tests.*` functions — confirm these are installed in the CI `db` job. On a hosted `supabase db push`, the storage bucket/policy statements in `0004` may need dashboard/config provisioning (superuser-only).
7. **Run the live stack.** `supabase start` → `supabase db reset` (applies 0001–0005 + seeds) → `npm run dev`. Verify RPCs the apps call directly are all present from WS-6.
8. **iOS build (needs a Mac).** `cd apps/ios && xcodegen generate && xcodebuild -scheme FitForge -destination 'platform=iOS Simulator,name=iPhone 15' build test`. Not runnable in this environment.
9. **Missing root README.** There is no top-level `README.md` — only `apps/ios/README.md`. A root "how to run" README should be added (see the run steps in items 5–8 above).

## How to run

A consolidated quick-start lives in `apps/ios/README.md` (iOS) — **note there is no root `README.md` yet** (follow-up #9). Until one is added, use follow-ups #5–#8 above as the run guide: install deps → build `@fitforge/shared` → `supabase start && supabase db reset` → `npm run dev` for web; `xcodegen` + `xcodebuild` on a Mac for iOS.
