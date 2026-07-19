/**
 * §7.2.4 — Nutrition targets (pure-TS mirror of the `suggest_nutrition_targets` RPC).
 *
 * SQL is authoritative; this mirror is verified against the same persona fixtures
 * (src/fixtures/personas.json) that the pgTAP suite (WS-6) uses.
 */
import type { SexType, GoalType, DietType } from '../types/database.js';

export interface MacroProfileInput {
  sex: SexType | null | undefined;
  /** latest body weight in kg; falls back to sex median (82 male / 70 female / 76 other) */
  weight_kg?: number | null;
  /** height in cm; falls back to sex median (175 male / 162 female / 168.5 other) */
  height_cm?: number | null;
  /** age in years; falls back to 30 */
  age?: number | null;
  days_per_week?: number | null;
  primary_goal: GoalType;
  diet_type?: DietType | null;
}

export interface MacroTargets {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  method: string;
}

const round50 = (n: number): number => Math.round(n / 50) * 50;
const round5 = (n: number): number => Math.round(n / 5) * 5;

function isMale(sex: SexType | null | undefined): boolean {
  return sex === 'male';
}
function isFemale(sex: SexType | null | undefined): boolean {
  return sex === 'female';
}

/** Step 1 fallbacks (§7.2.4). */
export function fallbackWeightKg(sex: SexType | null | undefined): number {
  if (isMale(sex)) return 82;
  if (isFemale(sex)) return 70;
  return 76;
}
export function fallbackHeightCm(sex: SexType | null | undefined): number {
  if (isMale(sex)) return 175;
  if (isFemale(sex)) return 162;
  return 168.5;
}

/** Mifflin-St Jeor BMR (§7.2.4 step 1). other/unspecified = mean of the male & female formulas. */
export function mifflinStJeorBmr(
  sex: SexType | null | undefined,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (isMale(sex)) return base + 5;
  if (isFemale(sex)) return base - 161;
  // mean of +5 and -161
  return base + (5 - 161) / 2;
}

/** Step 2 — activity factor from days/week. */
export function activityFactor(daysPerWeek: number): number {
  if (daysPerWeek <= 2) return 1.35;
  if (daysPerWeek <= 4) return 1.5;
  return 1.65;
}

/** Step 3 — goal calorie adjustment multiplier. */
export function goalAdjustment(goal: GoalType): number {
  switch (goal) {
    case 'fat_loss':
      return 0.8; // −20%
    case 'strength':
    case 'hypertrophy':
      return 1.08; // +8%
    case 'endurance':
      return 1.05; // +5%
    case 'general_health':
      return 1.0;
  }
}

/** Step 3 — calorie floor. */
export function calorieFloor(sex: SexType | null | undefined): number {
  return isMale(sex) ? 1500 : 1200;
}

/** Step 4 — protein g per kg bodyweight. keto forces 1.6 g/kg. */
export function proteinPerKg(goal: GoalType, diet: DietType | null | undefined): number {
  if (diet === 'keto') return 1.6;
  switch (goal) {
    case 'fat_loss':
    case 'strength':
    case 'hypertrophy':
      return 1.8;
    case 'endurance':
      return 1.4;
    case 'general_health':
      return 1.6;
  }
}

const GOAL_LABEL: Record<GoalType, string> = {
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  fat_loss: 'fat loss',
  endurance: 'endurance',
  general_health: 'general health',
};

function adjustmentSuffix(goal: GoalType): string {
  switch (goal) {
    case 'fat_loss':
      return ' − 20%';
    case 'strength':
    case 'hypertrophy':
      return ' + 8%';
    case 'endurance':
      return ' + 5%';
    case 'general_health':
      return '';
  }
}

/**
 * Deterministic macro target computation (§7.2.4). Mirrors `suggest_nutrition_targets`.
 */
export function computeNutritionTargets(input: MacroProfileInput): MacroTargets {
  const sex = input.sex ?? null;
  const weight = input.weight_kg ?? fallbackWeightKg(sex);
  const height = input.height_cm ?? fallbackHeightCm(sex);
  const age = input.age ?? 30;
  const days = input.days_per_week ?? 3;
  const goal = input.primary_goal;
  const diet = input.diet_type ?? null;

  // 1. BMR
  const bmr = mifflinStJeorBmr(sex, weight, height, age);
  // 2. TDEE
  const factor = activityFactor(days);
  const tdee = bmr * factor;
  // 3. Goal adjustment + clamp + round to nearest 50
  const adjusted = tdee * goalAdjustment(goal);
  const clamped = Math.max(adjusted, calorieFloor(sex));
  const kcal = round50(clamped);
  // 4. Macros
  const protein_g = round5(Math.min(proteinPerKg(goal, diet) * weight, 220));
  const fatFraction = diet === 'keto' ? 0.65 : 0.3;
  const fat_g = round5((kcal * fatFraction) / 9);
  const carbs_g = round5(Math.max(0, (kcal - 4 * protein_g - 9 * fat_g) / 4));
  // 5. Method
  const ketoNote = diet === 'keto' ? ', keto' : '';
  const method = `Mifflin-St Jeor × ${factor}${adjustmentSuffix(goal)} (${GOAL_LABEL[goal]})${ketoNote}`;

  return { kcal, protein_g, carbs_g, fat_g, method };
}
