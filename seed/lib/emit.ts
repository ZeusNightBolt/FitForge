/**
 * SQL emitter (WS-2). Turns validated seed data into an idempotent seed.sql
 * (blueprint §6.7). Every statement is `insert ... on conflict do update`, and
 * all foreign keys are resolved by slug via correlated sub-selects (lookups),
 * so the file can be applied to any migrated database in dependency order:
 *
 *   muscle_groups → muscles → exercise_categories → equipment → exercises →
 *   exercise_muscles / exercise_equipment / exercise_substitutions → foods
 */

import type { Equipment, Exercise, Food, SeedData } from './validate.ts';

// ---------- SQL literal helpers ----------

function q(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}
function num(n: number): string {
  return String(n);
}
function bool(b: boolean): string {
  return b ? 'true' : 'false';
}
/** Postgres text[] literal from a JS string array. */
function textArray(items: string[]): string {
  if (!items || items.length === 0) return `'{}'::text[]`;
  return `array[${items.map(q).join(', ')}]::text[]`;
}
/** sub-select resolving a catalog row id from its slug. */
function idOf(table: string, slug: string): string {
  return `(select id from public.${table} where slug = ${q(slug)})`;
}

// ---------- reason generation for substitutions ----------

const PATTERN_LABEL: Record<string, string> = {
  squat: 'squat', hinge: 'hip hinge', lunge: 'lunge', horizontal_push: 'horizontal press',
  vertical_push: 'overhead press', horizontal_pull: 'row', vertical_pull: 'pulldown',
  elbow_flexion: 'curl', elbow_extension: 'triceps extension', shoulder_isolation: 'shoulder raise',
  core_flexion: 'ab flexion', core_stability: 'core brace', carry: 'loaded carry',
  hip_extension_iso: 'hip extension', knee_flexion_iso: 'leg curl', knee_extension_iso: 'leg extension',
  calf_raise: 'calf raise', cardio: 'cardio',
};

function equipmentPhrase(ex: Exercise, equipmentBySlug: Map<string, Equipment>): string {
  if (ex.is_bodyweight_ok && ex.equipment.length === 0) return 'no equipment needed';
  if (ex.equipment.length === 0) return 'no equipment needed';
  const groups = ex.equipment.map((grp) =>
    grp.map((s) => equipmentBySlug.get(s)?.name ?? s).join('/'),
  );
  return `uses ${groups.join(' + ')}`;
}

/** Deterministic reason string, template "Same {pattern}, {equipment}" (blueprint §6.5/§7.4). */
export function substitutionReason(target: Exercise, equipmentBySlug: Map<string, Equipment>): string {
  const p = PATTERN_LABEL[target.movement_pattern] ?? target.movement_pattern;
  return `Same ${p}, ${equipmentPhrase(target, equipmentBySlug)}`;
}

// ---------- emitter ----------

export function emitSeedSql(data: SeedData): string {
  const equipmentBySlug = new Map(data.equipment.map((e) => [e.slug, e]));
  const exerciseBySlug = new Map(data.exercises.map((x) => [x.slug, x]));
  const out: string[] = [];

  out.push('-- ============================================================================');
  out.push('-- FitForge curated seed data.');
  out.push('-- GENERATED FILE — do not edit by hand. Source: seed/data/*.json + seed/generate.ts (WS-2).');
  out.push('-- Regenerate with: npm run seed:generate   (from the seed workspace)');
  out.push('-- Idempotent: every statement is insert ... on conflict do update.');
  out.push('-- ============================================================================');
  out.push('');
  out.push('begin;');
  out.push('');

  // 1. muscle_groups
  out.push('-- 1. muscle_groups');
  out.push('insert into public.muscle_groups (slug, name, region, display_order) values');
  out.push(
    data.muscles.groups
      .map((g) => `  (${q(g.slug)}, ${q(g.name)}, ${q(g.region)}, ${num(g.display_order)})`)
      .join(',\n') + '',
  );
  out.push('on conflict (slug) do update set');
  out.push('  name = excluded.name, region = excluded.region, display_order = excluded.display_order;');
  out.push('');

  // 2. muscles (FK muscle_group_id via slug lookup)
  out.push('-- 2. muscles');
  out.push('insert into public.muscles (slug, name, latin_name, muscle_group_id, is_front) values');
  out.push(
    data.muscles.muscles
      .map((m) =>
        `  (${q(m.slug)}, ${q(m.name)}, ${q(m.latin_name)}, ${idOf('muscle_groups', m.group)}, ${bool(m.is_front)})`,
      )
      .join(',\n'),
  );
  out.push('on conflict (slug) do update set');
  out.push('  name = excluded.name, latin_name = excluded.latin_name,');
  out.push('  muscle_group_id = excluded.muscle_group_id, is_front = excluded.is_front;');
  out.push('');

  // 3. exercise_categories
  out.push('-- 3. exercise_categories');
  out.push('insert into public.exercise_categories (slug, name, display_order) values');
  out.push(
    data.categories
      .map((c) => `  (${q(c.slug)}, ${q(c.name)}, ${num(c.display_order)})`)
      .join(',\n'),
  );
  out.push('on conflict (slug) do update set');
  out.push('  name = excluded.name, display_order = excluded.display_order;');
  out.push('');

  // 4. equipment
  out.push('-- 4. equipment');
  out.push('insert into public.equipment (slug, name, category, common_in_home, common_in_gym) values');
  out.push(
    data.equipment
      .map((e) =>
        `  (${q(e.slug)}, ${q(e.name)}, ${q(e.category)}, ${bool(e.common_in_home)}, ${bool(e.common_in_gym)})`,
      )
      .join(',\n'),
  );
  out.push('on conflict (slug) do update set');
  out.push('  name = excluded.name, category = excluded.category,');
  out.push('  common_in_home = excluded.common_in_home, common_in_gym = excluded.common_in_gym;');
  out.push('');

  // 5. exercises (FK category_id via slug lookup)
  out.push('-- 5. exercises');
  out.push(
    'insert into public.exercises (slug, name, category_id, movement_pattern, mechanics, difficulty,',
  );
  out.push('  is_unilateral, is_bodyweight_ok, instructions, tags, popularity) values');
  out.push(
    data.exercises
      .map((x) =>
        `  (${q(x.slug)}, ${q(x.name)}, ${idOf('exercise_categories', x.category)}, ` +
        `${q(x.movement_pattern)}, ${q(x.mechanics)}, ${q(x.difficulty)}, ` +
        `${bool(x.is_unilateral)}, ${bool(x.is_bodyweight_ok)}, ${q(x.instructions)}, ` +
        `${textArray([])}, ${num(x.popularity)})`,
      )
      .join(',\n'),
  );
  out.push('on conflict (slug) do update set');
  out.push('  name = excluded.name, category_id = excluded.category_id,');
  out.push('  movement_pattern = excluded.movement_pattern, mechanics = excluded.mechanics,');
  out.push('  difficulty = excluded.difficulty, is_unilateral = excluded.is_unilateral,');
  out.push('  is_bodyweight_ok = excluded.is_bodyweight_ok, instructions = excluded.instructions,');
  out.push('  popularity = excluded.popularity;');
  out.push('');

  // 6. exercise_muscles (FK exercise_id + muscle_id via slug lookup)
  out.push('-- 6. exercise_muscles');
  const muscleRows: string[] = [];
  for (const x of data.exercises) {
    for (const m of x.primary_muscles)
      muscleRows.push(`  (${idOf('exercises', x.slug)}, ${idOf('muscles', m)}, 'primary')`);
    for (const m of x.secondary_muscles)
      muscleRows.push(`  (${idOf('exercises', x.slug)}, ${idOf('muscles', m)}, 'secondary')`);
  }
  out.push('insert into public.exercise_muscles (exercise_id, muscle_id, role) values');
  out.push(muscleRows.join(',\n'));
  out.push('on conflict (exercise_id, muscle_id) do update set role = excluded.role;');
  out.push('');

  // 7. exercise_equipment (FK exercise_id + equipment_id; alt_group index)
  out.push('-- 7. exercise_equipment');
  const equipRows: string[] = [];
  for (const x of data.exercises) {
    x.equipment.forEach((grp, gi) => {
      for (const eq of grp)
        equipRows.push(`  (${idOf('exercises', x.slug)}, ${idOf('equipment', eq)}, ${num(gi + 1)})`);
    });
  }
  if (equipRows.length > 0) {
    out.push('insert into public.exercise_equipment (exercise_id, equipment_id, alt_group) values');
    out.push(equipRows.join(',\n'));
    out.push('on conflict (exercise_id, equipment_id) do update set alt_group = excluded.alt_group;');
    out.push('');
  }

  // 8. exercise_substitutions (FK exercise_id + substitute_id; generated reason)
  out.push('-- 8. exercise_substitutions');
  const subRows: string[] = [];
  for (const s of data.substitutions) {
    const target = exerciseBySlug.get(s.to)!;
    const reason = s.reason ?? substitutionReason(target, equipmentBySlug);
    subRows.push(
      `  (${idOf('exercises', s.from)}, ${idOf('exercises', s.to)}, ${num(s.similarity)}, ${q(reason)})`,
    );
  }
  out.push('insert into public.exercise_substitutions (exercise_id, substitute_id, similarity, reason) values');
  out.push(subRows.join(',\n'));
  out.push('on conflict (exercise_id, substitute_id) do update set');
  out.push('  similarity = excluded.similarity, reason = excluded.reason;');
  out.push('');

  // 9. foods
  out.push('-- 9. foods');
  out.push('insert into public.foods (slug, name, brand, category, kcal, protein_g, carbs_g, fat_g,');
  out.push('  fiber_g, sugar_g, sodium_mg, serving_name, serving_grams, diet_tags, allergen_tags,');
  out.push('  verified, source) values');
  out.push(
    data.foods
      .map((f: Food) =>
        `  (${q(f.slug)}, ${q(f.name)}, ${f.brand == null ? 'null' : q(f.brand)}, ${q(f.category)}, ` +
        `${num(f.kcal)}, ${num(f.protein_g)}, ${num(f.carbs_g)}, ${num(f.fat_g)}, ` +
        `${num(f.fiber_g)}, ${num(f.sugar_g)}, ${num(f.sodium_mg)}, ${q(f.serving_name)}, ` +
        `${num(f.serving_grams)}, ${textArray(f.diet_tags)}, ${textArray(f.allergen_tags)}, ` +
        `true, 'fitforge-curated')`,
      )
      .join(',\n'),
  );
  out.push('on conflict (slug) do update set');
  out.push('  name = excluded.name, brand = excluded.brand, category = excluded.category,');
  out.push('  kcal = excluded.kcal, protein_g = excluded.protein_g, carbs_g = excluded.carbs_g,');
  out.push('  fat_g = excluded.fat_g, fiber_g = excluded.fiber_g, sugar_g = excluded.sugar_g,');
  out.push('  sodium_mg = excluded.sodium_mg, serving_name = excluded.serving_name,');
  out.push('  serving_grams = excluded.serving_grams, diet_tags = excluded.diet_tags,');
  out.push('  allergen_tags = excluded.allergen_tags, verified = excluded.verified, source = excluded.source;');
  out.push('');

  out.push('commit;');
  out.push('');
  return out.join('\n');
}
