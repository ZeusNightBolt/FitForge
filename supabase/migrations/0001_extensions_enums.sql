create extension if not exists pg_trgm;
-- pgcrypto (gen_random_uuid) is enabled by default on Supabase

create type goal_type          as enum ('strength','hypertrophy','fat_loss','endurance','general_health');
create type experience_level   as enum ('beginner','intermediate','advanced');
create type training_location  as enum ('home','commercial_gym','minimal');
create type unit_system        as enum ('metric','imperial');
create type sex_type           as enum ('male','female','other','prefer_not_to_say');
create type equipment_category as enum ('free_weights','machines','cables','bodyweight_accessories','cardio','benches_racks');
create type muscle_region      as enum ('upper','lower','core');
create type movement_pattern   as enum ('squat','hinge','lunge','horizontal_push','vertical_push',
                                        'horizontal_pull','vertical_pull','elbow_flexion','elbow_extension',
                                        'shoulder_isolation','core_flexion','core_stability','carry',
                                        'hip_extension_iso','knee_flexion_iso','knee_extension_iso',
                                        'calf_raise','cardio');
create type mechanics_type     as enum ('compound','isolation');
create type difficulty_level   as enum ('beginner','intermediate','advanced');
create type muscle_role        as enum ('primary','secondary');
create type preference_type    as enum ('favorite','excluded');
create type exclusion_reason   as enum ('injury','dislike','no_equipment','other');
create type routine_source     as enum ('generated','custom');
create type food_category      as enum ('protein','grain','vegetable','fruit','dairy','fat_oil',
                                        'legume','nut_seed','beverage','snack','condiment');
create type diet_type          as enum ('omnivore','vegetarian','vegan','pescatarian','keto','mediterranean','none');
create type meal_slot          as enum ('breakfast','lunch','dinner','snack');
create type targets_source     as enum ('suggested','custom');
create type photo_pose         as enum ('front','side','back');

-- shared updated_at trigger
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
