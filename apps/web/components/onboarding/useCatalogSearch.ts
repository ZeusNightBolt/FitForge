'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ExerciseHit {
  exercise_id: string;
  slug: string;
  name: string;
  matched_alias: string | null;
  score: number;
}

export interface FoodHit {
  food_id: string;
  slug: string;
  name: string;
  brand: string | null;
  kcal: number;
  protein_g: number;
  serving_name: string;
  serving_grams: number;
  score: number;
}

/**
 * Type-ahead fetchers backed by the §5.3 RPCs (`search_exercises` / `search_foods`).
 * Honour the AbortSignal so `SearchInput` can cancel stale requests (§7.1).
 */
export function useCatalogSearch() {
  const supabase = React.useMemo(() => createClient(), []);

  const searchExercises = React.useCallback(
    async (
      q: string,
      signal: AbortSignal,
      opts?: { filterEquipment?: boolean; categorySlug?: string | null },
    ): Promise<ExerciseHit[]> => {
      const { data, error } = await supabase
        .rpc('search_exercises', {
          q,
          p_limit: 8,
          filter_equipment: opts?.filterEquipment ?? false,
          category_slug: opts?.categorySlug ?? null,
        })
        .abortSignal(signal);
      if (error) throw error;
      return (data ?? []) as ExerciseHit[];
    },
    [supabase],
  );

  const searchFoods = React.useCallback(
    async (q: string, signal: AbortSignal, applyDietFilter = true): Promise<FoodHit[]> => {
      const { data, error } = await supabase
        .rpc('search_foods', { q, p_limit: 8, apply_diet_filter: applyDietFilter })
        .abortSignal(signal);
      if (error) throw error;
      return (data ?? []) as FoodHit[];
    },
    [supabase],
  );

  return { searchExercises, searchFoods };
}
