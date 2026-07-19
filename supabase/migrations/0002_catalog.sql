create table public.equipment (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  category       equipment_category not null,
  description    text,
  common_in_home boolean not null default false,
  common_in_gym  boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.muscle_groups (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  region        muscle_region not null,
  display_order smallint not null default 0
);

create table public.muscles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  latin_name      text,
  muscle_group_id uuid not null references public.muscle_groups(id),
  is_front        boolean not null default true
);
create index muscles_group_idx on public.muscles (muscle_group_id);

create table public.exercise_categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  display_order smallint not null default 0
);

create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  aliases          text[] not null default '{}',
  category_id      uuid not null references public.exercise_categories(id),
  movement_pattern movement_pattern not null,
  mechanics        mechanics_type not null,
  difficulty       difficulty_level not null default 'beginner',
  is_unilateral    boolean not null default false,
  is_bodyweight_ok boolean not null default false, -- performable with zero equipment
  instructions     text,                            -- markdown
  video_url        text,
  image_path       text,                            -- Supabase Storage path in bucket 'exercise-media'
  tags             text[] not null default '{}',
  popularity       smallint not null default 50 check (popularity between 0 and 100),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index exercises_name_trgm_idx  on public.exercises using gin (name gin_trgm_ops);
create index exercises_aliases_idx    on public.exercises using gin (aliases);
create index exercises_tags_idx       on public.exercises using gin (tags);
create index exercises_category_idx   on public.exercises (category_id);
create index exercises_pattern_idx    on public.exercises (movement_pattern);

create table public.exercise_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_id   uuid not null references public.muscles(id),
  role        muscle_role not null,
  primary key (exercise_id, muscle_id)
);
create index exercise_muscles_muscle_idx on public.exercise_muscles (muscle_id, role);

-- Equipment requirements. Rows sharing (exercise_id, alt_group) are ALTERNATIVES (any one
-- suffices); distinct alt_groups are ALL required. Exercise with no rows = no equipment needed.
create table public.exercise_equipment (
  exercise_id  uuid not null references public.exercises(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  alt_group    smallint not null default 1,
  primary key (exercise_id, equipment_id)
);
create index exercise_equipment_eq_idx on public.exercise_equipment (equipment_id);

create table public.exercise_substitutions (
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  substitute_id uuid not null references public.exercises(id) on delete cascade,
  similarity    smallint not null default 80 check (similarity between 0 and 100),
  reason        text,
  primary key (exercise_id, substitute_id),
  check (exercise_id <> substitute_id)
);

create table public.foods (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  brand         text,
  category      food_category not null,
  kcal          numeric(7,2) not null,   -- all per 100 g
  protein_g     numeric(6,2) not null,
  carbs_g       numeric(6,2) not null,
  fat_g         numeric(6,2) not null,
  fiber_g       numeric(6,2) not null default 0,
  sugar_g       numeric(6,2) not null default 0,
  sodium_mg     numeric(8,2) not null default 0,
  serving_name  text not null,           -- "1 large egg"
  serving_grams numeric(7,2) not null,
  diet_tags     text[] not null default '{}',   -- vegan, vegetarian, pescatarian_ok, keto_friendly, gluten_free, dairy_free
  allergen_tags text[] not null default '{}',   -- peanut, tree_nut, dairy, gluten, egg, soy, shellfish, fish, sesame
  verified      boolean not null default true,
  source        text not null default 'fitforge-curated',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index foods_name_trgm_idx on public.foods using gin (name gin_trgm_ops);
create index foods_diet_tags_idx on public.foods using gin (diet_tags);
create index foods_allergen_idx  on public.foods using gin (allergen_tags);

create trigger t_upd_equipment before update on public.equipment  for each row execute function set_updated_at();
create trigger t_upd_exercises before update on public.exercises  for each row execute function set_updated_at();
create trigger t_upd_foods     before update on public.foods      for each row execute function set_updated_at();
