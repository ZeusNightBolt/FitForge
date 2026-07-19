-- Schema smoke test: every catalog + user table from §4.2/§4.3 exists.
begin;
create extension if not exists pgtap;

select plan(25);

-- Catalog plane (9)
select has_table('public', 'equipment',              'equipment table exists');
select has_table('public', 'muscle_groups',          'muscle_groups table exists');
select has_table('public', 'muscles',                'muscles table exists');
select has_table('public', 'exercise_categories',    'exercise_categories table exists');
select has_table('public', 'exercises',              'exercises table exists');
select has_table('public', 'exercise_muscles',       'exercise_muscles table exists');
select has_table('public', 'exercise_equipment',     'exercise_equipment table exists');
select has_table('public', 'exercise_substitutions', 'exercise_substitutions table exists');
select has_table('public', 'foods',                  'foods table exists');

-- User plane (16)
select has_table('public', 'profiles',                  'profiles table exists');
select has_table('public', 'user_equipment',            'user_equipment table exists');
select has_table('public', 'user_exercise_preferences', 'user_exercise_preferences table exists');
select has_table('public', 'user_movement_exclusions',  'user_movement_exclusions table exists');
select has_table('public', 'nutrition_profiles',        'nutrition_profiles table exists');
select has_table('public', 'user_food_preferences',     'user_food_preferences table exists');
select has_table('public', 'routines',                  'routines table exists');
select has_table('public', 'routine_days',              'routine_days table exists');
select has_table('public', 'routine_exercises',         'routine_exercises table exists');
select has_table('public', 'workout_sessions',          'workout_sessions table exists');
select has_table('public', 'set_logs',                  'set_logs table exists');
select has_table('public', 'meals',                     'meals table exists');
select has_table('public', 'meal_items',                'meal_items table exists');
select has_table('public', 'nutrition_logs',            'nutrition_logs table exists');
select has_table('public', 'body_metrics',              'body_metrics table exists');
select has_table('public', 'progress_photos',           'progress_photos table exists');

select * from finish();
rollback;
