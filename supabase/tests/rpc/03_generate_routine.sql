-- WS-6 RPC tests · generate_starter_routine (§7.5)
-- Asserts: D routine days built, prior active routine deactivated, no excluded
-- movement pattern present, and every prescribed exercise is equipment-feasible.
-- User: hypertrophy / beginner / 3 days / 60 min / preferred_days {0,2,4} / home,
-- equipment = dumbbell,flat-bench,barbell,weight-plates,pull-up-bar,cable-machine,
-- lat-pulldown; movement exclusion = vertical_push (shoulder protection).
begin;
create extension if not exists pgtap;

select plan(7);

-- ---- catalog fixture -------------------------------------------------
insert into public.muscle_groups (slug,name,region) values
  ('chest','Chest','upper'),('back','Back','upper'),('shoulders','Shoulders','upper'),
  ('arms','Arms','upper'),('core','Core','core'),('legs','Legs','lower'),('glutes','Glutes','lower');

insert into public.muscles (slug,name,muscle_group_id)
select v.slug, v.name, mg.id from (values
  ('pecs','Chest','chest'),('front-delts','Front Delts','shoulders'),('side-delts','Side Delts','shoulders'),
  ('triceps','Triceps','arms'),('biceps','Biceps','arms'),('forearms','Forearms','arms'),
  ('lats','Lats','back'),('rhomboids','Mid-back','back'),('lower-back','Lower Back','back'),
  ('abs','Abs','core'),('obliques','Obliques','core'),
  ('quads','Quads','legs'),('glute-max','Glutes','glutes'),('hamstrings','Hamstrings','legs')
) v(slug,name,grp) join public.muscle_groups mg on mg.slug=v.grp;

insert into public.exercise_categories (slug,name,display_order) values
  ('chest','Chest',1),('back','Back',2),('shoulders','Shoulders',3),('arms','Arms',4),
  ('legs','Legs',5),('glutes','Glutes',6),('core','Core',7);

insert into public.equipment (slug,name,category,common_in_home,common_in_gym) values
  ('barbell','Barbell','free_weights',true,true),
  ('weight-plates','Weight Plates','free_weights',true,true),
  ('dumbbell','Dumbbells','free_weights',true,true),
  ('kettlebell','Kettlebell','free_weights',true,true),
  ('flat-bench','Flat Bench','benches_racks',true,true),
  ('adjustable-bench','Adjustable Bench','benches_racks',true,true),
  ('chest-press-machine','Chest Press Machine','machines',false,true),
  ('cable-machine','Cable Machine','cables',false,true),
  ('lat-pulldown','Lat Pulldown Machine','cables',false,true),
  ('pull-up-bar','Pull-up Bar','bodyweight_accessories',true,true),
  ('resistance-bands','Resistance Bands','bodyweight_accessories',true,true);

-- exercises (slug,name,cat,pattern,mech,diff,pop,bw)
insert into public.exercises (slug,name,category_id,movement_pattern,mechanics,difficulty,popularity,is_bodyweight_ok)
select v.slug,v.name,ec.id,v.pat::movement_pattern,v.mech::mechanics_type,v.diff::difficulty_level,v.pop,v.bw
from (values
 ('bench-press','Barbell Bench Press','chest','horizontal_push','compound','intermediate',95,false),
 ('dumbbell-bench-press','Dumbbell Bench Press','chest','horizontal_push','compound','beginner',90,false),
 ('machine-chest-press','Machine Chest Press','chest','horizontal_push','compound','beginner',75,false),
 ('push-up','Push-up','chest','horizontal_push','compound','beginner',90,true),
 ('incline-dumbbell-press','Incline Dumbbell Press','chest','horizontal_push','compound','intermediate',85,false),
 ('overhead-press','Barbell Overhead Press','shoulders','vertical_push','compound','intermediate',85,false),
 ('dumbbell-row','One-Arm Dumbbell Row','back','horizontal_pull','compound','beginner',85,false),
 ('seated-cable-row','Seated Cable Row','back','horizontal_pull','compound','beginner',80,false),
 ('lat-pulldown','Lat Pulldown','back','vertical_pull','compound','beginner',90,false),
 ('pull-up','Pull-up','back','vertical_pull','compound','advanced',90,false),
 ('goblet-squat','Goblet Squat','legs','squat','compound','beginner',80,false),
 ('bodyweight-squat','Bodyweight Squat','legs','squat','compound','beginner',70,true),
 ('romanian-deadlift','Romanian Deadlift','legs','hinge','compound','intermediate',85,false),
 ('walking-lunge','Walking Lunge','legs','lunge','compound','beginner',70,true),
 ('glute-bridge','Glute Bridge','glutes','hip_extension_iso','isolation','beginner',65,true),
 ('dumbbell-curl','Dumbbell Curl','arms','elbow_flexion','isolation','beginner',85,false),
 ('triceps-pushdown','Triceps Pushdown','arms','elbow_extension','isolation','beginner',85,false),
 ('lateral-raise','Dumbbell Lateral Raise','shoulders','shoulder_isolation','isolation','beginner',85,false),
 ('plank','Plank','core','core_stability','isolation','beginner',85,true),
 ('russian-twist','Russian Twist','core','core_flexion','isolation','beginner',60,true)
) v(slug,name,cat,pat,mech,diff,pop,bw)
join public.exercise_categories ec on ec.slug=v.cat;

-- exercise_muscles
insert into public.exercise_muscles (exercise_id,muscle_id,role)
select e.id,m.id,v.role::muscle_role from (values
 ('bench-press','pecs','primary'),('bench-press','front-delts','secondary'),('bench-press','triceps','secondary'),
 ('dumbbell-bench-press','pecs','primary'),('dumbbell-bench-press','front-delts','secondary'),('dumbbell-bench-press','triceps','secondary'),
 ('machine-chest-press','pecs','primary'),('machine-chest-press','front-delts','secondary'),('machine-chest-press','triceps','secondary'),
 ('push-up','pecs','primary'),('push-up','front-delts','secondary'),('push-up','triceps','secondary'),('push-up','abs','secondary'),
 ('incline-dumbbell-press','pecs','primary'),('incline-dumbbell-press','front-delts','secondary'),('incline-dumbbell-press','triceps','secondary'),
 ('overhead-press','front-delts','primary'),('overhead-press','side-delts','secondary'),('overhead-press','triceps','secondary'),
 ('dumbbell-row','lats','primary'),('dumbbell-row','rhomboids','secondary'),('dumbbell-row','biceps','secondary'),
 ('seated-cable-row','rhomboids','primary'),('seated-cable-row','lats','secondary'),('seated-cable-row','biceps','secondary'),
 ('lat-pulldown','lats','primary'),('lat-pulldown','biceps','secondary'),('lat-pulldown','rhomboids','secondary'),
 ('pull-up','lats','primary'),('pull-up','biceps','secondary'),
 ('goblet-squat','quads','primary'),('goblet-squat','glute-max','secondary'),('goblet-squat','abs','secondary'),
 ('bodyweight-squat','quads','primary'),('bodyweight-squat','glute-max','secondary'),
 ('romanian-deadlift','hamstrings','primary'),('romanian-deadlift','glute-max','secondary'),('romanian-deadlift','lower-back','secondary'),
 ('walking-lunge','quads','primary'),('walking-lunge','glute-max','secondary'),('walking-lunge','hamstrings','secondary'),
 ('glute-bridge','glute-max','primary'),('glute-bridge','hamstrings','secondary'),
 ('dumbbell-curl','biceps','primary'),('dumbbell-curl','forearms','secondary'),
 ('triceps-pushdown','triceps','primary'),
 ('lateral-raise','side-delts','primary'),
 ('plank','abs','primary'),('plank','obliques','secondary'),('plank','lower-back','secondary'),
 ('russian-twist','obliques','primary'),('russian-twist','abs','secondary')
) v(ex,mus,role) join public.exercises e on e.slug=v.ex join public.muscles m on m.slug=v.mus;

-- exercise_equipment (ex, eq, alt_group)
insert into public.exercise_equipment (exercise_id,equipment_id,alt_group)
select e.id,eq.id,v.g from (values
 ('bench-press','barbell',1),('bench-press','weight-plates',2),('bench-press','flat-bench',3),
 ('dumbbell-bench-press','dumbbell',1),('dumbbell-bench-press','flat-bench',2),
 ('machine-chest-press','chest-press-machine',1),
 ('incline-dumbbell-press','dumbbell',1),('incline-dumbbell-press','adjustable-bench',2),
 ('overhead-press','barbell',1),('overhead-press','weight-plates',2),
 ('dumbbell-row','dumbbell',1),('dumbbell-row','flat-bench',2),
 ('seated-cable-row','cable-machine',1),
 ('lat-pulldown','lat-pulldown',1),
 ('pull-up','pull-up-bar',1),
 ('goblet-squat','dumbbell',1),('goblet-squat','kettlebell',1),
 ('romanian-deadlift','barbell',1),('romanian-deadlift','dumbbell',1),
 ('walking-lunge','dumbbell',1),
 ('dumbbell-curl','dumbbell',1),
 ('triceps-pushdown','cable-machine',1),('triceps-pushdown','resistance-bands',1),
 ('lateral-raise','dumbbell',1),('lateral-raise','resistance-bands',1),
 ('russian-twist','dumbbell',1)
) v(ex,eq,g) join public.exercises e on e.slug=v.ex join public.equipment eq on eq.slug=v.eq;

-- curated substitutions for the §7.4 worked example
insert into public.exercise_substitutions (exercise_id,substitute_id,similarity,reason)
select e.id,s.id,v.sim,v.reason from (values
 ('bench-press','dumbbell-bench-press',92,'Same movement, uses dumbbells'),
 ('bench-press','machine-chest-press',85,null),
 ('bench-press','push-up',70,null),
 ('bench-press','incline-dumbbell-press',70,null),
 ('pull-up','lat-pulldown',90,null),
 ('lat-pulldown','pull-up',85,null)
) v(ex,sub,sim,reason) join public.exercises e on e.slug=v.ex join public.exercises s on s.slug=v.sub;

-- foods (5)
insert into public.foods (slug,name,category,kcal,protein_g,carbs_g,fat_g,serving_name,serving_grams,diet_tags,allergen_tags,verified) values
 ('chicken-breast','Chicken Breast, cooked','protein',165,31,0,3.6,'1 breast · 120 g',120,'{gluten_free,dairy_free,keto_friendly}','{}',true),
 ('salmon','Atlantic Salmon, cooked','protein',208,20,0,13,'1 fillet · 150 g',150,'{pescatarian_ok,gluten_free,dairy_free,keto_friendly}','{fish}',true),
 ('tofu-firm','Firm Tofu','protein',144,17,3,8,'1/2 block · 126 g',126,'{vegan,vegetarian,pescatarian_ok,gluten_free,dairy_free,keto_friendly}','{soy}',true),
 ('egg','Whole Egg','protein',143,12.6,0.7,9.5,'1 large · 50 g',50,'{vegetarian,gluten_free,dairy_free,keto_friendly}','{egg}',true),
 ('white-rice','White Rice, cooked','grain',130,2.7,28,0.3,'1 cup · 158 g',158,'{vegan,vegetarian,pescatarian_ok,gluten_free,dairy_free}','{}',true),
 ('almonds','Almonds','nut_seed',579,21.2,21.6,49.9,'1/4 cup · 35 g',35,'{vegan,vegetarian,pescatarian_ok,gluten_free,dairy_free,keto_friendly}','{tree_nut}',true);

-- ---- user + profile --------------------------------------------------
select tests.create_supabase_user('gen');
update public.profiles set primary_goal='hypertrophy', experience_level='beginner',
  training_location='home', days_per_week=3, session_minutes=60, preferred_days='{0,2,4}'
  where id = tests.get_supabase_uid('gen');
insert into public.user_equipment (user_id,equipment_id)
  select tests.get_supabase_uid('gen'), id from public.equipment
   where slug in ('dumbbell','flat-bench','barbell','weight-plates','pull-up-bar','cable-machine','lat-pulldown');
insert into public.user_movement_exclusions (user_id,movement_pattern,reason,source_body_area)
  values (tests.get_supabase_uid('gen'),'vertical_push','injury','shoulders');
-- a pre-existing active routine that must be deactivated
insert into public.routines (id,user_id,name,source,is_active)
  values ('99999999-0000-0000-0000-000000000001', tests.get_supabase_uid('gen'),'Old Routine','custom',true);

select tests.authenticate_as('gen');

-- run generation
select public.generate_starter_routine() as rid \gset

select isnt(:'rid'::uuid, null, 'generate_starter_routine returns a routine id');

select is(
  (select count(*) from public.routines where user_id = tests.get_supabase_uid('gen') and is_active)::int,
  1, 'exactly one active routine after generation');

select is(
  (select is_active from public.routines where id='99999999-0000-0000-0000-000000000001'),
  false, 'prior active routine is deactivated');

select is(
  (select count(*) from public.routine_days where routine_id = :'rid'::uuid)::int,
  3, 'routine has D = 3 days');

-- no excluded movement pattern (vertical_push) anywhere in the plan
select is(
  (select count(*) from public.routine_exercises re
     join public.routine_days rd on rd.id = re.routine_day_id and rd.routine_id = :'rid'::uuid
     join public.exercises e on e.id = re.exercise_id
    where e.movement_pattern = 'vertical_push')::int,
  0, 'no excluded movement pattern (vertical_push) appears in the routine');

-- every prescribed exercise is equipment-feasible for this user
select is(
  (select count(*) from public.routine_exercises re
     join public.routine_days rd on rd.id = re.routine_day_id and rd.routine_id = :'rid'::uuid
    where not public._feasible(re.exercise_id, false, tests.get_supabase_uid('gen')))::int,
  0, 'every prescribed exercise is equipment-feasible');

-- every day has at least one exercise
select is(
  (select count(*) from public.routine_days rd
    where rd.routine_id = :'rid'::uuid
      and exists (select 1 from public.routine_exercises re where re.routine_day_id = rd.id))::int,
  3, 'all 3 days contain at least one exercise');

select * from finish();
rollback;
