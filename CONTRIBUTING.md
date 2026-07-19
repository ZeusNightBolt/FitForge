# Contributing to FitForge

Thanks for your interest in FitForge! This is an early-stage MVP, so the codebase moves fast. This guide covers how to get set up and the conventions we follow.

## Ground rules

- **The blueprint is the contract.** [`docs/BLUEPRINT.md`](./docs/BLUEPRINT.md) is the single source of truth for the data model, slugs, enum values, RPC names, and the onboarding rules. Frozen names should not drift — if something needs to change, update the blueprint (and note it) rather than diverging silently.
- **Keep the monorepo boundaries clean.** Each area owns a disjoint slice of the tree (see the [monorepo map](./README.md#-monorepo-map)). Cross-area contracts flow through `@fitforge/shared` and the database contract only.
- **Deterministic first.** The onboarding intelligence (search ranking, defaults, macros, substitution, routine generation) is rule-based and lives in Postgres RPCs, mirrored in `packages/shared`. Keep the two in sync — the shared fixtures assert parity.

## Getting set up

See the [Quick start](./README.md#-quick-start) in the README. In short:

```bash
npm install
npm run build -w @fitforge/shared
npm run db:start && npm run db:reset
npm run dev
```

## Project layout

| Area | Path | Notes |
|---|---|---|
| Web app | `apps/web` | Next.js 15 App Router. Onboarding + app shell. |
| iOS app | `apps/ios` | SwiftUI + XcodeGen. Build on macOS. |
| Shared TS | `packages/shared` | Types, zod schemas, rule mirrors, typed RPCs. **Build before web.** |
| Seed content | `seed` | Curated JSON + generator. Run `npm run seed:generate` after edits. |
| Database | `supabase` | Migrations, RPCs, RLS, pgTAP tests. |

## Conventions

- **TypeScript:** strict mode. Prefer types from `@fitforge/shared`.
- **Database:** every user table is RLS-protected owner-only; catalog tables are world-readable. New tables need matching RLS policies and pgTAP coverage.
- **Seed data:** edit the JSON in `seed/data/`, then regenerate `supabase/seed/seed.sql` with `npm run seed:generate`. `npm run seed:check` must pass (referential integrity + macro sanity).
- **Rules:** any change to a rule in `supabase/migrations/0005_functions.sql` must be mirrored in `packages/shared/src/rules/` with updated fixtures.

## Before you open a PR

Run the relevant checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run seed:check   # if you touched seed data
npm run db:test      # if you touched schema or RPCs
```

CI runs `shared`, `web`, `seed`, `db`, and `ios` jobs — mirror those locally where you can.

## License

By contributing, you agree that your contributions are licensed under the repository's [CC BY-SA 4.0](./LICENSE) license.
