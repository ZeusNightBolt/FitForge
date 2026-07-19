-- WS-6 RPC tests · search_exercises / search_foods (§7.1 ranking + filters)
-- Minimal inline catalog fixture (no dependency on WS-2 seed).
begin;
create extension if not exists pgtap;

select plan(8);

-- ---- catalog fixture (superuser => bypasses RLS) --------------------
insert into public.muscle_groups (slug,name,region) values
  ('chest','Chest','upper'),('shoulders','Shoulders','upper'),('back','Back','upper'),
  ('arms','Arms','upper'),('core','Core','core'),('legs','Legs','lower'),('glutes','Glutes','lower');

insert into public.exercise_categories (slug,name,display_order) values
  ('chest','Chest',1),('back','Back',2),('shoulders','Shoulders',3),('arms','Arms',4),
  ('legs','Legs',5),('glutes','Glutes',6),('core','Core',7);

insert into public.equipment (slug,name,category,common_in_home,common_in_gym) values
  ('barbell','Barbell','free_weights',true,true),
  ('weight-plates','Weight Plates','free_weights',true,true),
  ('dumbbell','Dumbbells','free_weights',true,true),
  ('flat-bench','Flat Bench','benches_racks',true,true),
  ('chest-press-machine','Chest Press Machine','machines',false,true);

insert into public.exercises (slug,name,category_id,movement_pattern,mechanics,difficulty,popularity,is_bodyweight_ok)
select v.slug,v.name,ec.id,v.pat::movement_pattern,v.mech::mechanics_type,v.diff::difficulty_level,v.pop,v.bw
from (values
 ('bench-press','Barbell Bench Press','chest','horizontal_push','compound','intermediate',95,false),
 ('dumbbell-bench-press','Dumbbell Bench Press','chest','horizontal_push','compound','beginner',90,false),
 ('machine-chest-press','Machine Chest Press','chest','horizontal_push','compound','beginner',75,false),
 ('push-up','Push-up','chest','horizontal_push','compound','beginner',90,true),
 ('goblet-squat','Goblet Squat','legs','squat','compound','beginner',80,false),
 ('bodyweight-squat','Bodyweight Squat','legs','squat','compound','beginner',70,true)
) v(slug,name,cat,pat,mech,diff,pop,bw)
join public.exercise_categories ec on ec.slug=v.cat;

insert into public.exercise_equipment (exercise_id,equipment_id,alt_group)
select e.id,eq.id,v.g from (values
 ('bench-press','barbell',1),('bench-press','weight-plates',2),('bench-press','flat-bench',3),
 ('dumbbell-bench-press','dumbbell',1),('dumbbell-bench-press','flat-bench',2),
 ('machine-chest-press','chest-press-machine',1),
 ('goblet-squat','dumbbell',1)
) v(ex,eq,g) join public.exercises e on e.slug=v.ex join public.equipment eq on eq.slug=v.eq;

insert into public.foods (slug,name,category,kcal,protein_g,carbs_g,fat_g,serving_name,serving_grams,diet_tags,allergen_tags,verified) values
 ('chicken-breast','Chicken Breast, cooked','protein',165,31,0,3.6,'1 breast',120,'{gluten_free,dairy_free,keto_friendly}','{}',true),
 ('tofu-firm','Firm Tofu','protein',144,17,3,8,'1/2 block',126,'{vegan,vegetarian,pescatarian_ok,gluten_free,dairy_free,keto_friendly}','{soy}',true),
 ('egg','Whole Egg','protein',143,12.6,0.7,9.5,'1 large',50,'{vegetarian,gluten_free,dairy_free,keto_friendly}','{egg}',true),
 ('almonds','Almonds','nut_seed',579,21.2,21.6,49.9,'1/4 cup',35,'{vegan,vegetarian,pescatarian_ok,gluten_free,dairy_free,keto_friendly}','{tree_nut}',true);

-- ---- users ----------------------------------------------------------
select tests.create_supabase_user('searcher');   -- dumbbell + flat-bench, home
update public.profiles set training_location='home' where id = tests.get_supabase_uid('searcher');
insert into public.user_equipment (user_id,equipment_id)
  select tests.get_supabase_uid('searcher'), id from public.equipment where slug in ('dumbbell','flat-bench');

select tests.create_supabase_user('vegan');       -- vegan diet + tree_nut allergy
insert into public.nutrition_profiles (user_id,diet_type,allergies)
  values (tests.get_supabase_uid('vegan'),'vegan','{tree_nut}');

-- ============ search_exercises (§7.1) ================================
select tests.authenticate_as('searcher');

select is(
  (select slug from public.search_exercises('bench') limit 1),
  'bench-press',
  'search_exercises: "bench" ranks the higher-popularity name-match first');

select is(
  (select count(*) from public.search_exercises('squat'))::int, 2,
  'search_exercises: "squat" matches both squat exercises');

select is(
  (select slug from public.search_exercises('squat') order by score desc limit 1),
  'goblet-squat',
  'search_exercises: "squat" top is the more popular goblet-squat');

-- filter_equipment: with only dumbbell+flat-bench, "bench" keeps dumbbell-bench-press
-- (feasible) and drops bench-press (needs barbell+plates) and machine-chest-press.
select results_eq(
  $$ select slug from public.search_exercises('bench', 10, true) order by slug $$,
  $$ values ('dumbbell-bench-press') $$,
  'search_exercises: filter_equipment keeps only equipment-feasible matches');

-- ============ search_foods (§7.1 / §7.2.3) ===========================
select is(
  (select slug from public.search_foods('chicken') limit 1),
  'chicken-breast',
  'search_foods: name match returns the food');

select tests.authenticate_as('vegan');

select is(
  (select count(*) from public.search_foods('egg'))::int, 0,
  'search_foods: vegan diet hard-filters out non-vegan egg');

select is(
  (select count(*) from public.search_foods('almond'))::int, 0,
  'search_foods: tree_nut allergy hard-filters out almonds');

select results_eq(
  $$ select slug from public.search_foods('almond', 10, false) $$,
  $$ values ('almonds') $$,
  'search_foods: apply_diet_filter=false disables allergen/diet filtering');

select * from finish();
rollback;
