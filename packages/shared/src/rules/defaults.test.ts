import { describe, it, expect } from 'vitest';
import {
  suggestOnboardingDefaults,
  splitNameForDays,
  restSeconds,
  evenlySpacedWeekdays,
  equipmentPresetForLocation,
  equipmentDependencySuggestions,
  resolveBodyAreaExclusions,
  BODY_AREA_EXCLUSION_MAP,
} from './defaults.js';
import { defaultsCaseFixtures } from '../fixtures/index.js';

describe('§7.2.5 onboarding defaults — matrix spot checks', () => {
  for (const c of defaultsCaseFixtures) {
    it(`${c.goal} / ${c.experience}`, () => {
      expect(suggestOnboardingDefaults(c.goal, c.experience)).toEqual(c.expected);
    });
  }

  it('strength/beginner applies the 5-rep floor', () => {
    expect(suggestOnboardingDefaults('strength', 'beginner').rep_min).toBe(5);
  });
});

describe('§7.2.5 split names & rest', () => {
  it('split name by days', () => {
    expect(splitNameForDays(2)).toBe('Full Body');
    expect(splitNameForDays(3)).toBe('Full Body');
    expect(splitNameForDays(4)).toBe('Upper/Lower');
    expect(splitNameForDays(5)).toBe('Upper/Lower/Push/Pull/Legs');
    expect(splitNameForDays(6)).toBe('Push/Pull/Legs');
    expect(splitNameForDays(7)).toBe('Push/Pull/Legs');
  });

  it('rest seconds by goal & mechanics', () => {
    expect(restSeconds('strength', 'compound')).toBe(180);
    expect(restSeconds('strength', 'isolation')).toBe(120);
    expect(restSeconds('hypertrophy', 'compound')).toBe(90);
    expect(restSeconds('fat_loss', 'isolation')).toBe(45);
    expect(restSeconds('general_health', 'compound')).toBe(90);
  });

  it('evenly-spaced weekdays: 3 → Mon/Wed/Fri', () => {
    expect(evenlySpacedWeekdays(3)).toEqual([0, 2, 4]);
    expect(evenlySpacedWeekdays(1)).toEqual([0]);
    expect(evenlySpacedWeekdays(5)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('§7.2.1 equipment presets & dependency nudges', () => {
  const catalog = [
    { slug: 'barbell', common_in_home: true, common_in_gym: true },
    { slug: 'squat-rack', common_in_home: false, common_in_gym: true },
    { slug: 'dumbbell', common_in_home: true, common_in_gym: true },
    { slug: 'treadmill', common_in_home: false, common_in_gym: true },
  ];

  it('home preset = common_in_home', () => {
    expect(equipmentPresetForLocation('home', catalog).preset.sort()).toEqual(['barbell', 'dumbbell']);
  });

  it('commercial_gym preset = common_in_gym', () => {
    expect(equipmentPresetForLocation('commercial_gym', catalog).preset).toHaveLength(4);
  });

  it('minimal preset suggests bands + pull-up bar, none on', () => {
    const p = equipmentPresetForLocation('minimal', catalog);
    expect(p.preset).toEqual([]);
    expect(p.suggested).toEqual(['resistance-bands', 'pull-up-bar']);
  });

  it('squat-rack nudges barbell + weight-plates', () => {
    expect(equipmentDependencySuggestions(['squat-rack']).sort()).toEqual(['barbell', 'weight-plates']);
  });

  it('barbell nudges weight-plates + flat-bench, never re-suggesting owned', () => {
    expect(equipmentDependencySuggestions(['barbell', 'flat-bench'])).toEqual(['weight-plates']);
  });

  it('lat-pulldown nudges cable-machine', () => {
    expect(equipmentDependencySuggestions(['lat-pulldown'])).toEqual(['cable-machine']);
  });
});

describe('§7.2.2 body-area → movement-pattern exclusions', () => {
  it('shoulders excludes vertical_push (hard) + shoulder_isolation (soft)', () => {
    const patterns = BODY_AREA_EXCLUSION_MAP.shoulders;
    expect(patterns.find((p) => p.movement_pattern === 'vertical_push')?.soft).toBe(false);
    expect(patterns.find((p) => p.movement_pattern === 'shoulder_isolation')?.soft).toBe(true);
  });

  it('resolve keeps soft exclusions by default', () => {
    const rows = resolveBodyAreaExclusions(['shoulders']);
    const patterns = rows.map((r) => r.movement_pattern).sort();
    expect(patterns).toEqual(['shoulder_isolation', 'vertical_push']);
  });

  it('resolve can drop un-kept soft exclusions but keeps hard ones', () => {
    const rows = resolveBodyAreaExclusions(['shoulders'], []); // user un-checked all soft
    expect(rows.map((r) => r.movement_pattern)).toEqual(['vertical_push']);
  });

  it('overlapping areas dedupe; hard wins over soft (knees + lower_back → squat hard)', () => {
    const rows = resolveBodyAreaExclusions(['knees', 'lower_back']);
    const squat = rows.find((r) => r.movement_pattern === 'squat');
    // knees marks squat soft, lower_back marks squat soft → stays soft (both soft)
    expect(squat).toBeDefined();
    // hinge (hard from lower_back) present
    expect(rows.find((r) => r.movement_pattern === 'hinge')?.soft).toBe(false);
    // lunge + knee_extension_iso hard from knees
    expect(rows.find((r) => r.movement_pattern === 'knee_extension_iso')?.soft).toBe(false);
  });
});
