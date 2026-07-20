'use client';

/**
 * Exercises catalog (§2.3): browse v_exercise_full with filters by category / equipment / muscle,
 * plus a type-ahead (search_exercises). Rows link to the detail page. Mocked catalog.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, Chip, SearchInput } from '@/components/ui';
import {
  mockAllExercises,
  mockSearchExercises,
  EXERCISE_CATEGORIES,
  EQUIPMENT_FACETS,
  MUSCLE_FACETS,
  type ExerciseFull,
  type ExerciseSearchRow,
} from '@/components/features/_mock/data';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function matchesEquipment(ex: ExerciseFull, slug: string): boolean {
  if (slug === 'bodyweight') return ex.is_bodyweight_ok;
  return ex.equipment.some((g) => g.slugs.includes(slug));
}

export function ExerciseCatalog() {
  const all = mockAllExercises();
  const [category, setCategory] = React.useState<string | null>(null);
  const [equipment, setEquipment] = React.useState<string | null>(null);
  const [muscle, setMuscle] = React.useState<string | null>(null);

  const filtered = all.filter((ex) => {
    if (category && ex.category_slug !== category) return false;
    if (equipment && !matchesEquipment(ex, equipment)) return false;
    if (muscle && !ex.primary_muscles.includes(muscle) && !ex.secondary_muscles.includes(muscle))
      return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => b.popularity - a.popularity);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Exercises</h1>

      <SearchInput<ExerciseSearchRow>
        search={async (q) => mockSearchExercises(q, 8)}
        getKey={(r) => r.exercise_id}
        onSelect={(r) => {
          window.location.href = `/exercises/${r.slug}`;
        }}
        renderResult={(r) => <span className="font-medium">{r.name}</span>}
        placeholder="Search exercises…"
        aria-label="Search exercises"
      />

      {/* Filters */}
      <FilterRow label="Category" facets={EXERCISE_CATEGORIES} value={category} onChange={setCategory} />
      <FilterRow label="Equipment" facets={EQUIPMENT_FACETS} value={equipment} onChange={setEquipment} />
      <FilterRow label="Muscle" facets={MUSCLE_FACETS} value={muscle} onChange={setMuscle} />

      <p className="text-sm text-muted-foreground">
        {sorted.length} exercise{sorted.length === 1 ? '' : 's'}
      </p>

      <ul className="space-y-2">
        {sorted.map((ex) => (
          <li key={ex.id}>
            <Link href={`/exercises/${ex.slug}`}>
              <Card interactive className="flex items-center gap-3 !py-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-xl">
                  {'\u{1F3CB}\u{FE0F}'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{ex.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ex.category_name} · {ex.mechanics} · targets {ex.primary_muscles.join(', ')}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                  {DIFFICULTY_LABEL[ex.difficulty]}
                </span>
              </Card>
            </Link>
          </li>
        ))}
        {sorted.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No exercises match these filters.
          </li>
        )}
      </ul>
    </div>
  );
}

function FilterRow({
  label,
  facets,
  value,
  onChange,
}: {
  label: string;
  facets: { slug: string; name: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip selected={value === null} onClick={() => onChange(null)}>
          All
        </Chip>
        {facets.map((f) => (
          <Chip
            key={f.slug}
            selected={value === f.slug}
            onClick={() => onChange(value === f.slug ? null : f.slug)}
          >
            {f.name}
          </Chip>
        ))}
      </div>
    </div>
  );
}
