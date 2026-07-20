/**
 * §7.4 — Exercise substitution engine (pure-TS mirror of `suggest_substitutes`).
 *
 * Scores an in-memory catalog against a target exercise given the caller's equipment,
 * exclusions, favorites and experience. Verified against src/fixtures/substitutions.json,
 * which the WS-6 pgTAP suite also asserts (both derive from BLUEPRINT §7.4).
 */
import type { MovementPattern, MechanicsType, DifficultyLevel, TrainingLocation } from '../types/database.js';

/** Exercise as needed by the substitution scorer. `equipment` = ordered alt-groups. */
export interface CatalogExercise {
  id: string;
  slug: string;
  name: string;
  movement_pattern: MovementPattern;
  mechanics: MechanicsType;
  difficulty: DifficultyLevel;
  popularity: number;
  is_bodyweight_ok: boolean;
  /** each inner array is a set of interchangeable equipment slugs; empty outer = no equipment */
  equipment: readonly (readonly string[])[];
  primary_muscles: readonly string[];
  secondary_muscles: readonly string[];
  is_active?: boolean;
  /** §6 P0-4 teaching content (optional; present on the enriched seed, absent on the rule fixture). */
  form_cues?: readonly string[];
  why?: string;
  common_mistakes?: readonly string[];
}

/** Directed curated substitution edge T → substitute (§6.5). */
export interface SubstitutionEdge {
  exercise: string; // source slug (T)
  substitute: string; // candidate slug
  similarity: number; // 0–100
  reason?: string | null;
}

export interface SubstitutionContext {
  /** equipment slugs owned by the user */
  ownedEquipment: ReadonlySet<string>;
  trainingLocation: TrainingLocation | null;
  experience: DifficultyLevel;
  /** exercise slugs the user excluded (preference='excluded') */
  excludedExercises: ReadonlySet<string>;
  /** movement patterns excluded (user_movement_exclusions) */
  excludedPatterns: ReadonlySet<MovementPattern>;
  /** favorite exercise slugs */
  favorites: ReadonlySet<string>;
  /** pinned preferred substitute slug for the target, if any */
  preferredSubstitute?: string | null;
}

export interface SubstituteResult {
  slug: string;
  name: string;
  score: number;
  reason: string;
}

const DIFFICULTY_INDEX: Record<DifficultyLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

/**
 * §7.4 step 1 feasibility predicate.
 * feasible ⇔ is_bodyweight_ok OR (for EVERY alt_group: some equipment in it is owned).
 * Special case: zero owned equipment + (commercial_gym | null location) ⇒ treat all as owned.
 */
export function isFeasible(exercise: CatalogExercise, ctx: SubstitutionContext): boolean {
  if (
    ctx.ownedEquipment.size === 0 &&
    (ctx.trainingLocation === 'commercial_gym' || ctx.trainingLocation == null)
  ) {
    return true;
  }
  if (exercise.is_bodyweight_ok) return true;
  if (exercise.equipment.length === 0) return true; // no equipment needed
  return exercise.equipment.every((group) => group.some((slug) => ctx.ownedEquipment.has(slug)));
}

function overlapCount(a: readonly string[], b: readonly string[]): number {
  const set = new Set(b);
  let n = 0;
  for (const x of a) if (set.has(x)) n++;
  return n;
}

function generatedReason(target: CatalogExercise, candidate: CatalogExercise): string {
  const muscles = target.primary_muscles.join(', ');
  let reason = `Targets ${muscles}`;
  if (candidate.movement_pattern === target.movement_pattern) reason += ', same movement pattern';
  reason += candidate.is_bodyweight_ok ? ', no equipment needed' : '';
  return reason;
}

/**
 * §7.4 — score & rank substitute candidates for `targetSlug`.
 *
 * @param targetSlug  slug of the exercise being replaced (T)
 * @param catalog     all catalog exercises (T included; it is skipped as a candidate)
 * @param edges       curated substitution edges (directed)
 * @param ctx         caller equipment / exclusions / favorites / experience
 * @param limit       max results (default 5)
 */
export function suggestSubstitutes(
  targetSlug: string,
  catalog: readonly CatalogExercise[],
  edges: readonly SubstitutionEdge[],
  ctx: SubstitutionContext,
  limit = 5,
): SubstituteResult[] {
  const bySlug = new Map(catalog.map((e) => [e.slug, e]));
  const target = bySlug.get(targetSlug);
  if (!target) return [];

  // curated edges T → c
  const curated = new Map<string, SubstitutionEdge>();
  for (const e of edges) {
    if (e.exercise === targetSlug) curated.set(e.substitute, e);
  }

  // Step 1 — candidate pool: active, ≠ T, feasible
  let pool = catalog.filter(
    (c) => c.slug !== targetSlug && c.is_active !== false && isFeasible(c, ctx),
  );

  // Step 2 — drop user-excluded exercises / excluded patterns
  pool = pool.filter(
    (c) => !ctx.excludedExercises.has(c.slug) && !ctx.excludedPatterns.has(c.movement_pattern),
  );

  // Step 3 — pinned preferred substitute wins if it survived steps 1–2
  if (ctx.preferredSubstitute && pool.some((c) => c.slug === ctx.preferredSubstitute)) {
    const pinned = bySlug.get(ctx.preferredSubstitute)!;
    return [{ slug: pinned.slug, name: pinned.name, score: 1000, reason: 'You chose this substitute' }];
  }

  const expIdx = DIFFICULTY_INDEX[ctx.experience];
  const pmT = target.primary_muscles;
  const smT = target.secondary_muscles;

  const scored = pool.map((c) => {
    let s = 0;
    const edge = curated.get(c.slug);
    if (edge) s += edge.similarity; // curated: += similarity (0–100)
    s += (30 * overlapCount(pmT, c.primary_muscles)) / Math.max(1, pmT.length);
    s +=
      (10 * overlapCount(smT, [...c.primary_muscles, ...c.secondary_muscles])) /
      Math.max(1, smT.length);
    if (c.movement_pattern === target.movement_pattern) s += 25;
    if (c.mechanics === target.mechanics) s += 10;
    const cIdx = DIFFICULTY_INDEX[c.difficulty];
    if (cIdx > expIdx) s -= 15 * (cIdx - expIdx);
    if (ctx.favorites.has(c.slug)) s += 10;
    s += c.popularity * 0.05;

    const reason = edge?.reason ?? generatedReason(target, c);
    return { candidate: c, score: s, reason };
  });

  // Step 5 — drop s < 20, order by score desc, popularity desc, name asc; limit
  return scored
    .filter((r) => r.score >= 20)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.candidate.popularity - a.candidate.popularity ||
        a.candidate.name.localeCompare(b.candidate.name),
    )
    .slice(0, limit)
    .map((r) => ({
      slug: r.candidate.slug,
      name: r.candidate.name,
      score: Number(r.score.toFixed(4)),
      reason: r.reason,
    }));
}
