/**
 * Exercise content enrichment (BLUEPRINT §6 P0-4). The seed exercise records
 * (seed/data/exercises.json) gain author-once teaching content — form cues, a one-line
 * rationale, and common mistakes — surfaced on the rebuilt exercise-detail page.
 */
import type {
  MovementPattern,
  MechanicsType,
  DifficultyLevel,
} from './database.js';

/** The teaching fields added to every seed exercise. */
export interface ExerciseEnrichment {
  /** 3–5 short, imperative form cues. */
  form_cues: string[];
  /** One-line "why this exercise" rationale. */
  why: string;
  /** 2–3 common mistakes to avoid. */
  common_mistakes: string[];
}

/** Full shape of a record in seed/data/exercises.json (the authored source of truth). */
export interface SeedExercise extends ExerciseEnrichment {
  slug: string;
  name: string;
  category: string;
  movement_pattern: MovementPattern;
  mechanics: MechanicsType;
  difficulty: DifficultyLevel;
  is_unilateral: boolean;
  is_bodyweight_ok: boolean;
  popularity: number;
  primary_muscles: string[];
  secondary_muscles: string[];
  /** ordered alt-groups; each inner array is interchangeable equipment slugs. */
  equipment: string[][];
  instructions: string;
}
