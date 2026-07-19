import { describe, it, expect } from 'vitest';
import { suggestSubstitutes, isFeasible } from './substitution.js';
import type { SubstitutionContext, CatalogExercise } from './substitution.js';
import type { MovementPattern } from '../types/database.js';
import {
  catalogFixture,
  substitutionEdgesFixture,
  substitutionCaseFixtures,
} from '../fixtures/index.js';

function ctxFrom(c: (typeof substitutionCaseFixtures)[number]): SubstitutionContext {
  return {
    ownedEquipment: new Set(c.owned_equipment),
    trainingLocation: c.training_location,
    experience: c.experience,
    excludedExercises: new Set(c.excluded_exercises),
    excludedPatterns: new Set(c.excluded_patterns as MovementPattern[]),
    favorites: new Set(c.favorites),
  };
}

describe('§7.4 substitution engine — fixture cases', () => {
  for (const c of substitutionCaseFixtures) {
    it(c.name, () => {
      const results = suggestSubstitutes(
        c.target,
        catalogFixture,
        substitutionEdgesFixture,
        ctxFrom(c),
        5,
      );
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]!.slug).toBe(c.expected_top);
      // never returns the target itself
      expect(results.some((r) => r.slug === c.target)).toBe(false);
      // sorted descending by score
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1]!.score).toBeGreaterThanOrEqual(results[i]!.score);
      }
    });
  }
});

const bySlug = new Map(catalogFixture.map((e) => [e.slug, e] as const));
function baseCtx(over: Partial<SubstitutionContext> = {}): SubstitutionContext {
  return {
    ownedEquipment: new Set<string>(),
    trainingLocation: 'commercial_gym',
    experience: 'intermediate',
    excludedExercises: new Set<string>(),
    excludedPatterns: new Set<MovementPattern>(),
    favorites: new Set<string>(),
    ...over,
  };
}

describe('§7.4 step semantics', () => {
  it('step 1: zero equipment + commercial_gym treats all equipment as owned', () => {
    const barbell = bySlug.get('bench-press') as CatalogExercise;
    expect(isFeasible(barbell, baseCtx({ trainingLocation: 'commercial_gym' }))).toBe(true);
  });

  it('step 1: zero equipment + home only allows bodyweight/no-equipment', () => {
    const ctx = baseCtx({ trainingLocation: 'home' });
    expect(isFeasible(bySlug.get('bench-press') as CatalogExercise, ctx)).toBe(false);
    expect(isFeasible(bySlug.get('push-up') as CatalogExercise, ctx)).toBe(true);
  });

  it('step 1: every alt-group must be satisfiable', () => {
    // dumbbell-bench-press needs dumbbell AND flat-bench
    const dbp = bySlug.get('dumbbell-bench-press') as CatalogExercise;
    expect(
      isFeasible(dbp, baseCtx({ trainingLocation: 'home', ownedEquipment: new Set(['dumbbell']) })),
    ).toBe(false);
    expect(
      isFeasible(
        dbp,
        baseCtx({ trainingLocation: 'home', ownedEquipment: new Set(['dumbbell', 'flat-bench']) }),
      ),
    ).toBe(true);
  });

  it('step 2: excluded movement pattern removes candidates', () => {
    const ctx = baseCtx({
      trainingLocation: 'home',
      ownedEquipment: new Set(['dumbbell', 'flat-bench']),
      experience: 'intermediate',
      excludedPatterns: new Set<MovementPattern>(['horizontal_push']),
    });
    const results = suggestSubstitutes('bench-press', catalogFixture, substitutionEdgesFixture, ctx);
    expect(results.some((r) => r.slug === 'dumbbell-bench-press')).toBe(false);
    expect(results.some((r) => r.slug === 'push-up')).toBe(false);
  });

  it('step 2: explicitly excluded exercise is removed', () => {
    const ctx = baseCtx({
      trainingLocation: 'home',
      ownedEquipment: new Set(['dumbbell', 'flat-bench']),
      excludedExercises: new Set(['dumbbell-bench-press']),
    });
    const results = suggestSubstitutes('bench-press', catalogFixture, substitutionEdgesFixture, ctx);
    expect(results.some((r) => r.slug === 'dumbbell-bench-press')).toBe(false);
    expect(results[0]!.slug).toBe('push-up');
  });

  it('step 3: pinned preferred substitute returns first with score 1000', () => {
    const ctx = baseCtx({
      trainingLocation: 'home',
      ownedEquipment: new Set(['dumbbell', 'flat-bench']),
      preferredSubstitute: 'push-up',
    });
    const results = suggestSubstitutes('bench-press', catalogFixture, substitutionEdgesFixture, ctx);
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe('push-up');
    expect(results[0]!.score).toBe(1000);
    expect(results[0]!.reason).toBe('You chose this substitute');
  });

  it('step 3: pinned substitute that is infeasible is ignored (falls back to scoring)', () => {
    const ctx = baseCtx({
      trainingLocation: 'home',
      ownedEquipment: new Set(['dumbbell', 'flat-bench']),
      preferredSubstitute: 'machine-chest-press', // needs a machine the user lacks
    });
    const results = suggestSubstitutes('bench-press', catalogFixture, substitutionEdgesFixture, ctx);
    expect(results[0]!.slug).toBe('dumbbell-bench-press');
    expect(results[0]!.score).not.toBe(1000);
  });

  it('curated reason is preferred when the edge carries one; otherwise generated', () => {
    const ctx = baseCtx({
      trainingLocation: 'home',
      ownedEquipment: new Set(['dumbbell', 'flat-bench']),
    });
    const results = suggestSubstitutes('bench-press', catalogFixture, substitutionEdgesFixture, ctx);
    // generated reason begins with "Targets" for our edge fixtures (no reason strings attached)
    expect(results[0]!.reason).toContain('Targets');
  });
});
