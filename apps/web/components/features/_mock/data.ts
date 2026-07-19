/**
 * WS-5 mock data plane.
 *
 * All WS-5 pages render against MOCKED data (per the brief: "Render with mocked data where a live
 * DB is needed"). This module simulates the §5.1 PostgREST reads, the §5.2 views
 * (`v_exercise_full`, `v_daily_nutrition`, `v_exercise_prs`) and the §5.3 RPCs
 * (`search_exercises`, `search_foods`, `suggest_substitutes`, `log_food`, `previous_sets`, …).
 *
 * INTEGRATION: at wire-up time each `mock*` accessor is replaced by a Supabase client call /
 * `@fitforge/shared` RPC wrapper of the same shape. Slugs/enum values are transcribed verbatim
 * from BLUEPRINT §6 so the swap needs no data remapping. Nothing here writes to disk or network.
 */

/* ------------------------------------------------------------------ enum-ish string unions */
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'elbow_flexion'
  | 'elbow_extension'
  | 'shoulder_isolation'
  | 'core_flexion'
  | 'core_stability'
  | 'carry'
  | 'hip_extension_iso'
  | 'knee_flexion_iso'
  | 'knee_extension_iso'
  | 'calf_raise'
  | 'cardio';
export type Mechanics = 'compound' | 'isolation';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type GoalType = 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'general_health';
export type PhotoPose = 'front' | 'side' | 'back';
export type DietType =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'mediterranean'
  | 'none';

/* --------------------------------------------------------------------- catalog read models */
export interface EquipmentGroup {
  alt_group: number;
  slugs: string[];
  names: string[];
}

/** Mirror of §5.2 `v_exercise_full` (one-shot exercise read). */
export interface ExerciseFull {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category_slug: string;
  category_name: string;
  movement_pattern: MovementPattern;
  mechanics: Mechanics;
  difficulty: Difficulty;
  is_unilateral: boolean;
  is_bodyweight_ok: boolean;
  instructions: string;
  image_path: string | null;
  tags: string[];
  popularity: number;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: EquipmentGroup[];
}

export interface ExerciseSearchRow {
  exercise_id: string;
  slug: string;
  name: string;
  matched_alias: string | null;
  score: number;
}

export interface SubstituteRow {
  exercise_id: string;
  slug: string;
  name: string;
  score: number;
  reason: string;
}

/* ----------------------------------------------------------------------- routine read model */
export interface RoutineExercise {
  id: string;
  position: number;
  exercise_id: string;
  exercise_slug: string;
  exercise_name: string;
  image_path: string | null;
  sets: number;
  rep_min: number;
  rep_max: number;
  target_rpe: number | null;
  rest_seconds: number;
  superset_group: number | null;
  notes: string | null;
}
export interface RoutineDay {
  id: string;
  day_index: number;
  name: string;
  focus: string | null;
  /** 0=Mon … 6=Sun (BLUEPRINT §3.2) */
  weekday: number | null;
  exercises: RoutineExercise[];
}
export interface Routine {
  id: string;
  name: string;
  description: string | null;
  goal: GoalType | null;
  source: 'generated' | 'custom';
  is_active: boolean;
  start_date: string | null;
  days: RoutineDay[];
}

/* -------------------------------------------------------------------- nutrition read models */
export interface FoodSearchRow {
  food_id: string;
  slug: string;
  name: string;
  brand: string | null;
  kcal: number; // per 100 g
  protein_g: number; // per 100 g
  carbs_g: number; // per 100 g
  fat_g: number; // per 100 g
  serving_name: string;
  serving_grams: number;
  score: number;
}
export interface NutritionLog {
  id: string;
  logged_on: string;
  meal_slot: MealSlot;
  food_id: string | null;
  custom_name: string | null;
  quantity_g: number | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
/** Mirror of §5.2 `v_daily_nutrition`. */
export interface DailyNutrition {
  logged_on: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
export interface NutritionTargets {
  kcal_target: number;
  protein_g_target: number;
  carbs_g_target: number;
  fat_g_target: number;
}
export interface MealTemplate {
  id: string;
  name: string;
  items: { food_id: string; food_name: string; quantity_g: number }[];
}

/* -------------------------------------------------------------------- progress read models */
export interface BodyMetric {
  measured_on: string;
  weight_kg: number | null;
}
/** Mirror of §5.2 `v_exercise_prs` (best Epley e1RM + best weight per exercise). */
export interface ExercisePR {
  exercise_id: string;
  exercise_slug: string;
  exercise_name: string;
  best_e1rm: number;
  best_weight_kg: number;
  best_reps: number;
}
export interface ProgressPhoto {
  id: string;
  taken_on: string;
  pose: PhotoPose;
  storage_path: string;
}

/* ------------------------------------------------------------------------ workout logging */
export interface PreviousSet {
  set_number: number;
  reps: number;
  weight_kg: number;
  rpe: number | null;
}

/* ------------------------------------------------------------------------- user profile */
export interface Profile {
  display_name: string;
  sex: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birthdate: string;
  height_cm: number;
  unit_system: 'metric' | 'imperial';
  experience_level: Difficulty;
  primary_goal: GoalType;
  secondary_goal: GoalType | null;
  training_location: 'home' | 'commercial_gym' | 'minimal';
  days_per_week: number;
  session_minutes: number;
  preferred_days: number[]; // 0=Mon … 6=Sun
}
export interface NutritionProfile {
  diet_type: DietType;
  allergies: string[];
  meals_per_day: number;
  kcal_target: number;
  protein_g_target: number;
  carbs_g_target: number;
  fat_g_target: number;
  targets_source: 'suggested' | 'custom';
}

/* ====================================================================================== */
/*  Seed-derived catalog (subset of §6.4, verbatim slugs / names / patterns / popularity)  */
/* ====================================================================================== */

const INSTR =
  'Set up under control, brace, and move through a full range of motion. Keep the working muscle under tension and finish each rep with intent.';

function ex(
  id: string,
  slug: string,
  name: string,
  category_slug: string,
  category_name: string,
  movement_pattern: MovementPattern,
  mechanics: Mechanics,
  difficulty: Difficulty,
  popularity: number,
  primary_muscles: string[],
  secondary_muscles: string[],
  equipment: EquipmentGroup[],
  is_bodyweight_ok = false,
  is_unilateral = false,
): ExerciseFull {
  return {
    id,
    slug,
    name,
    aliases: [],
    category_slug,
    category_name,
    movement_pattern,
    mechanics,
    difficulty,
    is_unilateral,
    is_bodyweight_ok,
    instructions: INSTR,
    image_path: null,
    tags: [],
    popularity,
    primary_muscles,
    secondary_muscles,
    equipment,
  };
}
const g = (alt_group: number, ...pairs: [string, string][]): EquipmentGroup => ({
  alt_group,
  slugs: pairs.map((p) => p[0]),
  names: pairs.map((p) => p[1]),
});

export const EXERCISES: ExerciseFull[] = [
  ex('ex-back-squat', 'barbell-back-squat', 'Barbell Back Squat', 'legs', 'Legs', 'squat', 'compound', 'intermediate', 95, ['quads'], ['glute-max', 'lower-back', 'adductors'], [g(1, ['barbell', 'Barbell']), g(2, ['weight-plates', 'Weight Plates']), g(3, ['squat-rack', 'Squat / Power Rack'])]),
  ex('ex-goblet-squat', 'goblet-squat', 'Goblet Squat', 'legs', 'Legs', 'squat', 'compound', 'beginner', 80, ['quads'], ['glute-max', 'abs'], [g(1, ['dumbbell', 'Dumbbells'], ['kettlebell', 'Kettlebell'])]),
  ex('ex-leg-press', 'leg-press', 'Leg Press', 'legs', 'Legs', 'squat', 'compound', 'beginner', 85, ['quads'], ['glute-max', 'adductors'], [g(1, ['leg-press', 'Leg Press Machine'])]),
  ex('ex-bodyweight-squat', 'bodyweight-squat', 'Bodyweight Squat', 'legs', 'Legs', 'squat', 'compound', 'beginner', 70, ['quads'], ['glute-max'], [], true),
  ex('ex-bulgarian-split-squat', 'bulgarian-split-squat', 'Bulgarian Split Squat', 'legs', 'Legs', 'lunge', 'compound', 'intermediate', 75, ['quads'], ['glute-max'], [g(1, ['dumbbell', 'Dumbbells'], ['kettlebell', 'Kettlebell']), g(2, ['flat-bench', 'Flat Bench'])], true, true),
  ex('ex-conventional-deadlift', 'conventional-deadlift', 'Conventional Deadlift', 'legs', 'Legs', 'hinge', 'compound', 'advanced', 90, ['hamstrings'], ['glute-max', 'lower-back', 'traps', 'forearms'], [g(1, ['barbell', 'Barbell']), g(2, ['weight-plates', 'Weight Plates'])]),
  ex('ex-romanian-deadlift', 'romanian-deadlift', 'Romanian Deadlift', 'legs', 'Legs', 'hinge', 'compound', 'intermediate', 85, ['hamstrings'], ['glute-max', 'lower-back'], [g(1, ['barbell', 'Barbell'], ['dumbbell', 'Dumbbells'])]),
  ex('ex-barbell-hip-thrust', 'barbell-hip-thrust', 'Barbell Hip Thrust', 'glutes', 'Glutes', 'hip_extension_iso', 'compound', 'intermediate', 85, ['glute-max'], ['hamstrings'], [g(1, ['barbell', 'Barbell']), g(2, ['weight-plates', 'Weight Plates']), g(3, ['flat-bench', 'Flat Bench'])]),
  ex('ex-leg-curl', 'leg-curl', 'Lying / Seated Leg Curl', 'legs', 'Legs', 'knee_flexion_iso', 'isolation', 'beginner', 75, ['hamstrings'], [], [g(1, ['leg-curl-machine', 'Leg Curl Machine'])]),
  ex('ex-leg-extension', 'leg-extension', 'Leg Extension', 'legs', 'Legs', 'knee_extension_iso', 'isolation', 'beginner', 75, ['quads'], [], [g(1, ['leg-extension-machine', 'Leg Extension Machine'])]),
  ex('ex-standing-calf-raise', 'standing-calf-raise', 'Standing Calf Raise', 'legs', 'Legs', 'calf_raise', 'isolation', 'beginner', 70, ['calves'], [], [g(1, ['calf-raise-machine', 'Calf Raise Machine'], ['dumbbell', 'Dumbbells'])], true),
  ex('ex-bench-press', 'bench-press', 'Barbell Bench Press', 'chest', 'Chest', 'horizontal_push', 'compound', 'intermediate', 95, ['pecs'], ['front-delts', 'triceps'], [g(1, ['barbell', 'Barbell']), g(2, ['weight-plates', 'Weight Plates']), g(3, ['flat-bench', 'Flat Bench'])]),
  ex('ex-dumbbell-bench-press', 'dumbbell-bench-press', 'Dumbbell Bench Press', 'chest', 'Chest', 'horizontal_push', 'compound', 'beginner', 90, ['pecs'], ['front-delts', 'triceps'], [g(1, ['dumbbell', 'Dumbbells']), g(2, ['flat-bench', 'Flat Bench'])]),
  ex('ex-incline-dumbbell-press', 'incline-dumbbell-press', 'Incline Dumbbell Press', 'chest', 'Chest', 'horizontal_push', 'compound', 'intermediate', 85, ['pecs'], ['front-delts', 'triceps'], [g(1, ['dumbbell', 'Dumbbells']), g(2, ['adjustable-bench', 'Adjustable Bench'])]),
  ex('ex-push-up', 'push-up', 'Push-up', 'chest', 'Chest', 'horizontal_push', 'compound', 'beginner', 90, ['pecs'], ['front-delts', 'triceps', 'abs'], [], true),
  ex('ex-machine-chest-press', 'machine-chest-press', 'Machine Chest Press', 'chest', 'Chest', 'horizontal_push', 'compound', 'beginner', 75, ['pecs'], ['front-delts', 'triceps'], [g(1, ['chest-press-machine', 'Chest Press Machine'])]),
  ex('ex-overhead-press', 'overhead-press', 'Barbell Overhead Press', 'shoulders', 'Shoulders', 'vertical_push', 'compound', 'intermediate', 85, ['front-delts'], ['side-delts', 'triceps'], [g(1, ['barbell', 'Barbell']), g(2, ['weight-plates', 'Weight Plates'])]),
  ex('ex-seated-db-shoulder-press', 'seated-dumbbell-shoulder-press', 'Seated DB Shoulder Press', 'shoulders', 'Shoulders', 'vertical_push', 'compound', 'beginner', 85, ['front-delts'], ['side-delts', 'triceps'], [g(1, ['dumbbell', 'Dumbbells']), g(2, ['adjustable-bench', 'Adjustable Bench'])]),
  ex('ex-lateral-raise', 'lateral-raise', 'Dumbbell Lateral Raise', 'shoulders', 'Shoulders', 'shoulder_isolation', 'isolation', 'beginner', 85, ['side-delts'], [], [g(1, ['dumbbell', 'Dumbbells'], ['resistance-bands', 'Resistance Bands'])]),
  ex('ex-face-pull', 'face-pull', 'Face Pull', 'shoulders', 'Shoulders', 'shoulder_isolation', 'isolation', 'beginner', 70, ['rear-delts'], ['traps', 'rhomboids'], [g(1, ['cable-machine', 'Cable Machine / Crossover'], ['resistance-bands', 'Resistance Bands'])]),
  ex('ex-pull-up', 'pull-up', 'Pull-up', 'back', 'Back', 'vertical_pull', 'compound', 'advanced', 90, ['lats'], ['biceps', 'rhomboids', 'forearms'], [g(1, ['pull-up-bar', 'Pull-up Bar'])]),
  ex('ex-lat-pulldown', 'lat-pulldown', 'Lat Pulldown', 'back', 'Back', 'vertical_pull', 'compound', 'beginner', 90, ['lats'], ['biceps', 'rhomboids'], [g(1, ['lat-pulldown', 'Lat Pulldown Machine'])]),
  ex('ex-barbell-row', 'barbell-row', 'Barbell Bent-over Row', 'back', 'Back', 'horizontal_pull', 'compound', 'intermediate', 85, ['lats'], ['rhomboids', 'rear-delts', 'biceps', 'lower-back'], [g(1, ['barbell', 'Barbell']), g(2, ['weight-plates', 'Weight Plates'])]),
  ex('ex-dumbbell-row', 'dumbbell-row', 'One-Arm Dumbbell Row', 'back', 'Back', 'horizontal_pull', 'compound', 'beginner', 85, ['lats'], ['rhomboids', 'biceps'], [g(1, ['dumbbell', 'Dumbbells']), g(2, ['flat-bench', 'Flat Bench'])], false, true),
  ex('ex-seated-cable-row', 'seated-cable-row', 'Seated Cable Row', 'back', 'Back', 'horizontal_pull', 'compound', 'beginner', 80, ['rhomboids'], ['lats', 'biceps', 'rear-delts'], [g(1, ['seated-row-machine', 'Seated Cable Row'], ['cable-machine', 'Cable Machine / Crossover'])]),
  ex('ex-barbell-curl', 'barbell-curl', 'Barbell Curl', 'arms', 'Arms', 'elbow_flexion', 'isolation', 'beginner', 80, ['biceps'], ['forearms'], [g(1, ['barbell', 'Barbell'], ['ez-curl-bar', 'EZ-Curl Bar'])]),
  ex('ex-dumbbell-curl', 'dumbbell-curl', 'Dumbbell Curl', 'arms', 'Arms', 'elbow_flexion', 'isolation', 'beginner', 85, ['biceps'], ['forearms'], [g(1, ['dumbbell', 'Dumbbells'])]),
  ex('ex-triceps-pushdown', 'triceps-pushdown', 'Triceps Pushdown', 'arms', 'Arms', 'elbow_extension', 'isolation', 'beginner', 85, ['triceps'], [], [g(1, ['cable-machine', 'Cable Machine / Crossover'], ['resistance-bands', 'Resistance Bands'])]),
  ex('ex-skull-crusher', 'skull-crusher', 'Skull Crusher', 'arms', 'Arms', 'elbow_extension', 'isolation', 'intermediate', 70, ['triceps'], [], [g(1, ['ez-curl-bar', 'EZ-Curl Bar'], ['dumbbell', 'Dumbbells']), g(2, ['flat-bench', 'Flat Bench'])]),
  ex('ex-plank', 'plank', 'Plank', 'core', 'Core', 'core_stability', 'isolation', 'beginner', 85, ['abs'], ['obliques', 'lower-back'], [], true),
  ex('ex-hanging-leg-raise', 'hanging-leg-raise', 'Hanging Leg Raise', 'core', 'Core', 'core_flexion', 'isolation', 'advanced', 65, ['abs'], ['hip-flexors', 'obliques'], [g(1, ['pull-up-bar', 'Pull-up Bar'])]),
  ex('ex-cable-crunch', 'cable-crunch', 'Cable Crunch', 'core', 'Core', 'core_flexion', 'isolation', 'beginner', 60, ['abs'], ['obliques'], [g(1, ['cable-machine', 'Cable Machine / Crossover'])]),
  ex('ex-farmers-carry', 'farmers-carry', "Farmer's Carry", 'full-body', 'Full Body', 'carry', 'compound', 'beginner', 60, ['forearms'], ['traps', 'abs', 'glute-med'], [g(1, ['dumbbell', 'Dumbbells'], ['kettlebell', 'Kettlebell'])]),
  ex('ex-treadmill-run', 'treadmill-run', 'Treadmill Run', 'cardio', 'Cardio', 'cardio', 'compound', 'beginner', 80, ['quads'], ['calves', 'hamstrings'], [g(1, ['treadmill', 'Treadmill'])]),
];

const BY_SLUG = new Map(EXERCISES.map((e) => [e.slug, e]));
const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function mockExerciseBySlug(slug: string): ExerciseFull | undefined {
  return BY_SLUG.get(slug);
}
export function mockExerciseById(id: string): ExerciseFull | undefined {
  return BY_ID.get(id);
}
export function mockAllExercises(): ExerciseFull[] {
  return EXERCISES;
}

/** Distinct filter facets for the /exercises catalog. */
export const EXERCISE_CATEGORIES = [
  { slug: 'chest', name: 'Chest' },
  { slug: 'back', name: 'Back' },
  { slug: 'shoulders', name: 'Shoulders' },
  { slug: 'arms', name: 'Arms' },
  { slug: 'legs', name: 'Legs' },
  { slug: 'glutes', name: 'Glutes' },
  { slug: 'core', name: 'Core' },
  { slug: 'cardio', name: 'Cardio' },
  { slug: 'full-body', name: 'Full Body' },
];
export const EQUIPMENT_FACETS = [
  { slug: 'barbell', name: 'Barbell' },
  { slug: 'dumbbell', name: 'Dumbbells' },
  { slug: 'kettlebell', name: 'Kettlebell' },
  { slug: 'cable-machine', name: 'Cable Machine' },
  { slug: 'pull-up-bar', name: 'Pull-up Bar' },
  { slug: 'resistance-bands', name: 'Resistance Bands' },
  { slug: 'bodyweight', name: 'Bodyweight only' },
];
export const MUSCLE_FACETS = [
  { slug: 'pecs', name: 'Chest' },
  { slug: 'lats', name: 'Lats' },
  { slug: 'quads', name: 'Quads' },
  { slug: 'hamstrings', name: 'Hamstrings' },
  { slug: 'glute-max', name: 'Glutes' },
  { slug: 'biceps', name: 'Biceps' },
  { slug: 'triceps', name: 'Triceps' },
  { slug: 'front-delts', name: 'Front Delts' },
  { slug: 'side-delts', name: 'Side Delts' },
  { slug: 'abs', name: 'Abs' },
];

/* ------------------------------------------------------ mock search_exercises (§7.1 ranking) */
export function mockSearchExercises(q: string, limit = 8): ExerciseSearchRow[] {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  return EXERCISES.map((e) => {
    const name = e.name.toLowerCase();
    let score = 0;
    if (name === query) score += 100;
    if (name.startsWith(query)) score += 60;
    if (new RegExp(`\\b${escapeRe(query)}`).test(name)) score += 40;
    if (name.includes(query)) score += 20;
    score += e.popularity * 0.2;
    return { exercise_id: e.id, slug: e.slug, name: e.name, matched_alias: null, score };
  })
    .filter((r) => r.score > 15)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/* ------------------------------------------------ mock suggest_substitutes (§7.4 flavoured) */
const CURATED_SUBS: Record<string, [string, number, string][]> = {
  'bench-press': [
    ['dumbbell-bench-press', 92, 'Same horizontal push, uses dumbbells'],
    ['machine-chest-press', 85, 'Same movement pattern, uses the chest-press machine'],
    ['push-up', 70, 'Targets chest, no equipment needed'],
    ['incline-dumbbell-press', 70, 'Targets chest, uses dumbbells'],
  ],
  'barbell-back-squat': [
    ['goblet-squat', 85, 'Same squat pattern, uses dumbbells'],
    ['leg-press', 80, 'Targets quads, uses the leg-press machine'],
    ['bulgarian-split-squat', 70, 'Targets quads and glutes, uses dumbbells'],
    ['bodyweight-squat', 55, 'Same squat pattern, no equipment needed'],
  ],
  'overhead-press': [
    ['seated-dumbbell-shoulder-press', 90, 'Same vertical push, uses dumbbells'],
    ['lateral-raise', 45, 'Targets shoulders, uses dumbbells'],
  ],
  'pull-up': [
    ['lat-pulldown', 90, 'Same vertical pull, uses the lat-pulldown machine'],
    ['seated-cable-row', 60, 'Targets lats, uses a cable machine'],
  ],
  'conventional-deadlift': [
    ['romanian-deadlift', 85, 'Same hinge pattern, uses a barbell'],
    ['barbell-hip-thrust', 55, 'Targets glutes and hamstrings, uses a barbell'],
  ],
  'barbell-row': [
    ['dumbbell-row', 90, 'Same horizontal pull, uses dumbbells'],
    ['seated-cable-row', 85, 'Same horizontal pull, uses a cable machine'],
  ],
  'barbell-curl': [
    ['dumbbell-curl', 92, 'Same elbow flexion, uses dumbbells'],
  ],
  'triceps-pushdown': [
    ['skull-crusher', 80, 'Targets triceps, uses an EZ-curl bar'],
  ],
};

export function mockSuggestSubstitutes(exerciseId: string, limit = 5): SubstituteRow[] {
  const target = BY_ID.get(exerciseId);
  if (!target) return [];
  const curated = CURATED_SUBS[target.slug];
  if (curated) {
    return curated
      .map(([slug, score, reason]) => {
        const sub = BY_SLUG.get(slug);
        return sub
          ? { exercise_id: sub.id, slug: sub.slug, name: sub.name, score, reason }
          : null;
      })
      .filter((r): r is SubstituteRow => r !== null)
      .slice(0, limit);
  }
  // Fallback: same movement pattern, different exercise, ordered by popularity (§7.4 generated).
  return EXERCISES.filter(
    (e) => e.id !== target.id && e.movement_pattern === target.movement_pattern,
  )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map((e) => ({
      exercise_id: e.id,
      slug: e.slug,
      name: e.name,
      score: 40 + e.popularity * 0.2,
      reason: `Targets ${e.primary_muscles.join(', ')}, same movement pattern`,
    }));
}

/* ====================================================================================== */
/*  User plane — a single mock "current user" (blend of persona P2 "Gym-rat Gabe", §2.1)   */
/* ====================================================================================== */

export const MOCK_PROFILE: Profile = {
  display_name: 'Gabe',
  sex: 'male',
  birthdate: '1999-03-14',
  height_cm: 180,
  unit_system: 'metric',
  experience_level: 'advanced',
  primary_goal: 'hypertrophy',
  secondary_goal: 'strength',
  training_location: 'commercial_gym',
  days_per_week: 4,
  session_minutes: 60,
  preferred_days: [0, 1, 3, 4], // Mon, Tue, Thu, Fri
};

export const MOCK_NUTRITION_PROFILE: NutritionProfile = {
  diet_type: 'omnivore',
  allergies: [],
  meals_per_day: 3,
  kcal_target: 2600,
  protein_g_target: 195,
  carbs_g_target: 285,
  fat_g_target: 80,
  targets_source: 'suggested',
};

export function mockNutritionTargets(): NutritionTargets {
  return {
    kcal_target: MOCK_NUTRITION_PROFILE.kcal_target,
    protein_g_target: MOCK_NUTRITION_PROFILE.protein_g_target,
    carbs_g_target: MOCK_NUTRITION_PROFILE.carbs_g_target,
    fat_g_target: MOCK_NUTRITION_PROFILE.fat_g_target,
  };
}

/* ------------------------------------------------------------------ the active routine tree */
function rex(
  id: string,
  position: number,
  slug: string,
  sets: number,
  rep_min: number,
  rep_max: number,
  rest_seconds: number,
  target_rpe: number | null = 7,
  superset_group: number | null = null,
): RoutineExercise {
  const e = BY_SLUG.get(slug)!;
  return {
    id,
    position,
    exercise_id: e.id,
    exercise_slug: e.slug,
    exercise_name: e.name,
    image_path: e.image_path,
    sets,
    rep_min,
    rep_max,
    target_rpe,
    rest_seconds,
    superset_group,
    notes: null,
  };
}

export const MOCK_ROUTINE: Routine = {
  id: 'rt-active',
  name: 'Upper / Lower — Hypertrophy',
  description: 'A 4-day upper/lower split generated from your profile.',
  goal: 'hypertrophy',
  source: 'generated',
  is_active: true,
  start_date: '2026-07-06',
  days: [
    {
      id: 'day-a',
      day_index: 0,
      name: 'Day A — Upper',
      focus: 'Upper body',
      weekday: 0, // Mon
      exercises: [
        rex('rex-a1', 1, 'bench-press', 4, 6, 10, 120),
        rex('rex-a2', 2, 'barbell-row', 4, 8, 12, 120),
        rex('rex-a3', 3, 'overhead-press', 3, 8, 12, 90),
        rex('rex-a4', 4, 'lat-pulldown', 3, 10, 15, 90),
        rex('rex-a5', 5, 'dumbbell-curl', 3, 10, 15, 60, 8, 1),
        rex('rex-a6', 6, 'triceps-pushdown', 3, 10, 15, 60, 8, 1),
      ],
    },
    {
      id: 'day-b',
      day_index: 1,
      name: 'Day B — Lower',
      focus: 'Lower body',
      weekday: 1, // Tue
      exercises: [
        rex('rex-b1', 1, 'barbell-back-squat', 4, 6, 10, 150),
        rex('rex-b2', 2, 'romanian-deadlift', 3, 8, 12, 120),
        rex('rex-b3', 3, 'leg-press', 3, 10, 15, 90),
        rex('rex-b4', 4, 'leg-curl', 3, 10, 15, 60),
        rex('rex-b5', 5, 'standing-calf-raise', 4, 12, 20, 45),
        rex('rex-b6', 6, 'plank', 3, 30, 60, 45),
      ],
    },
    {
      id: 'day-c',
      day_index: 2,
      name: 'Day C — Upper',
      focus: 'Upper body',
      weekday: 3, // Thu
      exercises: [
        rex('rex-c1', 1, 'incline-dumbbell-press', 4, 8, 12, 120),
        rex('rex-c2', 2, 'seated-cable-row', 4, 10, 15, 90),
        rex('rex-c3', 3, 'seated-dumbbell-shoulder-press', 3, 8, 12, 90),
        rex('rex-c4', 4, 'pull-up', 3, 6, 10, 120),
        rex('rex-c5', 5, 'lateral-raise', 3, 12, 20, 45),
        rex('rex-c6', 6, 'face-pull', 3, 12, 20, 45),
      ],
    },
    {
      id: 'day-d',
      day_index: 3,
      name: 'Day D — Lower',
      focus: 'Lower body',
      weekday: 4, // Fri
      exercises: [
        rex('rex-d1', 1, 'conventional-deadlift', 3, 4, 6, 180),
        rex('rex-d2', 2, 'bulgarian-split-squat', 3, 8, 12, 90),
        rex('rex-d3', 3, 'barbell-hip-thrust', 3, 8, 12, 90),
        rex('rex-d4', 4, 'leg-extension', 3, 12, 20, 60),
        rex('rex-d5', 5, 'standing-calf-raise', 4, 12, 20, 45),
        rex('rex-d6', 6, 'hanging-leg-raise', 3, 8, 15, 60),
      ],
    },
  ],
};

export function mockActiveRoutine(): Routine {
  return MOCK_ROUTINE;
}

export const MOCK_ROUTINES_LIST: Pick<
  Routine,
  'id' | 'name' | 'description' | 'goal' | 'source' | 'is_active'
>[] = [
  {
    id: MOCK_ROUTINE.id,
    name: MOCK_ROUTINE.name,
    description: MOCK_ROUTINE.description,
    goal: MOCK_ROUTINE.goal,
    source: MOCK_ROUTINE.source,
    is_active: true,
  },
  {
    id: 'rt-ppl',
    name: 'Push / Pull / Legs',
    description: 'A 6-day PPL you built last month.',
    goal: 'hypertrophy',
    source: 'custom',
    is_active: false,
  },
  {
    id: 'rt-fullbody',
    name: 'Full Body A/B/C',
    description: 'A 3-day starter full-body plan.',
    goal: 'general_health',
    source: 'generated',
    is_active: false,
  },
];

export function mockRoutineById(id: string): Routine {
  if (id === MOCK_ROUTINE.id) return MOCK_ROUTINE;
  // For other ids, return a light clone so the editor renders coherently.
  const meta = MOCK_ROUTINES_LIST.find((r) => r.id === id) ?? MOCK_ROUTINES_LIST[0]!;
  return { ...MOCK_ROUTINE, id, name: meta.name, description: meta.description, is_active: meta.is_active, source: meta.source, goal: meta.goal };
}

/* ------------------------------------------------------------------------ workout / logging */
const PREV_SETS: Record<string, PreviousSet[]> = {
  'bench-press': [
    { set_number: 1, reps: 8, weight_kg: 80, rpe: 7 },
    { set_number: 2, reps: 8, weight_kg: 80, rpe: 8 },
    { set_number: 3, reps: 7, weight_kg: 80, rpe: 9 },
    { set_number: 4, reps: 6, weight_kg: 80, rpe: 9.5 },
  ],
  'barbell-row': [
    { set_number: 1, reps: 10, weight_kg: 70, rpe: 7 },
    { set_number: 2, reps: 10, weight_kg: 70, rpe: 8 },
    { set_number: 3, reps: 9, weight_kg: 70, rpe: 8 },
    { set_number: 4, reps: 8, weight_kg: 70, rpe: 9 },
  ],
  'barbell-back-squat': [
    { set_number: 1, reps: 8, weight_kg: 110, rpe: 7 },
    { set_number: 2, reps: 8, weight_kg: 110, rpe: 8 },
    { set_number: 3, reps: 7, weight_kg: 110, rpe: 9 },
    { set_number: 4, reps: 6, weight_kg: 110, rpe: 9 },
  ],
};

export function mockPreviousSets(exerciseSlug: string, sets: number): PreviousSet[] {
  const stored = PREV_SETS[exerciseSlug];
  if (stored) return stored.slice(0, sets);
  return [];
}

/** Look up the routine day whose id matches; used by the workout player. */
export function mockRoutineDay(dayId: string): RoutineDay | undefined {
  return MOCK_ROUTINE.days.find((d) => d.id === dayId);
}

/* ----------------------------------------------------------------------------- nutrition */
export const FOODS: FoodSearchRow[] = [
  { food_id: 'f-chicken', slug: 'chicken-breast', name: 'Chicken Breast, cooked', brand: null, kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, serving_name: '1 breast', serving_grams: 120, score: 0 },
  { food_id: 'f-salmon', slug: 'salmon', name: 'Atlantic Salmon, cooked', brand: null, kcal: 208, protein_g: 20, carbs_g: 0, fat_g: 13, serving_name: '1 fillet', serving_grams: 150, score: 0 },
  { food_id: 'f-beef', slug: 'ground-beef-90', name: 'Ground Beef 90/10, cooked', brand: null, kcal: 217, protein_g: 26, carbs_g: 0, fat_g: 12, serving_name: '100 g', serving_grams: 100, score: 0 },
  { food_id: 'f-egg', slug: 'egg', name: 'Whole Egg', brand: null, kcal: 143, protein_g: 12.6, carbs_g: 0.7, fat_g: 9.5, serving_name: '1 large', serving_grams: 50, score: 0 },
  { food_id: 'f-eggwhite', slug: 'egg-white', name: 'Egg Whites', brand: null, kcal: 52, protein_g: 10.9, carbs_g: 0.7, fat_g: 0.2, serving_name: '3 tbsp', serving_grams: 46, score: 0 },
  { food_id: 'f-tofu', slug: 'tofu-firm', name: 'Firm Tofu', brand: null, kcal: 144, protein_g: 17, carbs_g: 3, fat_g: 8, serving_name: '½ block', serving_grams: 126, score: 0 },
  { food_id: 'f-whey', slug: 'whey-protein', name: 'Whey Protein Powder', brand: null, kcal: 375, protein_g: 75, carbs_g: 12.5, fat_g: 6, serving_name: '1 scoop', serving_grams: 32, score: 0 },
  { food_id: 'f-greek', slug: 'greek-yogurt-nonfat', name: 'Greek Yogurt, nonfat', brand: null, kcal: 59, protein_g: 10.3, carbs_g: 3.6, fat_g: 0.4, serving_name: '1 cup', serving_grams: 170, score: 0 },
  { food_id: 'f-cottage', slug: 'cottage-cheese-2', name: 'Cottage Cheese 2%', brand: null, kcal: 84, protein_g: 11, carbs_g: 4.3, fat_g: 2.3, serving_name: '½ cup', serving_grams: 113, score: 0 },
  { food_id: 'f-rice', slug: 'white-rice', name: 'White Rice, cooked', brand: null, kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, serving_name: '1 cup', serving_grams: 158, score: 0 },
  { food_id: 'f-brownrice', slug: 'brown-rice', name: 'Brown Rice, cooked', brand: null, kcal: 112, protein_g: 2.3, carbs_g: 24, fat_g: 0.8, serving_name: '1 cup', serving_grams: 195, score: 0 },
  { food_id: 'f-oats', slug: 'oats', name: 'Rolled Oats, dry', brand: null, kcal: 379, protein_g: 13.2, carbs_g: 67.7, fat_g: 6.5, serving_name: '½ cup', serving_grams: 40, score: 0 },
  { food_id: 'f-sweetpotato', slug: 'sweet-potato', name: 'Sweet Potato, baked', brand: null, kcal: 90, protein_g: 2, carbs_g: 20.7, fat_g: 0.2, serving_name: '1 medium', serving_grams: 130, score: 0 },
  { food_id: 'f-banana', slug: 'banana', name: 'Banana', brand: null, kcal: 89, protein_g: 1.1, carbs_g: 22.8, fat_g: 0.3, serving_name: '1 medium', serving_grams: 118, score: 0 },
  { food_id: 'f-apple', slug: 'apple', name: 'Apple', brand: null, kcal: 52, protein_g: 0.3, carbs_g: 13.8, fat_g: 0.2, serving_name: '1 medium', serving_grams: 182, score: 0 },
  { food_id: 'f-blueberries', slug: 'blueberries', name: 'Blueberries', brand: null, kcal: 57, protein_g: 0.7, carbs_g: 14.5, fat_g: 0.3, serving_name: '1 cup', serving_grams: 148, score: 0 },
  { food_id: 'f-avocado', slug: 'avocado', name: 'Avocado', brand: null, kcal: 160, protein_g: 2, carbs_g: 8.5, fat_g: 14.7, serving_name: '½ fruit', serving_grams: 100, score: 0 },
  { food_id: 'f-oliveoil', slug: 'olive-oil', name: 'Olive Oil', brand: null, kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, serving_name: '1 tbsp', serving_grams: 13.5, score: 0 },
  { food_id: 'f-almonds', slug: 'almonds', name: 'Almonds', brand: null, kcal: 579, protein_g: 21.2, carbs_g: 21.6, fat_g: 49.9, serving_name: '¼ cup', serving_grams: 35, score: 0 },
  { food_id: 'f-pb', slug: 'peanut-butter', name: 'Peanut Butter', brand: null, kcal: 588, protein_g: 25, carbs_g: 20, fat_g: 50, serving_name: '2 tbsp', serving_grams: 32, score: 0 },
  { food_id: 'f-lentils', slug: 'lentils', name: 'Lentils, cooked', brand: null, kcal: 116, protein_g: 9, carbs_g: 20.1, fat_g: 0.4, serving_name: '1 cup', serving_grams: 198, score: 0 },
  { food_id: 'f-blackbeans', slug: 'black-beans', name: 'Black Beans, cooked', brand: null, kcal: 132, protein_g: 8.9, carbs_g: 23.7, fat_g: 0.5, serving_name: '1 cup', serving_grams: 172, score: 0 },
];

const FOOD_BY_ID = new Map(FOODS.map((f) => [f.food_id, f]));

export function mockFoodById(id: string): FoodSearchRow | undefined {
  return FOOD_BY_ID.get(id);
}

export function mockSearchFoods(q: string, limit = 8): FoodSearchRow[] {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  return FOODS.map((f) => {
    const name = f.name.toLowerCase();
    let score = 0;
    if (name === query) score += 100;
    if (name.startsWith(query)) score += 60;
    if (new RegExp(`\\b${escapeRe(query)}`).test(name)) score += 40;
    if (name.includes(query)) score += 20;
    score += 5; // verified
    return { ...f, score };
  })
    .filter((r) => r.score > 15)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export const RECENT_FOODS: FoodSearchRow[] = [
  FOOD_BY_ID.get('f-chicken')!,
  FOOD_BY_ID.get('f-rice')!,
  FOOD_BY_ID.get('f-greek')!,
  FOOD_BY_ID.get('f-banana')!,
];

/** Compute macro snapshot for `quantity_g` of a food (mirrors server-side `log_food`). */
export function computeMacros(food: FoodSearchRow, quantityG: number) {
  const factor = quantityG / 100;
  return {
    kcal: round1(food.kcal * factor),
    protein_g: round1(food.protein_g * factor),
    carbs_g: round1(food.carbs_g * factor),
    fat_g: round1(food.fat_g * factor),
  };
}

export const MOCK_TODAY_LOGS: NutritionLog[] = [
  logRow('nl-1', 'breakfast', 'f-oats', 80),
  logRow('nl-2', 'breakfast', 'f-greek', 170),
  logRow('nl-3', 'breakfast', 'f-blueberries', 148),
  logRow('nl-4', 'lunch', 'f-chicken', 180),
  logRow('nl-5', 'lunch', 'f-rice', 200),
  logRow('nl-6', 'lunch', 'f-avocado', 50),
  logRow('nl-7', 'snack', 'f-whey', 32),
  logRow('nl-8', 'snack', 'f-banana', 118),
];

function logRow(id: string, slot: MealSlot, foodId: string, qty: number): NutritionLog {
  const food = FOOD_BY_ID.get(foodId)!;
  const m = computeMacros(food, qty);
  return {
    id,
    logged_on: todayISO(),
    meal_slot: slot,
    food_id: foodId,
    custom_name: food.name,
    quantity_g: qty,
    ...m,
  };
}

export function mockDailyNutrition(): DailyNutrition {
  return MOCK_TODAY_LOGS.reduce<DailyNutrition>(
    (acc, l) => ({
      logged_on: todayISO(),
      kcal: round1(acc.kcal + l.kcal),
      protein_g: round1(acc.protein_g + l.protein_g),
      carbs_g: round1(acc.carbs_g + l.carbs_g),
      fat_g: round1(acc.fat_g + l.fat_g),
    }),
    { logged_on: todayISO(), kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

export const MEAL_SLOTS: { slot: MealSlot; label: string; icon: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: '\u{1F373}' },
  { slot: 'lunch', label: 'Lunch', icon: '\u{1F957}' },
  { slot: 'dinner', label: 'Dinner', icon: '\u{1F37D}\u{FE0F}' },
  { slot: 'snack', label: 'Snack', icon: '\u{1F34E}' },
];

export const MOCK_MEAL_TEMPLATES: MealTemplate[] = [
  {
    id: 'm-shake',
    name: 'Post-workout shake',
    items: [
      { food_id: 'f-whey', food_name: 'Whey Protein Powder', quantity_g: 32 },
      { food_id: 'f-banana', food_name: 'Banana', quantity_g: 118 },
    ],
  },
  {
    id: 'm-breakfast',
    name: 'Go-to breakfast',
    items: [
      { food_id: 'f-oats', food_name: 'Rolled Oats, dry', quantity_g: 80 },
      { food_id: 'f-greek', food_name: 'Greek Yogurt, nonfat', quantity_g: 170 },
      { food_id: 'f-blueberries', food_name: 'Blueberries', quantity_g: 148 },
    ],
  },
];

/* ----------------------------------------------------------------------------- progress */
export const MOCK_BODY_METRICS: BodyMetric[] = buildWeightSeries();

function buildWeightSeries(): BodyMetric[] {
  // 12 weekly points trending gently down from 84.2 → 82.1 kg.
  const start = new Date('2026-05-03T00:00:00Z');
  const weights = [84.2, 84.0, 83.9, 83.5, 83.6, 83.2, 83.0, 82.9, 82.6, 82.4, 82.3, 82.1];
  return weights.map((w, i) => {
    const d = new Date(start.getTime() + i * 7 * 86400000);
    return { measured_on: d.toISOString().slice(0, 10), weight_kg: w };
  });
}

export function mockWeightSparkline(): number[] {
  return MOCK_BODY_METRICS.map((b) => b.weight_kg ?? 0);
}

export const MOCK_PRS: ExercisePR[] = [
  pr('bench-press', 100, 8),
  pr('barbell-back-squat', 140, 5),
  pr('conventional-deadlift', 180, 3),
  pr('overhead-press', 60, 6),
  pr('barbell-row', 90, 8),
  pr('romanian-deadlift', 120, 8),
  pr('lat-pulldown', 75, 10),
  pr('barbell-curl', 40, 10),
];

function pr(slug: string, weight: number, reps: number): ExercisePR {
  const e = BY_SLUG.get(slug)!;
  const e1rm = Math.round(weight * (1 + reps / 30));
  return {
    exercise_id: e.id,
    exercise_slug: e.slug,
    exercise_name: e.name,
    best_e1rm: e1rm,
    best_weight_kg: weight,
    best_reps: reps,
  };
}

export const MOCK_PHOTOS: ProgressPhoto[] = [
  { id: 'p1', taken_on: '2026-05-03', pose: 'front', storage_path: 'mock/front-1.jpg' },
  { id: 'p2', taken_on: '2026-05-03', pose: 'side', storage_path: 'mock/side-1.jpg' },
  { id: 'p3', taken_on: '2026-06-07', pose: 'front', storage_path: 'mock/front-2.jpg' },
  { id: 'p4', taken_on: '2026-06-07', pose: 'side', storage_path: 'mock/side-2.jpg' },
  { id: 'p5', taken_on: '2026-07-12', pose: 'front', storage_path: 'mock/front-3.jpg' },
  { id: 'p6', taken_on: '2026-07-12', pose: 'back', storage_path: 'mock/back-1.jpg' },
];

export const MOCK_MEASUREMENTS = [
  { key: 'waist_cm', label: 'Waist', series: [88, 87.5, 87, 86.4, 86, 85.6] },
  { key: 'chest_cm', label: 'Chest', series: [104, 104.4, 104.8, 105.1, 105.3, 105.6] },
  { key: 'arm_cm', label: 'Arm', series: [38.5, 38.7, 38.9, 39.1, 39.2, 39.4] },
];

export const MOCK_STREAK = 5;

/* ------------------------------------------------------------------------- date helpers */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Map JS `Date.getDay()` (0=Sun … 6=Sat) → blueprint weekday (0=Mon … 6=Sun). */
export function blueprintWeekday(d = new Date()): number {
  return (d.getDay() + 6) % 7;
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Default meal slot by time of day (§2.3): <10:30 breakfast, <15:00 lunch, <21:00 dinner, else snack. */
export function defaultMealSlot(d = new Date()): MealSlot {
  const mins = d.getHours() * 60 + d.getMinutes();
  if (mins < 10 * 60 + 30) return 'breakfast';
  if (mins < 15 * 60) return 'lunch';
  if (mins < 21 * 60) return 'dinner';
  return 'snack';
}

/** Find today's routine day from the active routine via weekday mapping (§2.3). */
export function todaysRoutineDay(routine: Routine, d = new Date()): RoutineDay | null {
  const wd = blueprintWeekday(d);
  return routine.days.find((day) => day.weekday === wd) ?? null;
}

/* ------------------------------------------------------------------------- tiny utils */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
