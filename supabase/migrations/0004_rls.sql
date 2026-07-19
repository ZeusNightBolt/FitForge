-- =============================================================================
-- Row Level Security (§4.4)
-- Pattern A: catalog tables — RLS enabled, world-readable via a single select
--   policy for anon + authenticated. No write policies (writes only via
--   service_role, which bypasses RLS: seeding/admin).
-- Pattern B: user tables — RLS enabled, owner-only for all commands.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Pattern A — catalog tables (all 9)
-- -----------------------------------------------------------------------------
alter table public.equipment enable row level security;
create policy "catalog read" on public.equipment for select to anon, authenticated using (true);

alter table public.muscle_groups enable row level security;
create policy "catalog read" on public.muscle_groups for select to anon, authenticated using (true);

alter table public.muscles enable row level security;
create policy "catalog read" on public.muscles for select to anon, authenticated using (true);

alter table public.exercise_categories enable row level security;
create policy "catalog read" on public.exercise_categories for select to anon, authenticated using (true);

alter table public.exercises enable row level security;
create policy "catalog read" on public.exercises for select to anon, authenticated using (true);

alter table public.exercise_muscles enable row level security;
create policy "catalog read" on public.exercise_muscles for select to anon, authenticated using (true);

alter table public.exercise_equipment enable row level security;
create policy "catalog read" on public.exercise_equipment for select to anon, authenticated using (true);

alter table public.exercise_substitutions enable row level security;
create policy "catalog read" on public.exercise_substitutions for select to anon, authenticated using (true);

alter table public.foods enable row level security;
create policy "catalog read" on public.foods for select to anon, authenticated using (true);

-- -----------------------------------------------------------------------------
-- Pattern B — profiles (PK is the user id)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- inserts happen via the auth trigger (security definer); no insert policy needed

-- -----------------------------------------------------------------------------
-- Pattern B — tables with a user_id column: owner-only for all commands
-- -----------------------------------------------------------------------------
alter table public.user_equipment enable row level security;
create policy "own rows" on public.user_equipment for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.user_exercise_preferences enable row level security;
create policy "own rows" on public.user_exercise_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.user_movement_exclusions enable row level security;
create policy "own rows" on public.user_movement_exclusions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- nutrition_profiles: user_id is the PK; owner check on user_id
alter table public.nutrition_profiles enable row level security;
create policy "own rows" on public.nutrition_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.user_food_preferences enable row level security;
create policy "own rows" on public.user_food_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.routines enable row level security;
create policy "own rows" on public.routines for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.workout_sessions enable row level security;
create policy "own rows" on public.workout_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.meals enable row level security;
create policy "own rows" on public.meals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.nutrition_logs enable row level security;
create policy "own rows" on public.nutrition_logs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.body_metrics enable row level security;
create policy "own rows" on public.body_metrics for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.progress_photos enable row level security;
create policy "own rows" on public.progress_photos for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Pattern B — child tables without user_id: ownership through the parent
-- -----------------------------------------------------------------------------
alter table public.routine_days enable row level security;
create policy "own via routine" on public.routine_days for all
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

-- routine_exercises: via routine_days -> routines
alter table public.routine_exercises enable row level security;
create policy "own via routine day" on public.routine_exercises for all
  using (exists (
    select 1 from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_day_id and r.user_id = auth.uid()))
  with check (exists (
    select 1 from public.routine_days d
    join public.routines r on r.id = d.routine_id
    where d.id = routine_day_id and r.user_id = auth.uid()));

-- set_logs: via workout_sessions
alter table public.set_logs enable row level security;
create policy "own via session" on public.set_logs for all
  using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- meal_items: via meals
alter table public.meal_items enable row level security;
create policy "own via meal" on public.meal_items for all
  using (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid()));

-- =============================================================================
-- Storage buckets & policies (§4.4)
-- Buckets are declared in config.toml; also created here idempotently so
-- `supabase db reset` provisions them for local/CI stacks.
--   exercise-media  : public read
--   progress-photos : private; owner-scoped by first path segment == uid
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- exercise-media: world-readable
create policy "exercise media public read" on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'exercise-media');

-- progress-photos: owner-only select/insert/delete, scoped by folder = uid
create policy "own progress photos select" on storage.objects for select
  to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own progress photos insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own progress photos delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
