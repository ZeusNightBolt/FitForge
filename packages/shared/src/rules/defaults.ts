/**
 * §7.2.1 / §7.2.2 / §7.2.5 — Smart-default matrices (pure-TS mirrors).
 *
 * Mirrors `suggest_onboarding_defaults` (§7.2.5) plus the equipment-preset / dependency-nudge
 * rules (§7.2.1) and the body-area → movement-pattern exclusion map (§7.2.2).
 */
import type { GoalType, ExperienceLevel, MovementPattern, TrainingLocation } from '../types/database.js';
import type { BodyArea } from '../types/enums.js';

/* ============================================================ §7.2.5 schedule & prescription */

export interface OnboardingDefaults {
  days_per_week: number;
  session_minutes: number;
  rep_min: number;
  rep_max: number;
  split_name: string;
}

/**
 * Base matrix (goal × experience) → days/minutes/rep-range.
 * NOTE strength/beginner: the table lists 3–6 reps but §7.2.5's footnote applies a 5-rep floor
 * for safety, so it is encoded here as rep_min 5.
 */
export const DEFAULTS_MATRIX: Record<
  GoalType,
  Record<ExperienceLevel, { days_per_week: number; session_minutes: number; rep_min: number; rep_max: number }>
> = {
  strength: {
    beginner: { days_per_week: 3, session_minutes: 45, rep_min: 5, rep_max: 6 },
    intermediate: { days_per_week: 4, session_minutes: 60, rep_min: 3, rep_max: 6 },
    advanced: { days_per_week: 4, session_minutes: 75, rep_min: 3, rep_max: 6 },
  },
  hypertrophy: {
    beginner: { days_per_week: 3, session_minutes: 45, rep_min: 8, rep_max: 12 },
    intermediate: { days_per_week: 4, session_minutes: 60, rep_min: 8, rep_max: 12 },
    advanced: { days_per_week: 5, session_minutes: 75, rep_min: 6, rep_max: 12 },
  },
  fat_loss: {
    beginner: { days_per_week: 3, session_minutes: 45, rep_min: 10, rep_max: 15 },
    intermediate: { days_per_week: 4, session_minutes: 45, rep_min: 10, rep_max: 15 },
    advanced: { days_per_week: 5, session_minutes: 60, rep_min: 10, rep_max: 15 },
  },
  endurance: {
    beginner: { days_per_week: 3, session_minutes: 30, rep_min: 15, rep_max: 20 },
    intermediate: { days_per_week: 4, session_minutes: 45, rep_min: 15, rep_max: 20 },
    advanced: { days_per_week: 5, session_minutes: 45, rep_min: 15, rep_max: 20 },
  },
  general_health: {
    beginner: { days_per_week: 3, session_minutes: 45, rep_min: 8, rep_max: 12 },
    intermediate: { days_per_week: 3, session_minutes: 45, rep_min: 8, rep_max: 12 },
    advanced: { days_per_week: 4, session_minutes: 60, rep_min: 8, rep_max: 12 },
  },
};

/**
 * Split name derived from the final days/week (§7.2.5 split section):
 * 1–2 → Full Body; 3 → Full Body; 4 → Upper/Lower; 5 → Upper/Lower/Push/Pull/Legs; 6–7 → Push/Pull/Legs.
 */
export function splitNameForDays(daysPerWeek: number): string {
  if (daysPerWeek <= 3) return 'Full Body';
  if (daysPerWeek === 4) return 'Upper/Lower';
  if (daysPerWeek === 5) return 'Upper/Lower/Push/Pull/Legs';
  return 'Push/Pull/Legs';
}

/** Mirror of `suggest_onboarding_defaults(goal, experience)` (§7.2.5). Pure & stable. */
export function suggestOnboardingDefaults(
  goal: GoalType,
  experience: ExperienceLevel,
): OnboardingDefaults {
  const base = DEFAULTS_MATRIX[goal][experience];
  return {
    ...base,
    split_name: splitNameForDays(base.days_per_week),
  };
}

/**
 * Rest-second defaults by goal (§7.2.5 footnote), split by exercise mechanics.
 */
export const REST_DEFAULTS: Record<GoalType, { compound: number; isolation: number }> = {
  strength: { compound: 180, isolation: 120 },
  hypertrophy: { compound: 90, isolation: 60 },
  fat_loss: { compound: 60, isolation: 45 },
  endurance: { compound: 60, isolation: 45 },
  general_health: { compound: 90, isolation: 60 },
};

export function restSeconds(goal: GoalType, mechanics: 'compound' | 'isolation'): number {
  return REST_DEFAULTS[goal][mechanics];
}

/**
 * Evenly-spaced weekday preselection for D days/week (§2.2 screen 4 autofill).
 * 0 = Mon … 6 = Sun. Matches the blueprint example: 3 → Mon/Wed/Fri = [0, 2, 4].
 */
export const WEEKDAY_PRESETS: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function evenlySpacedWeekdays(daysPerWeek: number): number[] {
  const d = Math.max(1, Math.min(7, Math.round(daysPerWeek)));
  return [...(WEEKDAY_PRESETS[d] ?? [0])];
}

/* ============================================================ §7.2.1 equipment presets */

export interface EquipmentPresetInput {
  slug: string;
  common_in_home: boolean;
  common_in_gym: boolean;
}

export interface EquipmentPreset {
  /** slugs toggled ON by default */
  preset: string[];
  /** slugs shown as one-tap suggestions (off by default) */
  suggested: string[];
}

/**
 * Location → equipment preset (§7.2.1).
 * - home: all `common_in_home`.
 * - commercial_gym: all `common_in_gym`.
 * - minimal: nothing on; suggest resistance-bands + pull-up-bar.
 */
export function equipmentPresetForLocation(
  location: TrainingLocation,
  catalog: readonly EquipmentPresetInput[],
): EquipmentPreset {
  if (location === 'home') {
    return { preset: catalog.filter((e) => e.common_in_home).map((e) => e.slug), suggested: [] };
  }
  if (location === 'commercial_gym') {
    return { preset: catalog.filter((e) => e.common_in_gym).map((e) => e.slug), suggested: [] };
  }
  // minimal
  return { preset: [], suggested: ['resistance-bands', 'pull-up-bar'] };
}

/**
 * Dependency nudge rules (§7.2.1). Each rule fires as a one-tap suggestion chip (never silent):
 * if any `trigger` slug is selected, `suggest` slugs are proposed (if not already selected).
 */
export const EQUIPMENT_DEPENDENCY_RULES: ReadonlyArray<{ trigger: string[]; suggest: string[] }> = [
  { trigger: ['squat-rack', 'flat-bench', 'adjustable-bench'], suggest: ['barbell', 'weight-plates'] },
  { trigger: ['barbell'], suggest: ['weight-plates', 'flat-bench'] },
  { trigger: ['lat-pulldown', 'seated-row-machine'], suggest: ['cable-machine'] },
];

/**
 * Given the currently selected equipment slugs, return additional slugs to suggest (§7.2.1).
 * Already-selected slugs are never re-suggested.
 */
export function equipmentDependencySuggestions(selected: readonly string[]): string[] {
  const has = new Set(selected);
  const out = new Set<string>();
  for (const rule of EQUIPMENT_DEPENDENCY_RULES) {
    if (rule.trigger.some((t) => has.has(t))) {
      for (const s of rule.suggest) {
        if (!has.has(s)) out.add(s);
      }
    }
  }
  return [...out];
}

/* ============================================================ §7.2.2 body-area → pattern map */

export interface BodyAreaExclusion {
  movement_pattern: MovementPattern;
  /** soft = pre-checked but individually un-checkable in an expander */
  soft: boolean;
}

/**
 * Body-area chip → excluded movement patterns (§7.2.2). † / ‡ in the blueprint = soft exclusion.
 */
export const BODY_AREA_EXCLUSION_MAP: Record<BodyArea, readonly BodyAreaExclusion[]> = {
  shoulders: [
    { movement_pattern: 'vertical_push', soft: false },
    { movement_pattern: 'shoulder_isolation', soft: true },
  ],
  lower_back: [
    { movement_pattern: 'hinge', soft: false },
    { movement_pattern: 'squat', soft: true },
  ],
  knees: [
    { movement_pattern: 'lunge', soft: false },
    { movement_pattern: 'knee_extension_iso', soft: false },
    { movement_pattern: 'squat', soft: true },
  ],
  wrists: [
    { movement_pattern: 'elbow_extension', soft: true },
    { movement_pattern: 'horizontal_push', soft: true },
  ],
  elbows: [
    { movement_pattern: 'elbow_flexion', soft: false },
    { movement_pattern: 'elbow_extension', soft: false },
  ],
  hips: [
    { movement_pattern: 'hinge', soft: false },
    { movement_pattern: 'lunge', soft: false },
  ],
  neck: [{ movement_pattern: 'vertical_pull', soft: true }],
};

/**
 * Resolve selected body-area chips into the set of movement-pattern exclusions to store
 * (§7.2.2). Hard exclusions are always included; soft exclusions are included unless the user
 * un-checked them (`keptSoftPatterns` lists soft patterns the user left checked).
 *
 * Default behaviour (no `keptSoftPatterns` passed) keeps ALL soft exclusions (they are shown
 * pre-checked). Returns one entry per distinct pattern (hard wins over soft on conflict).
 */
export function resolveBodyAreaExclusions(
  bodyAreas: readonly BodyArea[],
  keptSoftPatterns?: readonly MovementPattern[],
): Array<{ movement_pattern: MovementPattern; soft: boolean; source_body_area: BodyArea }> {
  const keepSoft = keptSoftPatterns ? new Set(keptSoftPatterns) : null;
  const byPattern = new Map<MovementPattern, { soft: boolean; source_body_area: BodyArea }>();
  for (const area of bodyAreas) {
    for (const ex of BODY_AREA_EXCLUSION_MAP[area]) {
      if (ex.soft && keepSoft && !keepSoft.has(ex.movement_pattern)) continue;
      const existing = byPattern.get(ex.movement_pattern);
      // hard (soft=false) always wins; keep earliest source otherwise
      if (!existing || (existing.soft && !ex.soft)) {
        byPattern.set(ex.movement_pattern, { soft: ex.soft, source_body_area: area });
      }
    }
  }
  return [...byPattern.entries()].map(([movement_pattern, v]) => ({
    movement_pattern,
    soft: v.soft,
    source_body_area: v.source_body_area,
  }));
}
