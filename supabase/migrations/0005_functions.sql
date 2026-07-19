-- =====================================================================
-- 0005_functions.sql  — WS-6 Database Intelligence
-- Views (§5.2), RPCs (§5.3) implementing the deterministic rules (§7).
--
-- Security modes (§4.4 grants note):
--   * every function here is `security invoker` EXCEPT generate_starter_routine
--     which is `security definer set search_path = public`.
--   * grant execute to `authenticated`; the search / suggestion RPCs that must
--     work for logged-out browse are also granted to `anon`.
-- All names are transcribed verbatim from the frozen blueprint.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Internal helper functions
-- ---------------------------------------------------------------------

-- Rank the ordinal position of a difficulty / experience level. Accepts the
-- text form of either enum ('beginner'|'intermediate'|'advanced'); unknown /
-- null → 3 (advanced) so that "harder than the user" penalties never fire when
-- experience is unknown (anon / incomplete profile).
create or replace function public._level_rank(l text)
returns int language sql immutable as $$
  select case l
    when 'beginner' then 1
    when 'intermediate' then 2
    when 'advanced' then 3
    else 3
  end;
$$;

-- Equipment-feasibility predicate (§7.4 step 1).
--   feasible ⇔  p_all_owned                         (treat all equipment as owned)
--            OR is_bodyweight_ok
--            OR the exercise needs no equipment rows (vacuous)
--            OR for EVERY alt_group of the exercise there EXISTS an owned item.
-- Rows sharing (exercise_id, alt_group) are alternatives (any one suffices);
-- distinct alt_groups are all required.
create or replace function public._feasible(p_exercise uuid, p_all_owned boolean, p_user uuid)
returns boolean language sql stable as $$
  select
    p_all_owned
    or coalesce((select e.is_bodyweight_ok from public.exercises e where e.id = p_exercise), false)
    or not exists (
      select 1
      from (select distinct alt_group
              from public.exercise_equipment
             where exercise_id = p_exercise) g
      where not exists (
        select 1
        from public.exercise_equipment ee
        join public.user_equipment ue on ue.equipment_id = ee.equipment_id
        where ee.exercise_id = p_exercise
          and ee.alt_group  = g.alt_group
          and ue.user_id    = p_user
      )
    );
$$;

-- ---------------------------------------------------------------------
-- §5.2 SQL views (security_invoker so the caller's RLS applies)
-- ---------------------------------------------------------------------

-- One-shot read for exercise detail & catalog list.
create or replace view public.v_exercise_full
  with (security_invoker = true) as
select
  e.id,
  e.slug,
  e.name,
  e.aliases,
  e.category_id,
  ec.slug          as category_slug,
  ec.name          as category_name,
  e.movement_pattern,
  e.mechanics,
  e.difficulty,
  e.is_unilateral,
  e.is_bodyweight_ok,
  e.instructions,
  e.video_url,
  e.image_path,
  e.tags,
  e.popularity,
  e.is_active,
  coalesce((
    select array_agg(m.slug order by m.slug)
      from public.exercise_muscles em
      join public.muscles m on m.id = em.muscle_id
     where em.exercise_id = e.id and em.role = 'primary'
  ), '{}') as primary_muscles,
  coalesce((
    select array_agg(m.slug order by m.slug)
      from public.exercise_muscles em
      join public.muscles m on m.id = em.muscle_id
     where em.exercise_id = e.id and em.role = 'secondary'
  ), '{}') as secondary_muscles,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'alt_group', ee.alt_group,
             'slug',      eq.slug,
             'name',      eq.name) order by ee.alt_group, eq.slug)
      from public.exercise_equipment ee
      join public.equipment eq on eq.id = ee.equipment_id
     where ee.exercise_id = e.id
  ), '[]'::jsonb) as equipment
from public.exercises e
join public.exercise_categories ec on ec.id = e.category_id;

-- Per user/day macro sums from the food diary.
create or replace view public.v_daily_nutrition
  with (security_invoker = true) as
select
  nl.user_id,
  nl.logged_on,
  sum(nl.kcal)::numeric(9,1)      as kcal,
  sum(nl.protein_g)::numeric(8,1) as protein_g,
  sum(nl.carbs_g)::numeric(8,1)   as carbs_g,
  sum(nl.fat_g)::numeric(8,1)     as fat_g,
  count(*)                        as entries
from public.nutrition_logs nl
group by nl.user_id, nl.logged_on;

-- Per user/exercise best estimated 1RM (Epley: weight * (1 + reps/30)) and best
-- working weight. Warm-up sets excluded.
create or replace view public.v_exercise_prs
  with (security_invoker = true) as
select
  ws.user_id,
  sl.exercise_id,
  max(sl.weight_kg * (1 + sl.reps / 30.0))::numeric(7,2) as best_e1rm,
  max(sl.weight_kg)                                       as best_weight
from public.set_logs sl
join public.workout_sessions ws on ws.id = sl.session_id
where sl.is_warmup = false
group by ws.user_id, sl.exercise_id;

-- ---------------------------------------------------------------------
-- §5.3 / §7.1  search_exercises  — type-ahead over the exercise catalog
-- ---------------------------------------------------------------------
create or replace function public.search_exercises(
  q                text,
  p_limit          int     default 10,
  filter_equipment boolean default false,
  category_slug    text    default null
) returns table (
  exercise_id   uuid,
  slug          text,
  name          text,
  matched_alias text,
  score         real
) language plpgsql stable security invoker as $$
declare
  v_uid       uuid := auth.uid();
  ql          text := lower(trim(coalesce(q, '')));
  qlen        int  := length(lower(trim(coalesce(q, ''))));
  qword       text := regexp_replace(lower(trim(coalesce(q, ''))), '[^a-z0-9 ]', '', 'g');
  v_all_owned boolean;
  v_eq_count  int;
  v_location  training_location;
  v_cat       uuid;
begin
  select count(*) into v_eq_count from public.user_equipment where user_id = v_uid;
  select training_location into v_location from public.profiles where id = v_uid;
  v_all_owned := (v_uid is null)
              or (v_eq_count = 0 and (v_location is null or v_location = 'commercial_gym'));

  if category_slug is not null then
    select id into v_cat from public.exercise_categories where slug = category_slug;
  end if;

  return query
  with scored as (
    select
      e.id   as ex_id,
      e.slug as ex_slug,
      e.name as ex_name,
      (select a from unnest(e.aliases) a
         where qlen >= 2 and (lower(a) = ql or a ilike ql || '%')
         limit 1) as m_alias,
      (
          (case when qlen >= 2 and lower(e.name) = ql          then 100 else 0 end)
        + (case when qlen >= 2 and e.name ilike ql || '%'      then  60 else 0 end)
        + (case when qlen >= 2 and exists (select 1 from unnest(e.aliases) a
                                            where lower(a) = ql or a ilike ql || '%')
                                                              then  50 else 0 end)
        + (case when qlen >= 2 and qword <> '' and e.name ~* ('\m' || qword)
                                                              then  40 else 0 end)
        + (case when qlen >= 2 and similarity(e.name, ql) > 0.25
                                                then 30 * similarity(e.name, ql) else 0 end)
        + e.popularity * 0.2
        + (case when exists (select 1 from public.user_exercise_preferences p
                              where p.user_id = v_uid and p.exercise_id = e.id
                                and p.preference = 'favorite')  then 15 else 0 end)
      )::real as sc,
      (case when qlen >= 2 and (
              lower(e.name) = ql
           or e.name ilike ql || '%'
           or exists (select 1 from unnest(e.aliases) a where lower(a) = ql or a ilike ql || '%')
           or (qword <> '' and e.name ~* ('\m' || qword))
           or similarity(e.name, ql) > 0.25
            ) then true else false end) as matched
    from public.exercises e
    where e.is_active
      and (category_slug is null or e.category_id = v_cat)
      and (not filter_equipment or public._feasible(e.id, v_all_owned, v_uid))
      and not exists (select 1 from public.user_exercise_preferences x
                       where x.user_id = v_uid and x.exercise_id = e.id
                         and x.preference = 'excluded')
  )
  select ex_id, ex_slug, ex_name, m_alias, sc
  from scored
  where qlen < 2 or matched
  order by sc desc, ex_name asc
  limit p_limit;
end $$;

-- ---------------------------------------------------------------------
-- §5.3 / §7.1  search_foods  — type-ahead over the curated food catalog
-- ---------------------------------------------------------------------
create or replace function public.search_foods(
  q                 text,
  p_limit           int     default 10,
  apply_diet_filter boolean default true
) returns table (
  food_id       uuid,
  slug          text,
  name          text,
  brand         text,
  kcal          numeric,
  protein_g     numeric,
  serving_name  text,
  serving_grams numeric,
  score         real
) language plpgsql stable security invoker as $$
declare
  v_uid       uuid := auth.uid();
  ql          text := lower(trim(coalesce(q, '')));
  qlen        int  := length(lower(trim(coalesce(q, ''))));
  qword       text := regexp_replace(lower(trim(coalesce(q, ''))), '[^a-z0-9 ]', '', 'g');
  v_diet      diet_type;
  v_allergies text[];
begin
  select diet_type, allergies into v_diet, v_allergies
    from public.nutrition_profiles where user_id = v_uid;
  v_diet      := coalesce(v_diet, 'none');
  v_allergies := coalesce(v_allergies, '{}');

  return query
  with scored as (
    select
      f.id            as fid,
      f.slug          as fslug,
      f.name          as fname,
      f.brand         as fbrand,
      f.kcal          as fkcal,
      f.protein_g     as fprot,
      f.serving_name  as fserv,
      f.serving_grams as fgrams,
      (
          (case when qlen >= 2 and lower(f.name) = ql          then 100 else 0 end)
        + (case when qlen >= 2 and f.name ilike ql || '%'      then  60 else 0 end)
        + (case when qlen >= 2 and qword <> '' and f.name ~* ('\m' || qword)
                                                              then  40 else 0 end)
        + (case when qlen >= 2 and similarity(f.name, ql) > 0.25
                                                then 30 * similarity(f.name, ql) else 0 end)
        + (case when f.verified then 5 else 0 end)
        + (case when exists (select 1 from public.user_food_preferences p
                              where p.user_id = v_uid and p.food_id = f.id
                                and p.preference = 'favorite')  then 15 else 0 end)
        + (case when exists (select 1 from public.nutrition_logs nl
                              where nl.user_id = v_uid and nl.food_id = f.id
                                and nl.logged_on >= current_date - 14) then 10 else 0 end)
        -- keto: soft de-prioritise non-keto foods (§7.2.3)
        + (case when apply_diet_filter and v_diet = 'keto'
                     and not ('keto_friendly' = any (f.diet_tags)) then -50 else 0 end)
        -- mediterranean: soft −20 on snacks (§7.2.3)
        + (case when apply_diet_filter and v_diet = 'mediterranean'
                     and f.category = 'snack' then -20 else 0 end)
      )::real as sc,
      (case when qlen >= 2 and (
              lower(f.name) = ql
           or f.name ilike ql || '%'
           or (qword <> '' and f.name ~* ('\m' || qword))
           or similarity(f.name, ql) > 0.25
            ) then true else false end) as matched
    from public.foods f
    where f.is_active
      -- allergies always hard-filter when the diet filter is engaged (§7.1/§7.2.3)
      and (not apply_diet_filter or not (f.allergen_tags && v_allergies))
      -- diet-type hard predicate for the vegetarian family (§7.2.3)
      and (
            not apply_diet_filter
         or v_diet not in ('vegan', 'vegetarian', 'pescatarian')
         or (v_diet = 'vegan'       and 'vegan' = any (f.diet_tags))
         or (v_diet = 'vegetarian'  and ('vegetarian' = any (f.diet_tags)
                                         or 'vegan' = any (f.diet_tags)))
         or (v_diet = 'pescatarian' and ('vegetarian' = any (f.diet_tags)
                                         or 'vegan' = any (f.diet_tags)
                                         or 'pescatarian_ok' = any (f.diet_tags)))
          )
  )
  select fid, fslug, fname, fbrand, fkcal, fprot, fserv, fgrams, sc
  from scored
  where qlen < 2 or matched
  order by sc desc, fname asc
  limit p_limit;
end $$;

-- ---------------------------------------------------------------------
-- §5.3 / §7.4  suggest_substitutes  — the core substitution engine
-- ---------------------------------------------------------------------
create or replace function public.suggest_substitutes(
  p_exercise_id uuid,
  p_limit       int default 5
) returns table (
  exercise_id uuid,
  slug        text,
  name        text,
  score       real,
  reason      text
) language plpgsql stable security invoker as $$
declare
  v_uid       uuid := auth.uid();
  v_all_owned boolean;
  v_eq_count  int;
  v_location  training_location;
  v_exp_rank  int;
  v_pinned    uuid;
begin
  select count(*) into v_eq_count from public.user_equipment where user_id = v_uid;
  select training_location, public._level_rank(experience_level::text)
    into v_location, v_exp_rank
    from public.profiles where id = v_uid;
  v_exp_rank  := coalesce(v_exp_rank, 3);
  v_all_owned := (v_uid is null)
              or (v_eq_count = 0 and (v_location is null or v_location = 'commercial_gym'));

  -- Step 3: user-pinned preferred substitute
  select uep.preferred_substitute_id into v_pinned
    from public.user_exercise_preferences uep
    where uep.user_id = v_uid and uep.exercise_id = p_exercise_id;

  return query
  with tgt as (
    select
      e.id, e.movement_pattern, e.mechanics, e.difficulty,
      coalesce((select array_agg(em.muscle_id) from public.exercise_muscles em
                 where em.exercise_id = e.id and em.role = 'primary'), '{}')   as pm,
      coalesce((select array_agg(em.muscle_id) from public.exercise_muscles em
                 where em.exercise_id = e.id and em.role = 'secondary'), '{}') as sm
    from public.exercises e where e.id = p_exercise_id
  ),
  cand as (   -- Steps 1 & 2: feasible, not excluded, not pattern-excluded
    select
      c.id, c.slug, c.name, c.movement_pattern, c.mechanics, c.difficulty,
      c.popularity, c.is_bodyweight_ok,
      coalesce((select array_agg(em.muscle_id) from public.exercise_muscles em
                 where em.exercise_id = c.id and em.role = 'primary'), '{}')   as c_pm,
      coalesce((select array_agg(em.muscle_id) from public.exercise_muscles em
                 where em.exercise_id = c.id and em.role = 'secondary'), '{}') as c_sm,
      t.id as t_id, t.movement_pattern as t_pattern, t.mechanics as t_mech,
      t.pm as t_pm, t.sm as t_sm
    from public.exercises c cross join tgt t
    where c.is_active
      and c.id <> t.id
      and public._feasible(c.id, v_all_owned, v_uid)
      and not exists (select 1 from public.user_exercise_preferences x
                       where x.user_id = v_uid and x.exercise_id = c.id
                         and x.preference = 'excluded')
      and not exists (select 1 from public.user_movement_exclusions m
                       where m.user_id = v_uid and m.movement_pattern = c.movement_pattern)
  ),
  scored as (   -- Step 4: score every candidate
    select
      cand.*,
      (
          coalesce((select es.similarity from public.exercise_substitutions es
                     where es.exercise_id = cand.t_id and es.substitute_id = cand.id), 0)
        + 30.0 * (select count(*) from unnest(cand.t_pm) x where x = any (cand.c_pm))
                 / greatest(1, cardinality(cand.t_pm))
        + 10.0 * (select count(*) from unnest(cand.t_sm) x
                    where x = any (cand.c_pm) or x = any (cand.c_sm))
                 / greatest(1, cardinality(cand.t_sm))
        + case when cand.movement_pattern = cand.t_pattern then 25 else 0 end
        + case when cand.mechanics = cand.t_mech           then 10 else 0 end
        - 15 * greatest(0, public._level_rank(cand.difficulty::text) - v_exp_rank)
        + case when exists (select 1 from public.user_exercise_preferences f
                             where f.user_id = v_uid and f.exercise_id = cand.id
                               and f.preference = 'favorite') then 10 else 0 end
        + cand.popularity * 0.05
      )::real as sc
    from cand
  ),
  final as (   -- Step 5: pin override + drop < 20
    select
      s.id, s.slug, s.name, s.popularity, s.is_bodyweight_ok,
      s.movement_pattern, s.t_pattern, s.t_id,
      case when s.id = v_pinned then 1000::real else s.sc end as sc
    from scored s
    where s.id = v_pinned or s.sc >= 20
  )
  select
    f.id, f.slug, f.name, f.sc,
    -- Step 6: reason
    coalesce(
      case when f.id = v_pinned then 'You chose this substitute' else null end,
      (select es.reason from public.exercise_substitutions es
         where es.exercise_id = f.t_id and es.substitute_id = f.id and es.reason is not null),
      'Targets ' || coalesce((select string_agg(m.name, ', ' order by m.name)
                                from public.exercise_muscles em
                                join public.muscles m on m.id = em.muscle_id
                               where em.exercise_id = f.id and em.role = 'primary'),
                             'similar muscles')
        || case when f.movement_pattern = f.t_pattern then ', same movement pattern' else '' end
        || case when f.is_bodyweight_ok then ', no equipment needed'
                else ', uses ' || coalesce((select string_agg(distinct eq.name, ', ')
                                              from public.exercise_equipment ee
                                              join public.equipment eq on eq.id = ee.equipment_id
                                              left join public.user_equipment ue
                                                on ue.equipment_id = eq.id and ue.user_id = v_uid
                                             where ee.exercise_id = f.id
                                               and (ue.user_id is not null or v_all_owned)),
                                           'available equipment') end
    ) as reason
  from final f
  order by f.sc desc, f.popularity desc, f.name asc
  limit p_limit;
end $$;

-- ---------------------------------------------------------------------
-- §5.3 / §7.2.5  suggest_onboarding_defaults  — pure schedule/prescription matrix
-- ---------------------------------------------------------------------
create or replace function public.suggest_onboarding_defaults(
  p_goal       goal_type,
  p_experience experience_level
) returns table (
  days_per_week   int,
  session_minutes int,
  rep_min         int,
  rep_max         int,
  split_name      text
) language sql immutable as $$
  with base as (
    select
      case p_goal
        when 'strength'    then case p_experience when 'beginner' then 3 when 'intermediate' then 4 else 4 end
        when 'hypertrophy' then case p_experience when 'beginner' then 3 when 'intermediate' then 4 else 5 end
        when 'fat_loss'    then case p_experience when 'beginner' then 3 when 'intermediate' then 4 else 5 end
        when 'endurance'   then case p_experience when 'beginner' then 3 when 'intermediate' then 4 else 5 end
        else                    case p_experience when 'beginner' then 3 when 'intermediate' then 3 else 4 end
      end as d,
      case p_goal
        when 'strength'    then case p_experience when 'beginner' then 45 when 'intermediate' then 60 else 75 end
        when 'hypertrophy' then case p_experience when 'beginner' then 45 when 'intermediate' then 60 else 75 end
        when 'fat_loss'    then case p_experience when 'beginner' then 45 when 'intermediate' then 45 else 60 end
        when 'endurance'   then case p_experience when 'beginner' then 30 when 'intermediate' then 45 else 45 end
        else                    case p_experience when 'beginner' then 45 when 'intermediate' then 45 else 60 end
      end as s,
      case p_goal
        when 'strength'    then case when p_experience = 'beginner' then 5 else 3 end   -- 5-rep floor for beginners
        when 'hypertrophy' then case when p_experience = 'advanced' then 6 else 8 end
        when 'fat_loss'    then 10
        when 'endurance'   then 15
        else 8
      end as rmin,
      case p_goal
        when 'strength'    then 6
        when 'hypertrophy' then 12
        when 'fat_loss'    then 15
        when 'endurance'   then 20
        else 12
      end as rmax
  )
  select
    b.d, b.s, b.rmin, b.rmax,
    case
      when b.d <= 3 then 'Full Body'
      when b.d = 4  then 'Upper / Lower'
      when b.d = 5  then 'Upper / Lower / Push / Pull / Legs'
      else 'Push / Pull / Legs'
    end
  from base b;
$$;

-- ---------------------------------------------------------------------
-- §5.3 / §7.2.4  suggest_nutrition_targets  — Mifflin-St Jeor macro calc
-- ---------------------------------------------------------------------
create or replace function public.suggest_nutrition_targets()
returns table (
  kcal      int,
  protein_g int,
  carbs_g   int,
  fat_g     int,
  method    text
) language plpgsql stable security invoker as $$
declare
  v_uid    uuid := auth.uid();
  v_sex    sex_type;
  v_height numeric;
  v_birth  date;
  v_goal   goal_type;
  v_days   int;
  v_diet   diet_type;
  v_weight numeric;
  v_age    int;
  v_bmr    numeric;
  v_factor numeric;
  v_adj    numeric;
  v_kraw   numeric;
  v_kcal   int;
  v_floor  int;
  v_ppk    numeric;
  v_prot   int;
  v_fatpct numeric;
  v_fat    int;
  v_carbs  int;
  v_gtxt   text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select sex, height_cm, birthdate, primary_goal, days_per_week
    into v_sex, v_height, v_birth, v_goal, v_days
    from public.profiles where id = v_uid;
  select diet_type into v_diet from public.nutrition_profiles where user_id = v_uid;
  v_diet := coalesce(v_diet, 'none');
  v_days := coalesce(v_days, 3);

  -- latest recorded body weight; fall back to sex-median
  select weight_kg into v_weight from public.body_metrics
    where user_id = v_uid and weight_kg is not null
    order by measured_on desc limit 1;
  v_weight := coalesce(v_weight, case when v_sex = 'male' then 82
                                      when v_sex = 'female' then 70 else 76 end);
  v_height := coalesce(v_height, case when v_sex = 'male' then 175
                                      when v_sex = 'female' then 162 else 168 end);
  v_age    := coalesce(extract(year from age(current_date, v_birth))::int, 30);

  -- 1. BMR (Mifflin-St Jeor); other/unspecified = mean of the male/female constants (−78)
  v_bmr := 10 * v_weight + 6.25 * v_height - 5 * v_age
         + case v_sex when 'male' then 5 when 'female' then -161 else -78 end;

  -- 2. activity factor from training frequency
  v_factor := case when v_days <= 2 then 1.35 when v_days <= 4 then 1.5 else 1.65 end;

  -- 3. goal adjustment + calorie floor
  v_adj := case v_goal
             when 'fat_loss'    then 0.80
             when 'strength'    then 1.08
             when 'hypertrophy' then 1.08
             when 'endurance'   then 1.05
             else 1.00
           end;
  v_kraw  := v_bmr * v_factor * v_adj;
  v_floor := case when v_sex = 'male' then 1500 else 1200 end;
  v_kraw  := greatest(v_kraw, v_floor);
  v_kcal  := (round(v_kraw / 50.0) * 50)::int;         -- round to nearest 50

  -- 4. macros
  v_ppk := case when v_diet = 'keto' then 1.6
                when v_goal in ('fat_loss', 'strength', 'hypertrophy') then 1.8
                when v_goal = 'endurance' then 1.4
                else 1.6 end;
  v_prot := (round(least(v_ppk * v_weight, 220) / 5.0) * 5)::int;   -- g/kg, cap 220, nearest 5

  v_fatpct := case when v_diet = 'keto' then 0.65 else 0.30 end;
  v_fat    := (round((v_fatpct * v_kcal / 9.0) / 5.0) * 5)::int;    -- % kcal, nearest 5

  v_carbs  := (round(greatest(0, (v_kcal - 4 * v_prot - 9 * v_fat) / 4.0) / 5.0) * 5)::int;

  -- 5. explanation string
  v_gtxt := case v_goal
              when 'fat_loss'    then ' − 20% (fat loss)'
              when 'strength'    then ' + 8% (strength)'
              when 'hypertrophy' then ' + 8% (hypertrophy)'
              when 'endurance'   then ' + 5% (endurance)'
              else ' (general health)'
            end;

  return query
    select v_kcal, v_prot, v_carbs, v_fat,
           'Mifflin-St Jeor × ' || v_factor::text || v_gtxt
           || case when v_diet = 'keto' then ', keto macros' else '' end;
end $$;

-- ---------------------------------------------------------------------
-- §5.3 / §7.5  generate_starter_routine  — build the full routine tree
--   security definer (validates auth.uid() internally); deactivates prior active.
-- ---------------------------------------------------------------------
create or replace function public.generate_starter_routine(p_name text default null)
returns uuid
language plpgsql volatile security definer set search_path = public as $$
declare
  v_uid        uuid := auth.uid();
  v_goal       goal_type;
  v_exp        experience_level;
  v_days       int;
  v_session    int;
  v_pref       smallint[];
  v_location   training_location;
  v_eq_count   int;
  v_all_owned  boolean;
  v_rep_min    int;
  v_rep_max    int;
  v_excluded   movement_pattern[];
  v_allow_rep  boolean;
  v_trim       int;
  v_program    text;
  v_template   jsonb;
  v_routine_id uuid;
  v_day        jsonb;
  v_day_id     uuid;
  v_day_label  text;
  v_slot       jsonb;
  v_patterns   movement_pattern[];
  v_used       uuid[] := '{}';
  v_day_groups text[];
  v_pick_id    uuid;
  v_pick_mech  mechanics_type;
  v_pick_group text;
  v_di         int := 0;
  v_slot_i     int;
  v_pos        int;
  v_weekday    smallint;
  v_sets       int;
  v_rest       int;
  v_rpe        numeric;
  -- reusable slot lists
  fba jsonb; fbb jsonb; fbc jsonb;
  upper_slots jsonb; lower_slots jsonb;
  push_slots jsonb; pull_slots jsonb; legs_slots jsonb; cardio_slots jsonb;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select primary_goal, experience_level, days_per_week, session_minutes,
         preferred_days, training_location
    into v_goal, v_exp, v_days, v_session, v_pref, v_location
    from public.profiles where id = v_uid;
  v_goal    := coalesce(v_goal, 'general_health');
  v_exp     := coalesce(v_exp, 'beginner');
  v_days    := coalesce(v_days, 3);
  v_session := coalesce(v_session, 60);
  v_pref    := coalesce(v_pref, '{}');

  select count(*) into v_eq_count from public.user_equipment where user_id = v_uid;
  v_all_owned := (v_eq_count = 0 and (v_location is null or v_location = 'commercial_gym'));

  select array_agg(movement_pattern) into v_excluded
    from public.user_movement_exclusions where user_id = v_uid;
  v_excluded := coalesce(v_excluded, '{}');

  select rep_min, rep_max into v_rep_min, v_rep_max
    from public.suggest_onboarding_defaults(v_goal, v_exp);

  v_allow_rep := (v_days >= 4);  -- full body enforces one primary group per day; UL/PPL allow repeats
  v_trim := case when v_session <= 30 then 4 when v_session <= 45 then 5
                 when v_session <= 60 then 6 else 7 end;

  -- Split slot templates (movement patterns; alternatives listed inside a slot). §7.5
  fba          := '[["squat"],["horizontal_push"],["horizontal_pull"],["hinge"],["core_stability"]]';
  fbb          := '[["hinge"],["vertical_push"],["vertical_pull"],["lunge"],["core_flexion"]]';
  fbc          := '[["squat"],["horizontal_push"],["horizontal_pull"],["hip_extension_iso"],["core_stability"]]';
  upper_slots  := '[["horizontal_push"],["horizontal_pull"],["vertical_push"],["vertical_pull"],["elbow_flexion"],["elbow_extension"]]';
  lower_slots  := '[["squat"],["hinge"],["lunge"],["knee_flexion_iso","hip_extension_iso"],["calf_raise"],["core_stability"]]';
  push_slots   := '[["horizontal_push"],["vertical_push"],["horizontal_push"],["elbow_extension"],["shoulder_isolation"]]';
  pull_slots   := '[["vertical_pull"],["horizontal_pull"],["shoulder_isolation"],["elbow_flexion"],["carry","core_stability"]]';
  legs_slots   := '[["squat"],["hinge"],["lunge"],["knee_extension_iso","knee_flexion_iso"],["calf_raise"],["core_stability"]]';
  cardio_slots := '[["cardio"]]';

  -- Program composition by days/week (§7.2.5 / §7.5)
  if v_days <= 1 then
    v_program  := 'Full Body';
    v_template := jsonb_build_array(jsonb_build_object('label','Full Body A','slots',fba));
  elsif v_days = 2 then
    v_program  := 'Full Body';
    v_template := jsonb_build_array(
        jsonb_build_object('label','Full Body A','slots',fba),
        jsonb_build_object('label','Full Body B','slots',fbb));
  elsif v_days = 3 then
    v_program  := 'Full Body';
    v_template := jsonb_build_array(
        jsonb_build_object('label','Full Body A','slots',fba),
        jsonb_build_object('label','Full Body B','slots',fbb),
        jsonb_build_object('label','Full Body C','slots',fbc));
  elsif v_days = 4 then
    v_program  := 'Upper / Lower';
    v_template := jsonb_build_array(
        jsonb_build_object('label','Upper A','slots',upper_slots),
        jsonb_build_object('label','Lower A','slots',lower_slots),
        jsonb_build_object('label','Upper B','slots',upper_slots),
        jsonb_build_object('label','Lower B','slots',lower_slots));
  elsif v_days = 5 then
    v_program  := 'Upper / Lower / Push / Pull / Legs';
    v_template := jsonb_build_array(
        jsonb_build_object('label','Upper','slots',upper_slots),
        jsonb_build_object('label','Lower','slots',lower_slots),
        jsonb_build_object('label','Push','slots',push_slots),
        jsonb_build_object('label','Pull','slots',pull_slots),
        jsonb_build_object('label','Legs','slots',legs_slots));
  elsif v_days = 6 then
    v_program  := 'Push / Pull / Legs';
    v_template := jsonb_build_array(
        jsonb_build_object('label','Push A','slots',push_slots),
        jsonb_build_object('label','Pull A','slots',pull_slots),
        jsonb_build_object('label','Legs A','slots',legs_slots),
        jsonb_build_object('label','Push B','slots',push_slots),
        jsonb_build_object('label','Pull B','slots',pull_slots),
        jsonb_build_object('label','Legs B','slots',legs_slots));
  else  -- 7
    v_program  := 'Push / Pull / Legs';
    v_template := jsonb_build_array(
        jsonb_build_object('label','Push A','slots',push_slots),
        jsonb_build_object('label','Pull A','slots',pull_slots),
        jsonb_build_object('label','Legs A','slots',legs_slots),
        jsonb_build_object('label','Push B','slots',push_slots),
        jsonb_build_object('label','Pull B','slots',pull_slots),
        jsonb_build_object('label','Legs B','slots',legs_slots),
        jsonb_build_object('label','Conditioning','slots',cardio_slots));
  end if;

  -- Deactivate prior active routine, then create the new one (partial unique index safe).
  update public.routines set is_active = false where user_id = v_uid and is_active;

  insert into public.routines (user_id, name, description, goal, source, is_active, start_date)
    values (v_uid, coalesce(p_name, 'Starter ' || v_program),
            'Auto-generated starter routine', v_goal, 'generated', true, current_date)
    returning id into v_routine_id;

  -- Build each day
  for v_day in select value from jsonb_array_elements(v_template) loop
    v_di := v_di + 1;
    v_day_label := v_day ->> 'label';
    v_weekday := case when array_length(v_pref, 1) >= v_di then v_pref[v_di] else null end;

    insert into public.routine_days (routine_id, day_index, name, focus, weekday)
      values (v_routine_id, v_di, 'Day ' || v_di || ' — ' || v_day_label, v_day_label, v_weekday)
      returning id into v_day_id;

    v_day_groups := '{}';
    v_pos := 0;
    v_slot_i := 0;

    for v_slot in select value from jsonb_array_elements(v_day -> 'slots') loop
      v_slot_i := v_slot_i + 1;
      exit when v_slot_i > v_trim;   -- session-length trim (§7.5 step 3)

      select array_agg(t.p::movement_pattern) into v_patterns
        from jsonb_array_elements_text(v_slot) as t(p);

      -- Step 4: pick the best feasible, non-excluded, not-yet-used exercise for the slot
      select e.id, e.mechanics,
             coalesce((select mg.slug
                         from public.exercise_muscles em
                         join public.muscles m       on m.id  = em.muscle_id
                         join public.muscle_groups mg on mg.id = m.muscle_group_id
                        where em.exercise_id = e.id and em.role = 'primary'
                        order by mg.slug limit 1), '')
        into v_pick_id, v_pick_mech, v_pick_group
      from public.exercises e
      where e.is_active
        and e.movement_pattern = any (v_patterns)
        and e.id <> all (v_used)
        and e.movement_pattern <> all (v_excluded)
        and public._feasible(e.id, v_all_owned, v_uid)
        and not exists (select 1 from public.user_exercise_preferences x
                         where x.user_id = v_uid and x.exercise_id = e.id
                           and x.preference = 'excluded')
        and (v_allow_rep
             or coalesce((select mg.slug
                            from public.exercise_muscles em
                            join public.muscles m       on m.id  = em.muscle_id
                            join public.muscle_groups mg on mg.id = m.muscle_group_id
                           where em.exercise_id = e.id and em.role = 'primary'
                           order by mg.slug limit 1), '') <> all (v_day_groups))
      order by (
          e.popularity * 0.4
        + case when exists (select 1 from public.user_exercise_preferences f
                             where f.user_id = v_uid and f.exercise_id = e.id
                               and f.preference = 'favorite') then 30 else 0 end
        + case when public._level_rank(e.difficulty::text)
                    <= public._level_rank(v_exp::text) then 20 else 0 end
        ) desc, e.popularity desc, e.name asc
      limit 1;

      if not found then continue; end if;   -- no feasible exercise → drop slot (§7.5 step 4)

      v_pos := v_pos + 1;

      -- Step 5: prescription
      v_sets := case when v_pick_mech = 'compound'
                     then (case when v_exp = 'beginner' then 3 else 4 end)
                     else 3 end;
      v_rest := case v_goal
                  when 'strength'    then case when v_pick_mech = 'compound' then 180 else 120 end
                  when 'hypertrophy' then case when v_pick_mech = 'compound' then 90  else 60  end
                  when 'fat_loss'    then case when v_pick_mech = 'compound' then 60  else 45  end
                  when 'endurance'   then case when v_pick_mech = 'compound' then 60  else 45  end
                  else                    case when v_pick_mech = 'compound' then 90  else 60  end
                end;
      v_rpe := case when v_exp = 'beginner' then null else 7 end;

      insert into public.routine_exercises
             (routine_day_id, position, exercise_id, sets, rep_min, rep_max, target_rpe, rest_seconds)
        values (v_day_id, v_pos, v_pick_id, v_sets, v_rep_min, v_rep_max, v_rpe, v_rest);

      v_used       := array_append(v_used, v_pick_id);
      v_day_groups := array_append(v_day_groups, v_pick_group);
    end loop;
  end loop;

  return v_routine_id;
end $$;

-- ---------------------------------------------------------------------
-- §5.3 / §2.2  onboarding_status  — completion contract check
-- ---------------------------------------------------------------------
create or replace function public.onboarding_status()
returns table (
  complete    boolean,
  missing     text[],
  resume_step text
) language plpgsql stable security invoker as $$
declare
  v_uid        uuid := auth.uid();
  v_missing    text[] := '{}';
  v_profile_ok boolean;
  v_nutri_ok   boolean;
  v_routine_ok boolean;
  v_completed  timestamptz;
  v_step       text;
  v_resume     text;
begin
  if v_uid is null then
    return query select false, array['auth']::text[], 'welcome'::text;
    return;
  end if;

  select (primary_goal is not null and experience_level is not null
          and training_location is not null and days_per_week is not null
          and session_minutes is not null),
         onboarding_completed_at, onboarding_step
    into v_profile_ok, v_completed, v_step
    from public.profiles where id = v_uid;
  v_profile_ok := coalesce(v_profile_ok, false);

  v_nutri_ok   := exists (select 1 from public.nutrition_profiles
                           where user_id = v_uid and kcal_target is not null);
  v_routine_ok := exists (select 1 from public.routines
                           where user_id = v_uid and is_active);

  if not v_profile_ok then v_missing := array_append(v_missing, 'profile'); end if;
  if not v_nutri_ok   then v_missing := array_append(v_missing, 'nutrition_targets'); end if;
  if not v_routine_ok then v_missing := array_append(v_missing, 'active_routine'); end if;

  v_resume := case
                when not v_profile_ok then 'goals'
                when not v_nutri_ok   then 'nutrition_prefs'
                when not v_routine_ok then 'plan_preview'
                else coalesce(v_step, 'done')
              end;

  return query
    select (cardinality(v_missing) = 0 and v_completed is not null), v_missing, v_resume;
end $$;

-- ---------------------------------------------------------------------
-- §5.3  set_user_equipment  — transactional replace of user_equipment
-- ---------------------------------------------------------------------
create or replace function public.set_user_equipment(equipment_slugs text[])
returns void
language plpgsql volatile security invoker as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  delete from public.user_equipment where user_id = v_uid;
  insert into public.user_equipment (user_id, equipment_id)
    select v_uid, e.id
      from public.equipment e
     where e.slug = any (equipment_slugs)
    on conflict do nothing;
end $$;

-- ---------------------------------------------------------------------
-- §5.3  log_food  — insert nutrition_logs with server-computed macro snapshots
-- ---------------------------------------------------------------------
create or replace function public.log_food(
  p_food_id   uuid,
  p_quantity_g numeric,
  p_meal_slot meal_slot,
  p_logged_on date default null
) returns uuid
language plpgsql volatile security invoker as $$
declare
  v_uid    uuid := auth.uid();
  v_id     uuid;
  v_factor numeric;
  f        record;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_quantity_g is null or p_quantity_g <= 0 then
    raise exception 'quantity must be positive';
  end if;

  select kcal, protein_g, carbs_g, fat_g into f
    from public.foods where id = p_food_id and is_active;
  if not found then raise exception 'food not found: %', p_food_id; end if;

  v_factor := p_quantity_g / 100.0;

  insert into public.nutrition_logs
         (user_id, logged_on, meal_slot, food_id, quantity_g, kcal, protein_g, carbs_g, fat_g)
    values (v_uid,
            coalesce(p_logged_on, (now() at time zone 'utc')::date),
            p_meal_slot, p_food_id, p_quantity_g,
            round(f.kcal      * v_factor, 1),
            round(f.protein_g * v_factor, 1),
            round(f.carbs_g   * v_factor, 1),
            round(f.fat_g     * v_factor, 1))
    returning id into v_id;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- §5.3  previous_sets  — last completed session's sets (workout-player ghosts)
-- ---------------------------------------------------------------------
create or replace function public.previous_sets(p_exercise_id uuid)
returns table (
  set_number smallint,
  reps       smallint,
  weight_kg  numeric,
  rpe        numeric
) language sql stable security invoker as $$
  with last_sess as (
    select sl.session_id
      from public.set_logs sl
      join public.workout_sessions ws on ws.id = sl.session_id
     where ws.user_id = auth.uid() and sl.exercise_id = p_exercise_id
     order by ws.started_at desc, sl.completed_at desc
     limit 1
  )
  select sl.set_number, sl.reps, sl.weight_kg, sl.rpe
    from public.set_logs sl
   where sl.session_id = (select session_id from last_sess)
     and sl.exercise_id = p_exercise_id
   order by sl.set_number;
$$;

-- ---------------------------------------------------------------------
-- Grants (§5.3: execute to authenticated; search/suggestion RPCs also to anon)
-- ---------------------------------------------------------------------
grant execute on function public._level_rank(text)                          to anon, authenticated;
grant execute on function public._feasible(uuid, boolean, uuid)             to anon, authenticated;

grant execute on function public.search_exercises(text, int, boolean, text) to anon, authenticated;
grant execute on function public.search_foods(text, int, boolean)           to anon, authenticated;
grant execute on function public.suggest_substitutes(uuid, int)             to anon, authenticated;
grant execute on function public.suggest_onboarding_defaults(goal_type, experience_level) to anon, authenticated;

grant execute on function public.suggest_nutrition_targets()                to authenticated;
grant execute on function public.generate_starter_routine(text)             to authenticated;
grant execute on function public.onboarding_status()                        to authenticated;
grant execute on function public.set_user_equipment(text[])                 to authenticated;
grant execute on function public.log_food(uuid, numeric, meal_slot, date)   to authenticated;
grant execute on function public.previous_sets(uuid)                        to authenticated;

grant select on public.v_exercise_full   to anon, authenticated;
grant select on public.v_daily_nutrition to anon, authenticated;
grant select on public.v_exercise_prs    to anon, authenticated;
