#!/usr/bin/env tsx
/**
 * FitForge seed pipeline (WS-2), per blueprint §6.7.
 *
 *   npm run seed:generate   -> validate, then write supabase/seed/seed.sql
 *   npm run seed:check       -> validate only (CI gate; no file writes)
 *
 * Reads seed/data/*.json, validates referential integrity + alt_group + macro
 * sanity, and emits an idempotent upsert seed.sql resolving slug FKs via lookups
 * in dependency order.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSeed, validateSeed } from './lib/validate.ts';
import { emitSeedSql } from './lib/emit.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, 'data');
const OUT_FILE = join(HERE, '..', 'supabase', 'seed', 'seed.sql');

function main(): void {
  const checkOnly = process.argv.slice(2).includes('check');

  const data = loadSeed(DATA_DIR);
  const { errors, warnings } = validateSeed(data);

  for (const w of warnings) console.warn(`  warning: ${w}`);
  if (errors.length > 0) {
    console.error(`\nSeed validation FAILED with ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const counts = {
    equipment: data.equipment.length,
    muscle_groups: data.muscles.groups.length,
    muscles: data.muscles.muscles.length,
    categories: data.categories.length,
    exercises: data.exercises.length,
    substitutions: data.substitutions.length,
    foods: data.foods.length,
  };
  console.log('Seed validation passed:', JSON.stringify(counts));

  if (checkOnly) {
    console.log('check mode: no files written.');
    return;
  }

  const sql = emitSeedSql(data);
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, sql, 'utf8');
  console.log(`Wrote ${OUT_FILE} (${sql.length} bytes).`);
}

main();
