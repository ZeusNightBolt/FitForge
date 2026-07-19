-- User A cannot read user B's owner-scoped rows (routines) nor parent-scoped
-- rows (set_logs, via workout_sessions). Uses supabase_test_helpers.
begin;
create extension if not exists pgtap;

select plan(6);

-- Catalog fixture (as superuser, bypasses RLS): category + exercise for FK targets.
insert into public.exercise_categories (id, slug, name)
  values ('c0000000-0000-0000-0000-000000000009', 'iso-cat', 'Isolation Test Cat');
insert into public.exercises (id, slug, name, category_id, movement_pattern, mechanics)
  values ('20000000-0000-0000-0000-000000000009', 'iso-bench', 'Isolation Bench',
          'c0000000-0000-0000-0000-000000000009', 'horizontal_push', 'compound');

-- Two users (each gets a profiles row via the on_auth_user_created trigger).
select tests.create_supabase_user('user_a');
select tests.create_supabase_user('user_b');

-- ---- User A creates a routine, a session, and a set_log ----
select tests.authenticate_as('user_a');

insert into public.routines (id, user_id, name, source)
  values ('33000000-0000-0000-0000-00000000000a', tests.get_supabase_uid('user_a'), 'A Routine', 'custom');

insert into public.workout_sessions (id, user_id)
  values ('44000000-0000-0000-0000-00000000000a', tests.get_supabase_uid('user_a'));

insert into public.set_logs (session_id, exercise_id, exercise_name_snapshot, set_number, reps, weight_kg)
  values ('44000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000009',
          'Isolation Bench', 1, 8, 60);

-- Sanity: A sees own rows.
select is((select count(*) from public.routines where id = '33000000-0000-0000-0000-00000000000a')::bigint,
          1::bigint, 'user A sees own routine');
select is((select count(*) from public.set_logs where session_id = '44000000-0000-0000-0000-00000000000a')::bigint,
          1::bigint, 'user A sees own set_log');

-- ---- User B must not see any of A's rows ----
select tests.authenticate_as('user_b');

select is((select count(*) from public.routines)::bigint, 0::bigint,
          'user B cannot read user A routines');
select is((select count(*) from public.set_logs)::bigint, 0::bigint,
          'user B cannot read user A set_logs');
select is((select count(*) from public.routines where id = '33000000-0000-0000-0000-00000000000a')::bigint,
          0::bigint, 'user B cannot read A routine by id');
select is((select count(*) from public.workout_sessions)::bigint, 0::bigint,
          'user B cannot read user A workout_sessions');

select * from finish();
rollback;
