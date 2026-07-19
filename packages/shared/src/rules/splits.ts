/**
 * §7.5 — Starter-routine split templates (pure-TS mirror; SQL `generate_starter_routine`
 * mirrors these exact templates).
 *
 * A split is an ordered list of ROLE SLOTS. Each slot names a primary movement pattern plus
 * optional `alt` patterns (acceptable substitutes when the primary has no feasible exercise) and
 * a `mechanics` hint / `note` used by the picker in §7.5 step 4.
 */
import type { MovementPattern, MechanicsType } from '../types/database.js';

export interface RoleSlot {
  pattern: MovementPattern;
  /** acceptable alternative patterns for this slot (the `|` options in §7.5 step 2) */
  alt?: MovementPattern[];
  /** mechanics preference for the slot, e.g. horizontal_push(iso) */
  mechanics?: MechanicsType;
  /** free-form hint, e.g. 'rear' for rear-delt shoulder isolation */
  note?: string;
}

export interface DayTemplate {
  key: string;
  focus: string;
  slots: RoleSlot[];
}

/* ---------------------------------------------------------------- named day templates (§7.5 step 2) */

export const FULL_BODY_A: DayTemplate = {
  key: 'full_body_a',
  focus: 'Full Body',
  slots: [
    { pattern: 'squat' },
    { pattern: 'horizontal_push' },
    { pattern: 'horizontal_pull' },
    { pattern: 'hinge' },
    { pattern: 'core_stability' },
  ],
};

export const FULL_BODY_B: DayTemplate = {
  key: 'full_body_b',
  focus: 'Full Body',
  slots: [
    { pattern: 'hinge' },
    { pattern: 'vertical_push' },
    { pattern: 'vertical_pull' },
    { pattern: 'lunge' },
    { pattern: 'core_flexion' },
  ],
};

export const FULL_BODY_C: DayTemplate = {
  key: 'full_body_c',
  focus: 'Full Body',
  slots: [
    { pattern: 'squat' },
    { pattern: 'horizontal_push' },
    { pattern: 'horizontal_pull' },
    { pattern: 'hip_extension_iso' },
    { pattern: 'core_stability' },
  ],
};

export const UPPER: DayTemplate = {
  key: 'upper',
  focus: 'Upper',
  slots: [
    { pattern: 'horizontal_push' },
    { pattern: 'horizontal_pull' },
    { pattern: 'vertical_push' },
    { pattern: 'vertical_pull' },
    { pattern: 'elbow_flexion' },
    { pattern: 'elbow_extension' },
  ],
};

export const LOWER: DayTemplate = {
  key: 'lower',
  focus: 'Lower',
  slots: [
    { pattern: 'squat' },
    { pattern: 'hinge' },
    { pattern: 'lunge' },
    { pattern: 'knee_flexion_iso', alt: ['hip_extension_iso'] },
    { pattern: 'calf_raise' },
    { pattern: 'core_stability', alt: ['core_flexion'] },
  ],
};

export const PUSH: DayTemplate = {
  key: 'push',
  focus: 'Push',
  slots: [
    { pattern: 'horizontal_push' },
    { pattern: 'vertical_push' },
    { pattern: 'horizontal_push', mechanics: 'isolation' },
    { pattern: 'elbow_extension' },
    { pattern: 'shoulder_isolation' },
  ],
};

export const PULL: DayTemplate = {
  key: 'pull',
  focus: 'Pull',
  slots: [
    { pattern: 'vertical_pull' },
    { pattern: 'horizontal_pull' },
    { pattern: 'shoulder_isolation', note: 'rear' },
    { pattern: 'elbow_flexion' },
    { pattern: 'carry', alt: ['core_stability', 'core_flexion'] },
  ],
};

export const LEGS: DayTemplate = {
  key: 'legs',
  focus: 'Legs',
  slots: [
    { pattern: 'squat' },
    { pattern: 'hinge' },
    { pattern: 'lunge' },
    { pattern: 'knee_extension_iso', alt: ['knee_flexion_iso'] },
    { pattern: 'calf_raise' },
    { pattern: 'core_stability', alt: ['core_flexion'] },
  ],
};

/** Optional rest/cardio day used as the 7th day when D = 7 (§7.2.5). */
export const REST_CARDIO: DayTemplate = {
  key: 'rest_cardio',
  focus: 'Rest / Cardio',
  slots: [{ pattern: 'cardio' }],
};

/* ---------------------------------------------------------------- day plan by days/week (§7.2.5) */

/**
 * Ordered day templates for D days/week (§7.2.5 split section):
 * 1–2 → Full Body A/B; 3 → Full Body A/B/C; 4 → Upper/Lower ×2;
 * 5 → Upper/Lower/Push/Pull/Legs; 6 → PPL ×2; 7 → PPL ×2 + Rest/Cardio.
 */
export function dayPlanForDays(daysPerWeek: number): DayTemplate[] {
  const d = Math.max(1, Math.min(7, Math.round(daysPerWeek)));
  switch (d) {
    case 1:
      return [FULL_BODY_A];
    case 2:
      return [FULL_BODY_A, FULL_BODY_B];
    case 3:
      return [FULL_BODY_A, FULL_BODY_B, FULL_BODY_C];
    case 4:
      return [UPPER, LOWER, UPPER, LOWER];
    case 5:
      return [UPPER, LOWER, PUSH, PULL, LEGS];
    case 6:
      return [PUSH, PULL, LEGS, PUSH, PULL, LEGS];
    default:
      return [PUSH, PULL, LEGS, PUSH, PULL, LEGS, REST_CARDIO];
  }
}

/**
 * §7.5 step 3 — session-length trim: 30 → first 4 slots, 45 → 5, 60 → 6, 75+ → all.
 * (The "+1 optional" for 75+ is realised by keeping all slots.)
 */
export function slotCountForSession(sessionMinutes: number): number {
  if (sessionMinutes <= 30) return 4;
  if (sessionMinutes <= 45) return 5;
  if (sessionMinutes <= 60) return 6;
  return Number.POSITIVE_INFINITY;
}

export function trimSlotsForSession(slots: RoleSlot[], sessionMinutes: number): RoleSlot[] {
  const n = slotCountForSession(sessionMinutes);
  return Number.isFinite(n) ? slots.slice(0, n) : slots;
}

/**
 * Build the full day plan for a profile: day templates for D, each trimmed to the session length,
 * with a display name ("Day A — Upper") and weekday pinned from `preferredDays` in order.
 */
export interface PlannedDay {
  day_index: number;
  name: string;
  focus: string;
  weekday: number | null;
  slots: RoleSlot[];
}

const DAY_LETTERS = 'ABCDEFG';

export function buildDayPlan(
  daysPerWeek: number,
  sessionMinutes: number,
  preferredDays: readonly number[] = [],
): PlannedDay[] {
  const templates = dayPlanForDays(daysPerWeek);
  return templates.map((tpl, i) => ({
    day_index: i,
    name: `Day ${DAY_LETTERS[i] ?? String(i + 1)} — ${tpl.focus}`,
    focus: tpl.focus,
    weekday: preferredDays[i] ?? null,
    slots: trimSlotsForSession(tpl.slots, sessionMinutes),
  }));
}
