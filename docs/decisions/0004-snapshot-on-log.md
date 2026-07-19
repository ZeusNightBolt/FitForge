# ADR 0004 — Snapshot on log

**Status:** Accepted

## Context

Users log workout sets and food entries against catalog items (exercises, foods) and against their prescriptions. Those catalog items and prescriptions change over time — an exercise is renamed, a food's macros are corrected, a routine is edited. If logs only referenced the current catalog/prescription by ID, historical data would silently shift meaning.

## Decision

**Snapshot the relevant values at log time.** When a set or meal item is logged:
- Store the concrete values used (e.g. weight, reps, and the food's macros for the portion logged) on the log row itself.
- Keep the foreign key to the catalog item for grouping/analytics, but never depend on the current catalog values to reconstruct history.

## Consequences

- ➕ History is immutable and truthful — past workouts and nutrition days read exactly as they happened.
- ➕ Catalog and prescription edits are safe; they don't rewrite the past.
- ➕ Personal-record and macro aggregations over history are stable.
- ➖ Slightly more storage per log row (denormalized values).
- ➖ "What did this food's macros used to be" requires reading the log, not the catalog — intended.
