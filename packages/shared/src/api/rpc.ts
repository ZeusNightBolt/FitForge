/**
 * Typed wrappers for every §5.3 RPC (`POST /rest/v1/rpc/{name}`).
 *
 * Each wrapper is a thin, fully-typed call over a Supabase client. The client is accepted
 * structurally (`RpcCapableClient`) so this module has no hard runtime dependency on
 * `@supabase/supabase-js`; pass a `SupabaseClient<Database>` at the call site.
 *
 * FUTURE-AI SEAM (§5.3): clients call only these names. An AI implementation must keep the
 * signatures identical.
 */
import type {
  Database,
  FunctionArgs,
  FunctionReturns,
  MealSlot,
  GoalType,
  ExperienceLevel,
} from '../types/database.js';

/** The RPC name literal set exposed by the backend (§5.3). */
export const RPC_NAMES = [
  'search_exercises',
  'search_foods',
  'suggest_substitutes',
  'suggest_nutrition_targets',
  'suggest_onboarding_defaults',
  'generate_starter_routine',
  'onboarding_status',
  'set_user_equipment',
  'log_food',
  'previous_sets',
] as const;
export type RpcName = (typeof RPC_NAMES)[number];

type Fns = Database['public']['Functions'];

/** Minimal shape of `supabase.rpc(...)` we depend on. */
export interface RpcResult<T> {
  data: T | null;
  error: { message: string; details?: string; hint?: string; code?: string } | null;
}

export interface RpcCapableClient {
  rpc<Name extends RpcName>(
    fn: Name,
    args?: FunctionArgs<Name>,
  ): PromiseLike<RpcResult<FunctionReturns<Name>>>;
}

/** Unwrap a Supabase `{ data, error }` result, throwing on error. */
async function unwrap<T>(p: PromiseLike<RpcResult<T>>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`RPC failed: ${error.message}`);
  return data as T;
}

/* ---------------------------------------------------------------- search */

export function searchExercises(
  client: RpcCapableClient,
  args: Fns['search_exercises']['Args'],
): Promise<Fns['search_exercises']['Returns']> {
  return unwrap(client.rpc('search_exercises', args));
}

export function searchFoods(
  client: RpcCapableClient,
  args: Fns['search_foods']['Args'],
): Promise<Fns['search_foods']['Returns']> {
  return unwrap(client.rpc('search_foods', args));
}

/* ---------------------------------------------------------------- suggestions */

export function suggestSubstitutesRpc(
  client: RpcCapableClient,
  args: Fns['suggest_substitutes']['Args'],
): Promise<Fns['suggest_substitutes']['Returns']> {
  return unwrap(client.rpc('suggest_substitutes', args));
}

export function suggestNutritionTargets(
  client: RpcCapableClient,
): Promise<Fns['suggest_nutrition_targets']['Returns']> {
  return unwrap(client.rpc('suggest_nutrition_targets', {}));
}

export function suggestOnboardingDefaultsRpc(
  client: RpcCapableClient,
  p_goal: GoalType,
  p_experience: ExperienceLevel,
): Promise<Fns['suggest_onboarding_defaults']['Returns']> {
  return unwrap(client.rpc('suggest_onboarding_defaults', { p_goal, p_experience }));
}

/* ---------------------------------------------------------------- routine / onboarding */

export function generateStarterRoutine(
  client: RpcCapableClient,
  p_name?: string | null,
): Promise<Fns['generate_starter_routine']['Returns']> {
  return unwrap(client.rpc('generate_starter_routine', { p_name: p_name ?? null }));
}

export function onboardingStatus(
  client: RpcCapableClient,
): Promise<Fns['onboarding_status']['Returns']> {
  return unwrap(client.rpc('onboarding_status', {}));
}

export function setUserEquipment(
  client: RpcCapableClient,
  equipment_slugs: string[],
): Promise<Fns['set_user_equipment']['Returns']> {
  return unwrap(client.rpc('set_user_equipment', { equipment_slugs }));
}

/* ---------------------------------------------------------------- logging */

export function logFood(
  client: RpcCapableClient,
  args: {
    p_food_id: string;
    p_quantity_g: number;
    p_meal_slot: MealSlot;
    p_logged_on?: string | null;
  },
): Promise<Fns['log_food']['Returns']> {
  return unwrap(
    client.rpc('log_food', {
      p_food_id: args.p_food_id,
      p_quantity_g: args.p_quantity_g,
      p_meal_slot: args.p_meal_slot,
      p_logged_on: args.p_logged_on ?? null,
    }),
  );
}

export function previousSets(
  client: RpcCapableClient,
  p_exercise_id: string,
): Promise<Fns['previous_sets']['Returns']> {
  return unwrap(client.rpc('previous_sets', { p_exercise_id }));
}
