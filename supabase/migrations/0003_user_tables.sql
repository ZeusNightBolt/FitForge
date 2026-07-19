create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  display_name            text,
  sex                     sex_type,
  birthdate               date,
  height_cm               numeric(5,1),
  unit_system             unit_system not null default 'metric',
  experience_level        experience_level,
  primary_goal            goal_type,
  secondary_goal          goal_type,
  training_location       training_location,
  days_per_week           smallint check (days_per_week between 1 and 7),
  session_minutes         smallint check (session_minutes between 15 and 180),
  preferred_days          smallint[] not null default '{}',  -- 0=Mon … 6=Sun
  onboarding_step         text not null default 'goals',     -- resume pointer
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- auto-create profile row on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.user_equipment (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  created_at   timestamptz not null default now(),
  primary key (user_id, equipment_id)
);

create table public.user_exercise_preferences (
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  exercise_id             uuid not null references public.exercises(id),
  preference              preference_type not null,
  exclusion_reason        exclusion_reason,
  preferred_substitute_id uuid references public.exercises(id),
  created_at              timestamptz not null default now(),
  primary key (user_id, exercise_id),
  check (preference = 'excluded' or exclusion_reason is null)
);

create table public.user_movement_exclusions (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  movement_pattern movement_pattern not null,
  reason           exclusion_reason not null default 'injury',
  source_body_area text,             -- 'shoulders','lower_back','knees','wrists','hips','neck','elbows'
  created_at       timestamptz not null default now(),
  primary key (user_id, movement_pattern)
);

create table public.nutrition_profiles (
  user_id          uuid primary key references public.profiles(id) on delete cascade,
  diet_type        diet_type not null default 'none',
  allergies        text[] not null default '{}',   -- allergen tag slugs
  meals_per_day    smallint not null default 3 check (meals_per_day between 1 and 6),
  kcal_target      integer,
  protein_g_target integer,
  carbs_g_target   integer,
  fat_g_target     integer,
  targets_source   targets_source not null default 'suggested',
  updated_at       timestamptz not null default now()
);

create table public.user_food_preferences (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  food_id    uuid not null references public.foods(id),
  preference preference_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

create table public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  goal        goal_type,
  source      routine_source not null default 'custom',
  is_active   boolean not null default false,
  start_date  date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index routines_one_active_idx on public.routines (user_id) where is_active;
create index routines_user_idx on public.routines (user_id);

create table public.routine_days (
  id         uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day_index  smallint not null,
  name       text not null,
  focus      text,
  weekday    smallint check (weekday between 0 and 6),
  unique (routine_id, day_index)
);

create table public.routine_exercises (
  id             uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  position       smallint not null,
  exercise_id    uuid not null references public.exercises(id),
  sets           smallint not null default 3 check (sets between 1 and 10),
  rep_min        smallint not null default 8,
  rep_max        smallint not null default 12,
  target_rpe     numeric(3,1) check (target_rpe between 1 and 10),
  rest_seconds   smallint not null default 90,
  superset_group smallint,
  notes          text,
  unique (routine_day_id, position),
  check (rep_min <= rep_max)
);
create index routine_exercises_day_idx on public.routine_exercises (routine_day_id);

create table public.workout_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  routine_day_id   uuid references public.routine_days(id) on delete set null,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  perceived_effort smallint check (perceived_effort between 1 and 10),
  notes            text
);
create index workout_sessions_user_idx on public.workout_sessions (user_id, started_at desc);

create table public.set_logs (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id            uuid not null references public.exercises(id),
  exercise_name_snapshot text not null,
  set_number             smallint not null,
  reps                   smallint not null check (reps >= 0),
  weight_kg              numeric(6,2) not null default 0,
  rpe                    numeric(3,1) check (rpe between 1 and 10),
  is_warmup              boolean not null default false,
  completed_at           timestamptz not null default now()
);
create index set_logs_session_idx  on public.set_logs (session_id);
create index set_logs_exercise_idx on public.set_logs (exercise_id, completed_at desc);

create table public.meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.meal_items (
  id         uuid primary key default gen_random_uuid(),
  meal_id    uuid not null references public.meals(id) on delete cascade,
  food_id    uuid not null references public.foods(id),
  quantity_g numeric(7,2) not null check (quantity_g > 0)
);

create table public.nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  logged_on   date not null default (now() at time zone 'utc')::date,
  meal_slot   meal_slot not null,
  food_id     uuid references public.foods(id),
  custom_name text,
  quantity_g  numeric(7,2),
  kcal        numeric(7,1) not null,   -- snapshots, computed at insert
  protein_g   numeric(6,1) not null default 0,
  carbs_g     numeric(6,1) not null default 0,
  fat_g       numeric(6,1) not null default 0,
  created_at  timestamptz not null default now(),
  check (food_id is not null or custom_name is not null)
);
create index nutrition_logs_user_day_idx on public.nutrition_logs (user_id, logged_on);

create table public.body_metrics (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  measured_on  date not null default (now() at time zone 'utc')::date,
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  waist_cm     numeric(5,1),
  chest_cm     numeric(5,1),
  hips_cm      numeric(5,1),
  arm_cm       numeric(4,1),
  thigh_cm     numeric(4,1),
  neck_cm      numeric(4,1),
  notes        text,
  unique (user_id, measured_on)
);
create index body_metrics_user_idx on public.body_metrics (user_id, measured_on desc);

create table public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  taken_on     date not null default (now() at time zone 'utc')::date,
  pose         photo_pose not null default 'front',
  storage_path text not null,   -- bucket 'progress-photos', path '{user_id}/{uuid}.jpg'
  created_at   timestamptz not null default now()
);

create trigger t_upd_profiles  before update on public.profiles  for each row execute function set_updated_at();
create trigger t_upd_routines  before update on public.routines  for each row execute function set_updated_at();
create trigger t_upd_nutrition before update on public.nutrition_profiles for each row execute function set_updated_at();
