# ADR 0003 — Flattened prescriptions instead of wger's config tables

**Status:** Accepted

## Context

wger models workout prescriptions with a highly normalized structure: a routine has days, days have slots, slots have slot entries, and each tunable parameter (sets, reps, weight, rest, RiR, etc.) lives in its own per-parameter configuration table with support for progression rules. This is powerful and flexible, but heavy — many joins to render a single day, and significant complexity for an MVP that mostly needs "do these exercises, these sets × reps."

## Decision

Adopt a **flattened prescription model**:
- `routines` → `routine_days` → `routine_exercises`, where `routine_exercises` carries the prescription fields (target sets, rep range, rest, order) directly.
- Keep the **primary/secondary muscle M2M** and the **prescription-vs-log separation** that wger does well.
- Do **not** adopt the per-parameter config-table-per-parameter design or progression-rule tables for the MVP.

## Consequences

- ➕ Rendering a day is a simple, shallow query — good for mobile.
- ➕ Much less schema surface to build, seed, and secure.
- ➖ Advanced progression schemes (auto-regulation, per-parameter progression) aren't first-class yet; they can be reintroduced as dedicated tables later without breaking logs (which are snapshot-based — see ADR 0004).
