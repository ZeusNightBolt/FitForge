-- RLS must be enabled on every table in both planes (§4.4).
begin;
create extension if not exists pgtap;

select plan(25);

select ok(
  (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass),
  'RLS enabled on public.' || t
)
from unnest(array[
  -- catalog (9)
  'equipment','muscle_groups','muscles','exercise_categories','exercises',
  'exercise_muscles','exercise_equipment','exercise_substitutions','foods',
  -- user (16)
  'profiles','user_equipment','user_exercise_preferences','user_movement_exclusions',
  'nutrition_profiles','user_food_preferences','routines','routine_days',
  'routine_exercises','workout_sessions','set_logs','meals','meal_items',
  'nutrition_logs','body_metrics','progress_photos'
]) as t;

select * from finish();
rollback;
