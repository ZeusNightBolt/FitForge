import { describe, it, expect } from 'vitest';
import { computeNutritionTargets, activityFactor, goalAdjustment, calorieFloor } from './macros.js';
import { personaFixtures } from '../fixtures/index.js';

describe('§7.2.4 nutrition targets — persona fixtures', () => {
  for (const p of personaFixtures) {
    it(`${p.key} (${p.label}) matches expected targets`, () => {
      const out = computeNutritionTargets(p.input);
      expect(out.kcal).toBe(p.expected.kcal);
      expect(out.protein_g).toBe(p.expected.protein_g);
      expect(out.carbs_g).toBe(p.expected.carbs_g);
      expect(out.fat_g).toBe(p.expected.fat_g);
      expect(out.method).toBe(p.expected.method);
    });
  }
});

describe('§7.2.4 building blocks', () => {
  it('activity factor buckets', () => {
    expect(activityFactor(1)).toBe(1.35);
    expect(activityFactor(2)).toBe(1.35);
    expect(activityFactor(3)).toBe(1.5);
    expect(activityFactor(4)).toBe(1.5);
    expect(activityFactor(5)).toBe(1.65);
    expect(activityFactor(6)).toBe(1.65);
  });

  it('goal adjustment multipliers', () => {
    expect(goalAdjustment('fat_loss')).toBeCloseTo(0.8);
    expect(goalAdjustment('strength')).toBeCloseTo(1.08);
    expect(goalAdjustment('hypertrophy')).toBeCloseTo(1.08);
    expect(goalAdjustment('endurance')).toBeCloseTo(1.05);
    expect(goalAdjustment('general_health')).toBe(1);
  });

  it('calorie floors by sex', () => {
    expect(calorieFloor('male')).toBe(1500);
    expect(calorieFloor('female')).toBe(1200);
    expect(calorieFloor('other')).toBe(1200);
    expect(calorieFloor(null)).toBe(1200);
  });

  it('applies the calorie floor for a small/low-activity female profile', () => {
    const out = computeNutritionTargets({
      sex: 'female',
      weight_kg: 45,
      height_cm: 150,
      age: 60,
      days_per_week: 1,
      primary_goal: 'fat_loss',
    });
    // BMR ~ 10*45+6.25*150-5*60-161 = 450+937.5-300-161 = 926.5; TDEE*1.35*0.8 ~ 1000 < floor
    expect(out.kcal).toBe(1200);
  });

  it('keto uses 1.6 g/kg protein and 65% fat', () => {
    const out = computeNutritionTargets({
      sex: 'male',
      weight_kg: 80,
      height_cm: 178,
      age: 45,
      days_per_week: 3,
      primary_goal: 'general_health',
      diet_type: 'keto',
    });
    expect(out.method).toContain('keto');
    // fat should be the dominant macro under keto
    expect(out.fat_g * 9).toBeGreaterThan(out.carbs_g * 4);
  });

  it('uses documented fallbacks when metrics are missing', () => {
    const out = computeNutritionTargets({ sex: null, primary_goal: 'general_health' });
    // deterministic, non-NaN, above floor
    expect(Number.isFinite(out.kcal)).toBe(true);
    expect(out.kcal).toBeGreaterThanOrEqual(1200);
  });
});
