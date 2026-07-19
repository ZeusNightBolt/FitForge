-- WS-6 RPC tests · suggest_nutrition_targets (§7.2.4 Mifflin-St Jeor)
-- Personas P1/P2/P3 with canonical inputs (birthdate set relative to current_date
-- so ages are deterministic). Expected numbers derived by hand from §7.2.4.
--
--  P1 Rachel : female 34y 165cm 70kg, fat_loss, 3d, vegetarian
--     BMR 1400.25 ×1.5 ×0.80 = 1680.3 → 1700 kcal
--     protein 1.8×70=126 → 125 | fat 30% → 55 | carbs remainder → 175
--  P2 Gabe   : male 27y 180cm 85kg, hypertrophy, 5d, omnivore
--     BMR 1845 ×1.65 ×1.08 = 3287.79 → 3300 kcal
--     protein 1.8×85=153 → 155 | fat 30% → 110 | carbs → 425
--  P3 Marco  : male 45y 178cm 80kg, general_health, 3d, keto
--     BMR 1692.5 ×1.5 ×1.0 = 2538.75 → 2550 kcal
--     keto protein 1.6×80=128 → 130 | fat 65% → 185 | carbs → 90
begin;
create extension if not exists pgtap;

select plan(12);

-- P1
select tests.create_supabase_user('p1');
update public.profiles set sex='female', height_cm=165,
  birthdate=(current_date - interval '34 years')::date, primary_goal='fat_loss', days_per_week=3
  where id = tests.get_supabase_uid('p1');
insert into public.body_metrics (user_id,measured_on,weight_kg) values (tests.get_supabase_uid('p1'),current_date,70);
insert into public.nutrition_profiles (user_id,diet_type) values (tests.get_supabase_uid('p1'),'vegetarian');

-- P2
select tests.create_supabase_user('p2');
update public.profiles set sex='male', height_cm=180,
  birthdate=(current_date - interval '27 years')::date, primary_goal='hypertrophy', days_per_week=5
  where id = tests.get_supabase_uid('p2');
insert into public.body_metrics (user_id,measured_on,weight_kg) values (tests.get_supabase_uid('p2'),current_date,85);
insert into public.nutrition_profiles (user_id,diet_type) values (tests.get_supabase_uid('p2'),'omnivore');

-- P3
select tests.create_supabase_user('p3');
update public.profiles set sex='male', height_cm=178,
  birthdate=(current_date - interval '45 years')::date, primary_goal='general_health', days_per_week=3
  where id = tests.get_supabase_uid('p3');
insert into public.body_metrics (user_id,measured_on,weight_kg) values (tests.get_supabase_uid('p3'),current_date,80);
insert into public.nutrition_profiles (user_id,diet_type) values (tests.get_supabase_uid('p3'),'keto');

-- ---- P1 assertions --------------------------------------------------
select tests.authenticate_as('p1');
select is((select kcal      from public.suggest_nutrition_targets()), 1700, 'P1 kcal = 1700');
select is((select protein_g from public.suggest_nutrition_targets()),  125, 'P1 protein = 125');
select is((select carbs_g   from public.suggest_nutrition_targets()),  175, 'P1 carbs = 175');
select is((select fat_g     from public.suggest_nutrition_targets()),   55, 'P1 fat = 55');

-- ---- P2 assertions --------------------------------------------------
select tests.authenticate_as('p2');
select is((select kcal      from public.suggest_nutrition_targets()), 3300, 'P2 kcal = 3300');
select is((select protein_g from public.suggest_nutrition_targets()),  155, 'P2 protein = 155');
select is((select carbs_g   from public.suggest_nutrition_targets()),  425, 'P2 carbs = 425');
select is((select fat_g     from public.suggest_nutrition_targets()),  110, 'P2 fat = 110');

-- ---- P3 assertions (keto branch) ------------------------------------
select tests.authenticate_as('p3');
select is((select kcal      from public.suggest_nutrition_targets()), 2550, 'P3 kcal = 2550');
select is((select protein_g from public.suggest_nutrition_targets()),  130, 'P3 protein = 130 (keto 1.6 g/kg)');
select is((select carbs_g   from public.suggest_nutrition_targets()),   90, 'P3 carbs = 90');
select is((select fat_g     from public.suggest_nutrition_targets()),  185, 'P3 fat = 185 (keto 65%)');

select * from finish();
rollback;
