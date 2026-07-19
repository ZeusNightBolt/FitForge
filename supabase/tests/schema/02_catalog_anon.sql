-- anon can SELECT catalog tables (world-readable) but sees no rows in user tables.
begin;
create extension if not exists pgtap;

select plan(10);

-- Seed a minimal fixture across all 9 catalog tables as the (superuser) test
-- role, which bypasses RLS. Fixed uuids keep FK wiring explicit.
insert into public.equipment (id, slug, name, category)
  values ('e0000000-0000-0000-0000-000000000001', 'test-dumbbell', 'Test Dumbbell', 'free_weights');

insert into public.muscle_groups (id, slug, name, region)
  values ('60000000-0000-0000-0000-000000000001', 'test-chest', 'Test Chest', 'upper');

insert into public.muscles (id, slug, name, muscle_group_id)
  values ('40000000-0000-0000-0000-000000000001', 'test-pecs', 'Test Pecs', '60000000-0000-0000-0000-000000000001');

insert into public.exercise_categories (id, slug, name)
  values ('c0000000-0000-0000-0000-000000000001', 'test-chest-cat', 'Test Chest');

insert into public.exercises (id, slug, name, category_id, movement_pattern, mechanics)
  values ('20000000-0000-0000-0000-000000000001', 'test-bench', 'Test Bench Press',
          'c0000000-0000-0000-0000-000000000001', 'horizontal_push', 'compound');
insert into public.exercises (id, slug, name, category_id, movement_pattern, mechanics)
  values ('20000000-0000-0000-0000-000000000002', 'test-pushup', 'Test Push-up',
          'c0000000-0000-0000-0000-000000000001', 'horizontal_push', 'compound');

insert into public.exercise_muscles (exercise_id, muscle_id, role)
  values ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'primary');

insert into public.exercise_equipment (exercise_id, equipment_id, alt_group)
  values ('20000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1);

insert into public.exercise_substitutions (exercise_id, substitute_id, similarity, reason)
  values ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 85, 'same pattern');

insert into public.foods (id, slug, name, category, kcal, protein_g, carbs_g, fat_g, serving_name, serving_grams)
  values ('f0000000-0000-0000-0000-000000000001', 'test-egg', 'Test Egg', 'protein', 155, 13, 1.1, 11, '1 large egg', 50);

-- Create a real user so a profiles row exists to prove anon cannot read it.
select tests.create_supabase_user('anon_probe_user');

-- Become anonymous.
select tests.clear_authentication();
set local role anon;

select isnt_empty('select 1 from public.equipment',              'anon can read equipment');
select isnt_empty('select 1 from public.muscle_groups',          'anon can read muscle_groups');
select isnt_empty('select 1 from public.muscles',                'anon can read muscles');
select isnt_empty('select 1 from public.exercise_categories',    'anon can read exercise_categories');
select isnt_empty('select 1 from public.exercises',              'anon can read exercises');
select isnt_empty('select 1 from public.exercise_muscles',       'anon can read exercise_muscles');
select isnt_empty('select 1 from public.exercise_equipment',     'anon can read exercise_equipment');
select isnt_empty('select 1 from public.exercise_substitutions', 'anon can read exercise_substitutions');
select isnt_empty('select 1 from public.foods',                  'anon can read foods');

-- A profiles row exists, but anon must see none (no anon policy on user tables).
select is(
  (select count(*) from public.profiles)::bigint, 0::bigint,
  'anon sees zero rows in profiles (user table hidden)'
);

reset role;
select * from finish();
rollback;
