'use client';

/**
 * Exercises catalog (§6 P0-2 + P1-6): browse the catalog with text filters (category /
 * equipment / muscle) plus an interactive front/back muscle-map filter (tap a muscle →
 * filter the list). Every card carries a MuscleMapThumb so the page reads as data, not text.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, Chip, SearchInput, Sheet, Button } from '@/components/ui';
import { FilterIcon, SearchIcon, BodyIcon, XIcon } from '@/components/ui/icons';
import { MuscleMap, MuscleMapThumb, MUSCLE_NAMES } from '@/components/illustrations';
import type { MuscleSlug } from '@/components/illustrations';
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
  const [mapOpen, setMapOpen] = React.useState(false);

  const filtered = all.filter((ex) => {
    if (category && ex.category_slug !== category) return false;
    if (equipment && !matchesEquipment(ex, equipment)) return false;
    if (muscle && !ex.primary_muscles.includes(muscle) && !ex.secondary_muscles.includes(muscle))
      return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => b.popularity - a.popularity);
  const anyFilter = category !== null || equipment !== null || muscle !== null;

  const clearAll = () => {
    setCategory(null);
    setEquipment(null);
    setMuscle(null);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Exercises</h1>
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
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <FilterIcon size={15} /> Filters
          </div>
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            data-testid="muscle-filter-open"
            className="inline-flex items-center gap-1.5 rounded-field border border-border-strong px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent-muted"
          >
            <BodyIcon size={15} /> Muscle map
          </button>
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
          <button type="button" onClick={clearAll} className="text-sm font-semibold text-accent">
            Clear filters
          </button>
        )}
      </div>

      {/* Active muscle-map selection (may be outside the muscle facet chips). */}
      {muscle && (
        <button
          type="button"
          onClick={() => setMuscle(null)}
          className="inline-flex items-center gap-1.5 rounded-chip bg-accent-muted px-3 py-1 text-xs font-semibold text-accent"
        >
          {MUSCLE_NAMES[muscle as MuscleSlug] ?? muscle}
          <XIcon size={13} />
        </button>
      )}

      <ul className="space-y-2.5">
        {sorted.map((ex) => (
          <li key={ex.id}>
            <Link href={`/exercises/${ex.slug}`}>
              <Card interactive className="flex items-center gap-3 !py-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-sm bg-muted/60">
                  <MuscleMapThumb
                    primary={ex.primary_muscles as MuscleSlug[]}
                    secondary={ex.secondary_muscles as MuscleSlug[]}
                    height={48}
                  />
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

      {/* Interactive muscle-map filter (P1-6) */}
      <Sheet open={mapOpen} onClose={() => setMapOpen(false)} title="Filter by muscle">
        <p className="mb-3 text-sm text-muted-foreground">
          Tap a muscle on the front or back to filter the catalog.
        </p>
        <div className="flex justify-center">
          <MuscleMap
            view="both"
            height={300}
            interactive
            primary={muscle ? [muscle as MuscleSlug] : []}
            onMuscleClick={(slug) => {
              setMuscle(slug);
              setMapOpen(false);
            }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          {muscle && (
            <Button variant="secondary" className="flex-1" onClick={() => setMuscle(null)}>
              Clear muscle
            </Button>
          )}
          <Button className="flex-1" onClick={() => setMapOpen(false)}>
            Done
          </Button>
        </div>
      </Sheet>
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
