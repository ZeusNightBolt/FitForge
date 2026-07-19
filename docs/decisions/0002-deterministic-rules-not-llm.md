# ADR 0002 — Deterministic rules, not an LLM (for the MVP)

**Status:** Accepted

## Context

The onboarding experience relies on "smart" behavior: autofill, prediction, exercise substitution, macro targets, and starter-routine generation. An LLM could power these, but at the cost of API keys, per-request spend, latency, non-determinism, and offline unfriendliness.

## Decision

Implement all MVP intelligence as **deterministic, rule-based logic**:
- Type-ahead ranking via `pg_trgm` + a scoring function.
- Smart defaults via goal × experience matrices.
- Macro targets via Mifflin–St Jeor.
- Exercise substitution via a curated similarity graph + equipment-aware scoring.
- Starter routines via split templates.

The logic is authored once in Postgres RPCs (`0005_functions.sql`) and mirrored in `packages/shared/src/rules/` for instant client-side previews. Shared fixtures assert parity between the two.

Architect a clean seam so an **AI assist layer can be added later** without reworking the data model.

## Consequences

- ➕ Fast, free, explainable, offline-friendly, and testable (fixtures pin expected outputs).
- ➕ No secrets or vendor dependency in the hot path.
- ➖ Rules must be authored twice (SQL + TS); parity is enforced by fixtures but is real maintenance.
- ➖ Less "magic" than an LLM — acceptable for the MVP; the seam preserves the option.
