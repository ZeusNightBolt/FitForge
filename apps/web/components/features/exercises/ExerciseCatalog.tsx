'use client';

/**
 * Exercises catalog (§2.3): browse v_exercise_full with filters by category / equipment / muscle,
 * plus a type-ahead (search_exercises). Rows link to the detail page. Mocked catalog.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, Chip, SearchInput } from '@/components/ui';
import { DumbbellIcon, FilterIcon, SearchIcon } from '@/components/ui/icons';
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

const DIFFICULTY_STYLE: Record<string, string> = {
  beginner: 'bg-success/10 text-success',
  intermediate: 'bg-energy-muted text-energy',
  advanced: 'bg-danger/10 text-danger',
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
  const anyFilter = category !== null || equipment !== null || muscle !== null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Exercises</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Browse the catalog, filter by category, equipment, or muscle.
        </p>
      </header>

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
      <Card className="space-y-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <FilterIcon size={15} /> Filters
        </div>
        <FilterRow label="Category" facets={EXERCISE_CATEGORIES} value={category} onChange={setCategory} />
        <FilterRow label="Equipment" facets={EQUIPMENT_FACETS} value={equipment} onChange={setEquipment} />
        <FilterRow label="Muscle" facets={MUSCLE_FACETS} value={muscle} onChange={setMuscle} />
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{sorted.length}</span> exercise
          {sorted.length === 1 ? '' : 's'}
        </p>
        {anyFilter && (
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setEquipment(null);
              setMuscle(null);
            }}
            className="text-sm font-semibold text-accent"
          >
            Clear filters
          </button>
        )}
      </div>

      <ul className="space-y-2.5">
        {sorted.map((ex) => (
          <li key={ex.id}>
            <Link href={`/exercises/${ex.slug}`}>
              <Card interactive className="flex items-center gap-3 !py-3 shadow-[var(--shadow-card)]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent">
                  <DumbbellIcon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{ex.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <TagPill>{ex.category_name}</TagPill>
                    <TagPill>{ex.movement_pattern.replace(/_/g, ' ')}</TagPill>
                    <TagPill>{ex.mechanics}</TagPill>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    DIFFICULTY_STYLE[ex.difficulty] ?? 'bg-muted text-muted-foreground'
                  }`}
                >
                  {DIFFICULTY_LABEL[ex.difficulty]}
                </span>
              </Card>
            </Link>
          </li>
        ))}
        {sorted.length === 0 && (
          <li>
            <Card className="flex flex-col items-center gap-3 border-2 border-dashed border-border py-10 text-center shadow-none">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-muted text-accent">
                <SearchIcon size={24} />
              </span>
              <div>
                <p className="font-semibold text-foreground">No exercises match these filters</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Try clearing a filter to widen your results.
                </p>
              </div>
            </Card>
          </li>
        )}
      </ul>
    </div>
  );
}

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
      {children}
    </span>
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
