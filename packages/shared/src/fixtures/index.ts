/**
 * Typed loaders for the shared rule-parity fixtures. Both the vitest suite here and WS-6's
 * pgTAP suite assert against the same numbers (all derive from BLUEPRINT §7).
 */
import type { CatalogExercise, SubstitutionEdge } from '../rules/substitution.js';
import type { SexType, GoalType, DietType, DifficultyLevel, TrainingLocation } from '../types/database.js';

import catalogJson from './catalog.json' with { type: 'json' };
import edgesJson from './substitution-edges.json' with { type: 'json' };
import personasJson from './personas.json' with { type: 'json' };
import substitutionCasesJson from './substitution-cases.json' with { type: 'json' };
import defaultsJson from './defaults.json' with { type: 'json' };

/** In-memory exercise catalog (BLUEPRINT §6.4) for the substitution/rule mirrors. */
export const catalogFixture = catalogJson as unknown as CatalogExercise[];

/** Curated directed substitution edges (BLUEPRINT §6.5). */
export const substitutionEdgesFixture = edgesJson as unknown as SubstitutionEdge[];

export interface PersonaFixture {
  key: string;
  label: string;
  input: {
    sex: SexType;
    weight_kg: number;
    height_cm: number;
    age: number;
    days_per_week: number;
    primary_goal: GoalType;
    diet_type: DietType;
  };
  expected: { kcal: number; protein_g: number; carbs_g: number; fat_g: number; method: string };
}
export const personaFixtures = (personasJson as { personas: PersonaFixture[] }).personas;

export interface SubstitutionCaseFixture {
  name: string;
  target: string;
  owned_equipment: string[];
  training_location: TrainingLocation;
  experience: DifficultyLevel;
  excluded_exercises: string[];
  excluded_patterns: string[];
  favorites: string[];
  expected_top: string;
}
export const substitutionCaseFixtures = (
  substitutionCasesJson as { cases: SubstitutionCaseFixture[] }
).cases;

export interface DefaultsCaseFixture {
  goal: GoalType;
  experience: DifficultyLevel;
  expected: {
    days_per_week: number;
    session_minutes: number;
    rep_min: number;
    rep_max: number;
    split_name: string;
  };
}
export const defaultsCaseFixtures = (defaultsJson as { cases: DefaultsCaseFixture[] }).cases;
