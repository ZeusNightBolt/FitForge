import { describe, it, expect } from 'vitest';
import {
  equipmentSeedSchema,
  exerciseSeedSchema,
  foodSeedSchema,
  substitutionSeedSchema,
  musclesSeedFileSchema,
  isMacroConsistent,
} from './seed.js';
import {
  goalsStepSchema,
  scheduleStepSchema,
  nutritionPrefsStepSchema,
  bodyMetricsStepSchema,
} from './forms.js';

describe('§6 seed schemas', () => {
  it('accepts a valid equipment row', () => {
    expect(
      equipmentSeedSchema.safeParse({
        slug: 'barbell',
        name: 'Barbell',
        category: 'free_weights',
        common_in_home: true,
        common_in_gym: true,
      }).success,
    ).toBe(true);
  });

  it('rejects a bad slug', () => {
    expect(
      equipmentSeedSchema.safeParse({
        slug: 'Bad Slug',
        name: 'x',
        category: 'free_weights',
        common_in_home: true,
        common_in_gym: true,
      }).success,
    ).toBe(false);
  });

  it('parses an exercise with nested alt-group equipment and applies defaults', () => {
    const parsed = exerciseSeedSchema.parse({
      slug: 'bulgarian-split-squat',
      name: 'Bulgarian Split Squat',
      category: 'legs',
      movement_pattern: 'lunge',
      mechanics: 'compound',
      difficulty: 'intermediate',
      is_unilateral: true,
      is_bodyweight_ok: true,
      primary_muscles: ['quads'],
      secondary_muscles: ['glute-max'],
      equipment: [['dumbbell', 'kettlebell'], ['flat-bench']],
      instructions: 'Stand in a split stance and descend under control.',
      popularity: 75,
    });
    expect(parsed.equipment).toHaveLength(2);
    expect(parsed.aliases).toEqual([]);
    expect(parsed.tags).toEqual([]);
  });

  it('rejects a self-referential substitution', () => {
    expect(
      substitutionSeedSchema.safeParse({ exercise: 'squat', substitute: 'squat', similarity: 50 })
        .success,
    ).toBe(false);
  });

  it('validates the muscles file structure', () => {
    expect(
      musclesSeedFileSchema.safeParse({
        groups: [{ slug: 'chest', name: 'Chest', region: 'upper' }],
        muscles: [{ slug: 'pecs', name: 'Chest', group: 'chest', is_front: true }],
      }).success,
    ).toBe(true);
  });

  it('macro-consistency check accepts a real food and rejects a bad one', () => {
    // chicken breast per 100 g: 165 kcal, 31P 0C 3.6F → 4*31 + 9*3.6 = 156.4, within 15%
    expect(isMacroConsistent({ kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 })).toBe(true);
    // deliberately wrong kcal
    expect(isMacroConsistent({ kcal: 500, protein_g: 31, carbs_g: 0, fat_g: 3.6 })).toBe(false);
  });

  it('food schema fills tag/verified/source defaults', () => {
    const parsed = foodSeedSchema.parse({
      slug: 'banana',
      name: 'Banana',
      category: 'fruit',
      kcal: 89,
      protein_g: 1.1,
      carbs_g: 22.8,
      fat_g: 0.3,
      serving_name: '1 medium · 118 g',
      serving_grams: 118,
    });
    expect(parsed.verified).toBe(true);
    expect(parsed.source).toBe('fitforge-curated');
    expect(parsed.fiber_g).toBe(0);
  });
});

describe('§2.2 onboarding form schemas', () => {
  it('goals: secondary must differ from primary', () => {
    expect(goalsStepSchema.safeParse({ primary_goal: 'fat_loss' }).success).toBe(true);
    expect(
      goalsStepSchema.safeParse({ primary_goal: 'fat_loss', secondary_goal: 'fat_loss' }).success,
    ).toBe(false);
  });

  it('schedule: session minutes constrained and weekdays unique', () => {
    expect(
      scheduleStepSchema.safeParse({ days_per_week: 3, preferred_days: [0, 2, 4], session_minutes: 45 })
        .success,
    ).toBe(true);
    expect(
      scheduleStepSchema.safeParse({ days_per_week: 3, preferred_days: [0, 0], session_minutes: 50 })
        .success,
    ).toBe(false);
  });

  it('nutrition prefs applies defaults', () => {
    const parsed = nutritionPrefsStepSchema.parse({});
    expect(parsed.diet_type).toBe('none');
    expect(parsed.meals_per_day).toBe(3);
    expect(parsed.allergies).toEqual([]);
  });

  it('body metrics rejects an out-of-range height', () => {
    expect(bodyMetricsStepSchema.safeParse({ height_cm: 10 }).success).toBe(false);
    expect(bodyMetricsStepSchema.safeParse({ height_cm: 170, unit_system: 'imperial' }).success).toBe(
      true,
    );
  });
});
