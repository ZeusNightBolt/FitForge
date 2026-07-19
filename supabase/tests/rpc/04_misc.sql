-- WS-6 RPC tests · log_food, previous_sets, set_user_equipment,
-- onboarding_status, suggest_onboarding_defaults.
begin;
create extension if not exists pgtap;

select plan(9);

-- ---- minimal fixture -------------------------------------------------
insert into public.exercise_categories (slug,name,display_order) values ('chest','Chest',1);
insert into public.equipment (slug,name,category,common_in_home,common_in_gym) values
  ('barbell','Barbell','free_weights',true,true),
  ('dumbbell','Dumbbells','free_weights',true,true),
  ('flat-bench','Flat Bench','benches_racks',true,true);
insert into public.exercises (slug,name,category_id,movement_pattern,mechanics,difficulty,popularity)
select 'dumbbell-bench-press','Dumbbell Bench Press',id,'horizontal_push','compound','beginner',90
  from public.exercise_categories where slug='chest';
insert into public.foods (slug,name,category,kcal,protein_g,carbs_g,fat_g,serving_name,serving_grams) values
  ('chicken-breast','Chicken Breast, cooked','protein',165,31,0,3.6,'1 breast',120);

-- ==================== suggest_onboarding_defaults (§7.2.5) ===========
-- Pure function — callable without auth.
select is(
  (select rep_min from public.suggest_onboarding_defaults('strength','beginner')),
  5, 'defaults: strength/beginner has a 5-rep floor (rep_min = 5)');
select is(
  (select days_per_week from public.suggest_onboarding_defaults('hypertrophy','advanced')),
  5, 'defaults: hypertrophy/advanced = 5 days/week');
select is(
  (select session_minutes from public.suggest_onboarding_defaults('endurance','beginner')),
  30, 'defaults: endurance/beginner = 30 minute sessions');
select is(
  (select split_name from public.suggest_onboarding_defaults('strength','intermediate')),
  'Upper / Lower', 'defaults: 4-day plan uses an Upper/Lower split');

-- ==================== user-scoped RPCs ==============================
select tests.create_supabase_user('u');
select tests.authenticate_as('u');

-- set_user_equipment: transactional replace
select public.set_user_equipment(array['dumbbell','flat-bench']);
select is(
  (select count(*) from public.user_equipment where user_id = tests.get_supabase_uid('u'))::int,
  2, 'set_user_equipment inserts the two named items');
select public.set_user_equipment(array['barbell']);
select results_eq(
  $$ select eq.slug from public.user_equipment ue
       join public.equipment eq on eq.id = ue.equipment_id $$,
  $$ values ('barbell') $$,
  'set_user_equipment replaces (not appends) the prior set');

-- log_food: server-computed macro snapshot (165 kcal/100g × 150g = 247.5)
select is(
  (select kcal from public.nutrition_logs
     where id = public.log_food((select id from public.foods where slug='chicken-breast'), 150, 'lunch')),
  247.5, 'log_food snapshots kcal = 247.5 for 150 g of chicken breast');

-- previous_sets: last session's sets, ordered
insert into public.workout_sessions (id,user_id,started_at)
  values ('88888888-0000-0000-0000-000000000001', tests.get_supabase_uid('u'), now() - interval '2 days');
insert into public.set_logs (session_id,exercise_id,exercise_name_snapshot,set_number,reps,weight_kg)
select '88888888-0000-0000-0000-000000000001', id, 'Dumbbell Bench Press', g, 10, 22.5
  from public.exercises, generate_series(1,3) g where slug='dumbbell-bench-press';
select is(
  (select count(*) from public.previous_sets((select id from public.exercises where slug='dumbbell-bench-press')))::int,
  3, 'previous_sets returns the 3 sets from the last session');

-- onboarding_status: fresh user is incomplete and resumes at goals
select is(
  (select resume_step from public.onboarding_status()),
  'goals', 'onboarding_status: incomplete profile resumes at the goals screen');

select * from finish();
rollback;
