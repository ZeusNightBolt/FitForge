# ADR 0001 — Supabase as the backend

**Status:** Accepted

## Context

FitForge needs one backend serving two clients (Next.js web + SwiftUI iOS): authentication, a relational data store, a REST API, file storage, and a place to run the deterministic intelligence logic. We want to reach a humming MVP quickly without operating bespoke infrastructure.

## Decision

Use **Supabase** as the single backend:
- **Postgres** for the relational model, with **Row Level Security** for per-user data isolation.
- **PostgREST** for auto-generated REST access to tables and views.
- **Auth** for Sign in with Apple, Google OAuth, and magic links.
- **Storage** for exercise media and progress photos.
- **Postgres functions (RPCs)** for the intelligence layer, plus **Edge Functions** where server logic is needed (account deletion).

Both clients talk to the same Supabase project. `@fitforge/shared` mirrors the DB types and RPC contracts.

## Consequences

- ➕ Minimal backend code; auth, storage, and REST come for free.
- ➕ RLS pushes authorization into the database — one enforcement point for both clients.
- ➕ Intelligence lives close to the data (RPCs), with TS mirrors for instant client previews.
- ➖ Business logic in SQL/PLpgSQL is less ergonomic than app code; mitigated by keeping mirrors + fixtures in `packages/shared`.
- ➖ Some operations (storage bucket policies) behave differently between local `db reset` (superuser) and hosted `db push`; documented in the build manifest.
