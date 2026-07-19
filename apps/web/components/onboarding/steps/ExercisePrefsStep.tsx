'use client';

import * as React from 'react';
import { Chip, SearchInput } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useOnboarding } from '../OnboardingProvider';
import { useCatalogSearch, type ExerciseHit } from '../useCatalogSearch';
import type { NamedRef } from '../types';
import { OnboardingFooter } from '../OnboardingFooter';

/** Screen 7 · Exercises you enjoy (§2.2 / §7.3). Type-ahead multi-select + suggestion chips. */
export function ExercisePrefsStep() {
  const { draft, patch } = useOnboarding();
  const supabase = React.useMemo(() => createClient(), []);
  const { searchExercises } = useCatalogSearch();
  const [suggestions, setSuggestions] = React.useState<NamedRef[]>([]);

  const favoriteIds = React.useMemo(() => new Set(draft.favorites.map((f) => f.id)), [draft.favorites]);

  // §7.3 suggestion chips: top popular feasible exercises (empty-query popularity variant).
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    supabase
      .rpc('search_exercises', { q: '', p_limit: 8, filter_equipment: true, category_slug: null })
      .abortSignal(controller.signal)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSuggestions(
          (data as ExerciseHit[]).map((r) => ({ id: r.exercise_id, slug: r.slug, name: r.name })),
        );
      })
      .catch(() => {
        /* empty-query may be unsupported until WS-6 lands — degrade to no chips */
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [supabase]);

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
