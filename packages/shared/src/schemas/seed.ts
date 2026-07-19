/**
 * Zod schemas for the six curated seed JSON files (BLUEPRINT §6).
 *
 * These are the CONTRACT for `seed/data/*.json`. WS-2's `seed/generate.ts` validator imports
 * them (`@fitforge/shared/schemas`) to validate the JSON before emitting `supabase/seed/seed.sql`.
 *
 * Equipment requirements are modelled as an array of ALT-GROUPS: each inner array is a set of
 * interchangeable equipment slugs (the `|` alternatives), and every group must be satisfiable
 * (the `+` required groups). An empty outer array means "no equipment / bodyweight".
 */
import { z } from 'zod';
import {
  EQUIPMENT_CATEGORIES,
  MUSCLE_REGIONS,
  MOVEMENT_PATTERNS,
  MECHANICS_TYPES,
  DIFFICULTY_LEVELS,
  FOOD_CATEGORIES,
} from '../types/enums.js';

/** A URL-safe lowercase slug, e.g. `barbell-back-squat`. */
export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase kebab-case slug');

/* ---------------------------------------------------------------- equipment.json (§6.1) */

export const equipmentSeedSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  category: z.enum(EQUIPMENT_CATEGORIES),
  description: z.string().nullish(),
  common_in_home: z.boolean(),
  common_in_gym: z.boolean(),
});
export const equipmentSeedFileSchema = z.array(equipmentSeedSchema).min(1);
export type EquipmentSeed = z.infer<typeof equipmentSeedSchema>;

/* ---------------------------------------------------------------- muscles.json (§6.2) */

export const muscleGroupSeedSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  region: z.enum(MUSCLE_REGIONS),
  display_order: z.number().int().min(0).optional(),
});
export const muscleSeedSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  latin_name: z.string().nullish(),
  /** references a muscle_group slug */
  group: slugSchema,
  is_front: z.boolean(),
});
export const musclesSeedFileSchema = z.object({
  groups: z.array(muscleGroupSeedSchema).min(1),
  muscles: z.array(muscleSeedSchema).min(1),
});
export type MuscleGroupSeed = z.infer<typeof muscleGroupSeedSchema>;
export type MuscleSeed = z.infer<typeof muscleSeedSchema>;

/* ---------------------------------------------------------------- categories.json (§6.3) */

export const categorySeedSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  display_order: z.number().int().min(0).optional(),
});
export const categoriesSeedFileSchema = z.array(categorySeedSchema).min(1);
export type CategorySeed = z.infer<typeof categorySeedSchema>;

/* ---------------------------------------------------------------- exercises.json (§6.4) */

/** One alt-group = interchangeable equipment slugs. */
export const altGroupSchema = z.array(slugSchema).min(1);

export const exerciseSeedSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  /** references an exercise_category slug */
  category: slugSchema,
  movement_pattern: z.enum(MOVEMENT_PATTERNS),
  mechanics: z.enum(MECHANICS_TYPES),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  is_unilateral: z.boolean().optional().default(false),
  is_bodyweight_ok: z.boolean().optional().default(false),
  /** primary muscle slugs (≥1) */
  primary_muscles: z.array(slugSchema).min(1),
  /** secondary muscle slugs (may be empty) */
  secondary_muscles: z.array(slugSchema).default([]),
  /** ordered alt-groups; empty array = bodyweight / no equipment */
  equipment: z.array(altGroupSchema).default([]),
  aliases: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  instructions: z.string().min(1),
  popularity: z.number().int().min(0).max(100),
  video_url: z.string().url().nullish(),
  image_path: z.string().min(1).nullish(),
});
export const exercisesSeedFileSchema = z.array(exerciseSeedSchema).min(1);
export type ExerciseSeed = z.infer<typeof exerciseSeedSchema>;

/* ---------------------------------------------------------------- substitutions.json (§6.5) */

export const substitutionSeedSchema = z
  .object({
    /** exercise slug being replaced */
    exercise: slugSchema,
    /** substitute exercise slug */
    substitute: slugSchema,
    similarity: z.number().int().min(0).max(100),
    reason: z.string().nullish(),
  })
  .refine((r) => r.exercise !== r.substitute, {
    message: 'exercise and substitute must differ',
  });
export const substitutionsSeedFileSchema = z.array(substitutionSeedSchema).min(1);
export type SubstitutionSeed = z.infer<typeof substitutionSeedSchema>;

/* ---------------------------------------------------------------- foods.json (§6.6) */

export const foodSeedSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  brand: z.string().nullish(),
  category: z.enum(FOOD_CATEGORIES),
  /** all macros per 100 g */
  kcal: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  fiber_g: z.number().min(0).default(0),
  sugar_g: z.number().min(0).default(0),
  sodium_mg: z.number().min(0).default(0),
  serving_name: z.string().min(1),
  serving_grams: z.number().positive(),
  diet_tags: z.array(z.string().min(1)).default([]),
  allergen_tags: z.array(z.string().min(1)).default([]),
  verified: z.boolean().default(true),
  source: z.string().min(1).default('fitforge-curated'),
});
export const foodsSeedFileSchema = z.array(foodSeedSchema).min(1);
export type FoodSeed = z.infer<typeof foodSeedSchema>;

/**
 * Macro-consistency check used by the seed validator (§6.7):
 * |kcal − (4·protein + 4·carbs + 9·fat)| ≤ 15% of kcal.
 * Returns true when the food's declared kcal is Atwater-consistent.
 */
export function isMacroConsistent(
  food: Pick<FoodSeed, 'kcal' | 'protein_g' | 'carbs_g' | 'fat_g'>,
  tolerance = 0.15,
): boolean {
  const computed = 4 * food.protein_g + 4 * food.carbs_g + 9 * food.fat_g;
  if (food.kcal === 0) return computed <= 15;
  return Math.abs(food.kcal - computed) <= tolerance * food.kcal;
}
