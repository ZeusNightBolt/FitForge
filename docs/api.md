# FitForge — API Surface

> Condensed from [`BLUEPRINT.md`](./BLUEPRINT.md) §5. Implemented in `supabase/migrations/0005_functions.sql`, `supabase/functions/`, and consumed via `packages/shared/src/api/rpc.ts`.

All access goes through Supabase. Tables are reached via **PostgREST** under Row Level Security; the intelligence layer is exposed as **RPCs** at `POST /rest/v1/rpc/{name}`.

## PostgREST resources (direct, under RLS)

- **Catalog (read, anon-allowed):** `exercises`, `exercise_categories`, `muscles`, `muscle_groups`, `equipment`, `exercise_muscles`, `exercise_equipment`, `exercise_substitutions`, `foods`.
- **User (read/write, owner-only):** `profiles`, `user_equipment`, `user_liked_exercises`, `user_excluded_exercises`, `user_substitutions`, `routines`, `routine_days`, `routine_exercises`, `workout_sessions`, `set_logs`, `meals`, `meal_items`, `body_metrics`.

## Views (read models, `security_invoker=true`)

| View | Purpose |
|---|---|
| `v_exercise_full` | Exercise joined with its muscles, equipment, and category for catalog browse/detail. |
| `v_daily_nutrition` | Aggregated macros for a user's day (calories, protein, carbs, fat by meal slot). |
| `v_exercise_prs` | Per-exercise personal records derived from `set_logs`. |

## RPCs (the intelligence layer)

| RPC | Grants | Purpose |
|---|---|---|
| `search_exercises(query, filters)` | anon + authenticated | Type-ahead exercise search — `pg_trgm` fuzzy match + popularity/prefix ranking (§7.1). |
| `search_foods(query)` | anon + authenticated | Type-ahead food search for logging. |
| `suggest_substitutes(exercise, equipment, ...)` | authenticated | Best equivalent exercises for the same pattern/muscle given available equipment (§7.4). |
| `suggest_nutrition_targets(metrics, goal, ...)` | authenticated | Mifflin–St Jeor BMR → TDEE → goal-adjusted calories + macro split (§7.2.4). |
| `generate_starter_routine(prefs)` | authenticated | Builds a starter routine from split templates by frequency + preferences (§7.5). |
| `log_food(...)` | authenticated | Logs a food to a meal (snapshot-on-log). |
| `previous_sets(exercise)` | authenticated | Ghost/default set values from the user's last session for an exercise. |
| `onboarding_status()` | authenticated | Current onboarding step for resume. |
| `set_user_equipment(...)` | authenticated | Replaces the user's equipment set (triggers plan regeneration in the app). |

Typed wrappers for each RPC live in `packages/shared/src/api/rpc.ts`, and the underlying rules are mirrored (for instant client previews) in `packages/shared/src/rules/`.

## Edge Functions

| Function | Purpose |
|---|---|
| `delete-account` | Full account teardown — deletes user data and the auth user. |

## Storage buckets

| Bucket | Visibility | Contents |
|---|---|---|
| `exercise-media` | public | Exercise images/animations. |
| `progress-photos` | private (owner-only) | User progress photos. |
