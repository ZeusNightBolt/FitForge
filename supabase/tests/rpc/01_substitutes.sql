-- WS-6 RPC tests · suggest_substitutes (§7.4) — reproduces the worked example:
--   bench-press excluded, equipment = dumbbell + flat-bench
--   ⇒ top substitute is dumbbell-bench-press (score 171.5), machine-chest-press
--     and incline-dumbbell-press are equipment-infeasible and never appear.
begin;
create extension if not exists pgtap;

select plan(8);

-- ---- catalog fixture -------------------------------------------------
insert into public.muscle_groups (slug,name,region) values
  ('chest','Chest','upper'),('shoulders','Shoulders','upper'),('back','Back','upper'),('arms','Arms','upper');

insert into public.muscles (slug,name,muscle_group_id)
select v.slug,v.name,mg.id from (values
  ('pecs','Chest','chest'),('front-delts','Front Delts','shoulders'),
  ('side-delts','Side Delts','shoulders'),('triceps','Triceps','arms'),
  ('biceps','Biceps','arms'),('abs','Abs','chest')  -- abs group irrelevant here; kept simple
) v(slug,name,grp) join public.muscle_groups mg on mg.slug=v.grp;

insert into public.exercise_categories (slug,name,display_order) values
  ('chest','Chest',1),('shoulders','Shoulders',3);

insert into public.equipment (slug,name,category,common_in_home,common_in_gym) values
  ('barbell','Barbell','free_weights',true,true),
  ('weight-plates','Weight Plates','free_weights',true,true),
  ('dumbbell','Dumbbells','free_weights',true,true),
  ('flat-bench','Flat Bench','benches_racks',true,true),
  ('adjustable-bench','Adjustable Bench','benches_racks',true,true),
  ('chest-press-machine','Chest Press Machine','machines',false,true);

insert into public.exercises (slug,name,category_id,movement_pattern,mechanics,difficulty,popularity,is_bodyweight_ok)
select v.slug,v.name,ec.id,v.pat::movement_pattern,v.mech::mechanics_type,v.diff::difficulty_level,v.pop,v.bw
from (values
 ('bench-press','Barbell Bench Press','chest','horizontal_push','compound','intermediate',95,false),
 ('dumbbell-bench-press','Dumbbell Bench Press','chest','horizontal_push','compound','beginner',90,false),
 ('machine-chest-press','Machine Chest Press','chest','horizontal_push','compound','beginner',75,false),
 ('push-up','Push-up','chest','horizontal_push','compound','beginner',90,true),
 ('incline-dumbbell-press','Incline Dumbbell Press','chest','horizontal_push','compound','intermediate',85,false)
) v(slug,name,cat,pat,mech,diff,pop,bw)
join public.exercise_categories ec on ec.slug=v.cat;

insert into public.exercise_muscles (exercise_id,muscle_id,role)
select e.id,m.id,v.role::muscle_role from (values
 ('bench-press','pecs','primary'),('bench-press','front-delts','secondary'),('bench-press','triceps','secondary'),
 ('dumbbell-bench-press','pecs','primary'),('dumbbell-bench-press','front-delts','secondary'),('dumbbell-bench-press','triceps','secondary'),
 ('machine-chest-press','pecs','primary'),('machine-chest-press','front-delts','secondary'),('machine-chest-press','triceps','secondary'),
 ('push-up','pecs','primary'),('push-up','front-delts','secondary'),('push-up','triceps','secondary'),('push-up','abs','secondary'),
 ('incline-dumbbell-press','pecs','primary'),('incline-dumbbell-press','front-delts','secondary'),('incline-dumbbell-press','triceps','secondary')
) v(ex,mus,role) join public.exercises e on e.slug=v.ex join public.muscles m on m.slug=v.mus;

insert into public.exercise_equipment (exercise_id,equipment_id,alt_group)
select e.id,eq.id,v.g from (values
 ('bench-press','barbell',1),('bench-press','weight-plates',2),('bench-press','flat-bench',3),
 ('dumbbell-bench-press','dumbbell',1),('dumbbell-bench-press','flat-bench',2),
 ('machine-chest-press','chest-press-machine',1),
 ('incline-dumbbell-press','dumbbell',1),('incline-dumbbell-press','adjustable-bench',2)
) v(ex,eq,g) join public.exercises e on e.slug=v.ex join public.equipment eq on eq.slug=v.eq;

insert into public.exercise_substitutions (exercise_id,substitute_id,similarity,reason)
select e.id,s.id,v.sim,v.reason from (values
 ('bench-press','dumbbell-bench-press',92,'Same movement, uses dumbbells'),
 ('bench-press','machine-chest-press',85,null),
 ('bench-press','push-up',70,null),
 ('bench-press','incline-dumbbell-press',70,null)
) v(ex,sub,sim,reason) join public.exercises e on e.slug=v.ex join public.exercises s on s.slug=v.sub;

-- ---- user: home, equipment = dumbbell + flat-bench -------------------
select tests.create_supabase_user('lifter');
update public.profiles set training_location='home' where id = tests.get_supabase_uid('lifter');
insert into public.user_equipment (user_id,equipment_id)
  select tests.get_supabase_uid('lifter'), id from public.equipment where slug in ('dumbbell','flat-bench');

select tests.authenticate_as('lifter');

-- top substitute is dumbbell-bench-press
select is(
  (select slug from public.suggest_substitutes((select id from public.exercises where slug='bench-press')) limit 1),
  'dumbbell-bench-press',
  'suggest_substitutes: top substitute for bench-press is dumbbell-bench-press');

-- exact worked-example score
select is(
  (select round(score::numeric,1)
     from public.suggest_substitutes((select id from public.exercises where slug='bench-press'))
    where slug='dumbbell-bench-press'),
  171.5,
  'suggest_substitutes: dumbbell-bench-press scores 171.5 (curated 92 + overlaps + pattern/mech + pop)');

-- curated reason surfaces
select is(
  (select reason
     from public.suggest_substitutes((select id from public.exercises where slug='bench-press'))
    where slug='dumbbell-bench-press'),
  'Same movement, uses dumbbells',
  'suggest_substitutes: curated reason is returned when present');

-- push-up (bodyweight) is feasible and included
select is(
  (select count(*) from public.suggest_substitutes((select id from public.exercises where slug='bench-press'))
    where slug='push-up')::int, 1,
  'suggest_substitutes: bodyweight push-up is feasible and included');

-- machine-chest-press is equipment-infeasible and excluded
select is(
  (select count(*) from public.suggest_substitutes((select id from public.exercises where slug='bench-press'))
    where slug='machine-chest-press')::int, 0,
  'suggest_substitutes: machine-chest-press (no machine owned) is excluded');

-- incline-dumbbell-press needs an adjustable bench (not owned) => excluded
select is(
  (select count(*) from public.suggest_substitutes((select id from public.exercises where slug='bench-press'))
    where slug='incline-dumbbell-press')::int, 0,
  'suggest_substitutes: incline-dumbbell-press (no adjustable bench) is excluded');

-- the target itself never appears in its own substitute list
select is(
  (select count(*) from public.suggest_substitutes((select id from public.exercises where slug='bench-press'))
    where slug='bench-press')::int, 0,
  'suggest_substitutes: the excluded target is never its own substitute');

-- pinned preferred substitute is returned first with score 1000 (§7.4 step 3)
insert into public.user_exercise_preferences (user_id, exercise_id, preference, preferred_substitute_id)
  values (tests.get_supabase_uid('lifter'),
          (select id from public.exercises where slug='bench-press'),
          'excluded',
          (select id from public.exercises where slug='push-up'));

select is(
  (select slug || ':' || score::int
     from public.suggest_substitutes((select id from public.exercises where slug='bench-press')) limit 1),
  'push-up:1000',
  'suggest_substitutes: user-pinned substitute is returned first with score 1000');

select * from finish();
rollback;
