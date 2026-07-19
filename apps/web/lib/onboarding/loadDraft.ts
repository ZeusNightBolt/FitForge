import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@fitforge/shared/types';
import type { BodyArea } from '@fitforge/shared/types';
import type {
  OnboardingDraft,
  NamedRef,
  DraftExcludedExercise,
  DraftMovementExclusion,
} from '@/components/onboarding/types';

type DB = SupabaseClient<Database>;

/**
 * Rehydrate the onboarding draft from whatever has already been written for this user, so a
 * resumed / interrupted flow shows prior answers and "back never loses data" survives reloads
 * (§2.2). Runs server-side in the onboarding layout.
 */
export async function loadInitialDraft(supabase: DB, userId: string): Promise<Partial<OnboardingDraft>> {
  const draft: Partial<OnboardingDraft> = {};

  const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (p) {
    draft.primary_goal = p.primary_goal;
    draft.secondary_goal = p.secondary_goal;
    draft.experience_level = p.experience_level;
    draft.days_per_week = p.days_per_week;
    draft.session_minutes = p.session_minutes;
    draft.preferred_days = p.preferred_days ?? [];
    draft.training_location = p.training_location;
    draft.sex = p.sex;
    draft.birthdate = p.birthdate;
    draft.height_cm = p.height_cm;
    draft.unit_system = p.unit_system;
  }

  const { data: np } = await supabase
    .from('nutrition_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (np) {
    draft.diet_type = np.diet_type;
    draft.allergies = np.allergies ?? [];
    draft.meals_per_day = np.meals_per_day;
    draft.kcal_target = np.kcal_target;
    draft.protein_g_target = np.protein_g_target;
    draft.carbs_g_target = np.carbs_g_target;
    draft.fat_g_target = np.fat_g_target;
    draft.targets_source = np.targets_source;
  }

  const { data: bm } = await supabase
    .from('body_metrics')
    .select('weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (bm?.weight_kg != null) draft.weight_kg = Number(bm.weight_kg);

  const { data: equip } = await supabase
    .from('user_equipment')
    .select('equipment(slug)')
    .eq('user_id', userId);
  if (equip) {
    draft.equipment_slugs = equip
      .map((r) => (r.equipment as unknown as { slug: string } | null)?.slug)
      .filter((s): s is string => Boolean(s));
  }

  const { data: prefs } = await supabase
    .from('user_exercise_preferences')
    .select('exercise_id, preference, exclusion_reason, preferred_substitute_id, exercises(slug,name)')
    .eq('user_id', userId);
  if (prefs) {
    const favorites: NamedRef[] = [];
    const excluded: DraftExcludedExercise[] = [];
    for (const row of prefs) {
      const ex = row.exercises as unknown as { slug: string; name: string } | null;
      const ref = { id: row.exercise_id, slug: ex?.slug ?? '', name: ex?.name ?? '' };
      if (row.preference === 'favorite') {
        favorites.push(ref);
      } else {
        excluded.push({
          ...ref,
          exclusion_reason: row.exclusion_reason ?? 'dislike',
          preferred_substitute_id: row.preferred_substitute_id,
        });
      }
    }
    draft.favorites = favorites;
    draft.excluded_exercises = excluded;
  }

  const { data: moves } = await supabase
    .from('user_movement_exclusions')
    .select('movement_pattern, reason, source_body_area')
    .eq('user_id', userId);
  if (moves) {
    draft.body_areas = [
      ...new Set(
        moves
          .map((m) => m.source_body_area)
          .filter((a): a is BodyArea => Boolean(a)),
      ),
    ];
    draft.movement_exclusions = moves.map(
      (m): DraftMovementExclusion => ({
        movement_pattern: m.movement_pattern,
        reason: m.reason,
        source_body_area: (m.source_body_area as BodyArea | null) ?? null,
        soft: false,
      }),
    );
  }

  return draft;
}
