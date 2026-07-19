import type { SupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@fitforge/shared/types';
import type { OnboardingStep } from '@fitforge/shared/schemas';
import type { OnboardingDraft } from '@/components/onboarding/types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Write-through persistence per onboarding step (§2.2 "write-through to Supabase after each
 * step"). Every commit also advances `profiles.onboarding_step` to `nextStep` so an interrupted
 * flow resumes at the right screen. All user tables are RLS-scoped to auth.uid(); we never pass
 * other users' ids.
 *
 * Re-saving a step is idempotent: list-backed steps (favorites, exclusions) delete-then-insert
 * their slice so removing an item on a back-and-forth is honoured.
 */

async function patchProfile(supabase: SupabaseBrowserClient, userId: string, patch: ProfileUpdate) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export type StepCommitter = (
  supabase: SupabaseBrowserClient,
  userId: string,
  draft: OnboardingDraft,
  nextStep: OnboardingStep,
) => Promise<void>;

const commitGoals: StepCommitter = async (supabase, userId, draft, nextStep) => {
  await patchProfile(supabase, userId, {
    primary_goal: draft.primary_goal,
    secondary_goal: draft.secondary_goal,
    onboarding_step: nextStep,
  });
};

const commitExperience: StepCommitter = async (supabase, userId, draft, nextStep) => {
  await patchProfile(supabase, userId, {
    experience_level: draft.experience_level,
    onboarding_step: nextStep,
  });
};

const commitSchedule: StepCommitter = async (supabase, userId, draft, nextStep) => {
  await patchProfile(supabase, userId, {
    days_per_week: draft.days_per_week,
    session_minutes: draft.session_minutes,
    preferred_days: draft.preferred_days,
    onboarding_step: nextStep,
  });
};

const commitLocation: StepCommitter = async (supabase, userId, draft, nextStep) => {
  await patchProfile(supabase, userId, {
    training_location: draft.training_location,
    onboarding_step: nextStep,
  });
};

const commitEquipment: StepCommitter = async (supabase, userId, draft, nextStep) => {
  // Transactional replace via the §5.3 RPC (single source of truth for the join rows).
  const { error } = await supabase.rpc('set_user_equipment', {
    equipment_slugs: draft.equipment_slugs,
  });
  if (error) throw error;
  await patchProfile(supabase, userId, { onboarding_step: nextStep });
};

const commitExercisePrefs: StepCommitter = async (supabase, userId, draft, nextStep) => {
  // replace this user's favorites
  const del = await supabase
    .from('user_exercise_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('preference', 'favorite');
  if (del.error) throw del.error;

  if (draft.favorites.length > 0) {
    const rows = draft.favorites.map((f) => ({
      user_id: userId,
      exercise_id: f.id,
      preference: 'favorite' as const,
    }));
    const ins = await supabase.from('user_exercise_preferences').upsert(rows, {
      onConflict: 'user_id,exercise_id',
    });
    if (ins.error) throw ins.error;
  }
  await patchProfile(supabase, userId, { onboarding_step: nextStep });
};

const commitExclusions: StepCommitter = async (supabase, userId, draft, nextStep) => {
  // 1. movement-pattern exclusions — full replace
  const delMove = await supabase.from('user_movement_exclusions').delete().eq('user_id', userId);
  if (delMove.error) throw delMove.error;
  if (draft.movement_exclusions.length > 0) {
    const rows = draft.movement_exclusions.map((m) => ({
      user_id: userId,
      movement_pattern: m.movement_pattern,
      reason: m.reason,
      source_body_area: m.source_body_area,
    }));
    const insMove = await supabase.from('user_movement_exclusions').upsert(rows, {
      onConflict: 'user_id,movement_pattern',
    });
    if (insMove.error) throw insMove.error;
  }

  // 2. excluded exercises — replace this user's excluded rows
  const delEx = await supabase
    .from('user_exercise_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('preference', 'excluded');
  if (delEx.error) throw delEx.error;
  if (draft.excluded_exercises.length > 0) {
    const rows = draft.excluded_exercises.map((e) => ({
      user_id: userId,
      exercise_id: e.id,
      preference: 'excluded' as const,
      exclusion_reason: e.exclusion_reason,
      preferred_substitute_id: e.preferred_substitute_id,
    }));
    const insEx = await supabase.from('user_exercise_preferences').upsert(rows, {
      onConflict: 'user_id,exercise_id',
    });
    if (insEx.error) throw insEx.error;
  }
  await patchProfile(supabase, userId, { onboarding_step: nextStep });
};

const commitBodyMetrics: StepCommitter = async (supabase, userId, draft, nextStep) => {
  await patchProfile(supabase, userId, {
    sex: draft.sex,
    birthdate: draft.birthdate,
    height_cm: draft.height_cm,
    unit_system: draft.unit_system,
    onboarding_step: nextStep,
  });
  // A current weight, if given, becomes today's body_metrics row (feeds macro calc §7.2.4).
  if (draft.weight_kg != null) {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('body_metrics').upsert(
      { user_id: userId, measured_on: today, weight_kg: draft.weight_kg },
      { onConflict: 'user_id,measured_on' },
    );
    if (error) throw error;
  }
};

const commitNutritionPrefs: StepCommitter = async (supabase, userId, draft, nextStep) => {
  const up = await supabase.from('nutrition_profiles').upsert(
    {
      user_id: userId,
      diet_type: draft.diet_type,
      allergies: draft.allergies,
      meals_per_day: draft.meals_per_day,
    },
    { onConflict: 'user_id' },
  );
  if (up.error) throw up.error;

  // foods to avoid → user_food_preferences(excluded); replace the excluded slice
  const del = await supabase
    .from('user_food_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('preference', 'excluded');
  if (del.error) throw del.error;
  if (draft.avoid_foods.length > 0) {
    const rows = draft.avoid_foods.map((f) => ({
      user_id: userId,
      food_id: f.id,
      preference: 'excluded' as const,
    }));
    const ins = await supabase.from('user_food_preferences').upsert(rows, {
      onConflict: 'user_id,food_id',
    });
    if (ins.error) throw ins.error;
  }
  await patchProfile(supabase, userId, { onboarding_step: nextStep });
};

const commitTargetsReview: StepCommitter = async (supabase, userId, draft, nextStep) => {
  const up = await supabase.from('nutrition_profiles').upsert(
    {
      user_id: userId,
      diet_type: draft.diet_type,
      allergies: draft.allergies,
      meals_per_day: draft.meals_per_day,
      kcal_target: draft.kcal_target,
      protein_g_target: draft.protein_g_target,
      carbs_g_target: draft.carbs_g_target,
      fat_g_target: draft.fat_g_target,
      targets_source: draft.targets_source,
    },
    { onConflict: 'user_id' },
  );
  if (up.error) throw up.error;
  await patchProfile(supabase, userId, { onboarding_step: nextStep });
};

/**
 * Screen 12 — build the starter routine tree from the completed profile (§7.5 RPC). Deactivates
 * any prior active routine and returns the new routine id. Called when the plan preview mounts so
 * the user sees the real generated plan before committing.
 */
export async function generateStarterRoutine(
  supabase: SupabaseBrowserClient,
  name: string | null = null,
): Promise<string> {
  const { data, error } = await supabase.rpc('generate_starter_routine', { p_name: name });
  if (error) throw error;
  return data as string;
}

/**
 * Finish onboarding: stamp the §2.2 completion contract (`onboarding_completed_at`) and point the
 * resume marker at `done`. The active routine already exists from `generateStarterRoutine`.
 */
export async function finalizeOnboarding(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<void> {
  await patchProfile(supabase, userId, {
    onboarding_step: 'done',
    onboarding_completed_at: new Date().toISOString(),
  });
}

export const STEP_COMMITTERS: Partial<Record<OnboardingStep, StepCommitter>> = {
  goals: commitGoals,
  experience: commitExperience,
  schedule: commitSchedule,
  location: commitLocation,
  equipment: commitEquipment,
  exercise_prefs: commitExercisePrefs,
  exclusions: commitExclusions,
  body_metrics: commitBodyMetrics,
  nutrition_prefs: commitNutritionPrefs,
  targets_review: commitTargetsReview,
};
