'use client';

import * as React from 'react';
import { Chip, SearchInput } from '@/components/ui';
import { demoPopularExercises } from '@/lib/demo/catalog';
import { useOnboarding } from '../OnboardingProvider';
import { useCatalogSearch, type ExerciseHit } from '../useCatalogSearch';
import type { NamedRef } from '../types';
import { OnboardingFooter } from '../OnboardingFooter';

/** Screen 7 · Exercises you enjoy (§2.2 / §7.3). Type-ahead multi-select + suggestion chips. */
export function ExercisePrefsStep() {
  const { draft, patch } = useOnboarding();
  const { searchExercises } = useCatalogSearch();
  // §7.3 suggestion chips: top popular exercises from the fixture catalog.
  const suggestions = React.useMemo<NamedRef[]>(() => demoPopularExercises(8), []);

  const favoriteIds = React.useMemo(() => new Set(draft.favorites.map((f) => f.id)), [draft.favorites]);

  const addFavorite = (ref: NamedRef) => {
    if (favoriteIds.has(ref.id)) return;
    patch({ favorites: [...draft.favorites, ref] });
  };

  const removeFavorite = (id: string) => {
    patch({ favorites: draft.favorites.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-6">
      <SearchInput<ExerciseHit>
        aria-label="Search exercises"
        placeholder="Search exercises you enjoy…"
        search={(q, signal) => searchExercises(q, signal, { filterEquipment: true })}
        getKey={(r) => r.exercise_id}
        renderResult={(r) => (
          <span className="flex w-full items-center justify-between">
            <span>{r.name}</span>
            {favoriteIds.has(r.exercise_id) && <span className="text-xs text-accent">added</span>}
          </span>
        )}
        onSelect={(r) => addFavorite({ id: r.exercise_id, slug: r.slug, name: r.name })}
      />

      {draft.favorites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {draft.favorites.map((f) => (
            <Chip key={f.id} selected removable onRemove={() => removeFavorite(f.id)}>
              {f.name}
            </Chip>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <section>
          <p className="mb-3 text-sm font-medium text-foreground">Popular with your equipment</p>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter((s) => !favoriteIds.has(s.id))
              .map((s) => (
                <Chip key={s.id} leading="+" onClick={() => addFavorite(s)}>
                  {s.name}
                </Chip>
              ))}
          </div>
        </section>
      )}

      <div className="flex-1" />
      <OnboardingFooter step="exercise_prefs" skippable canContinue />
    </div>
  );
}
