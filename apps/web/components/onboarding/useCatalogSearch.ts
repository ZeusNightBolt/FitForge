'use client';

import * as React from 'react';
import { mockSearchExercises, mockSearchFoods } from '@/components/features/_mock/data';

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
 * DEMO MODE type-ahead fetchers. The §7.1 ranking runs entirely in-memory over the fixture
 * catalog (`mockSearchExercises` / `mockSearchFoods`); the AbortSignal is accepted for API
 * compatibility with `SearchInput` but there is nothing to cancel.
 */
export function useCatalogSearch() {
  const searchExercises = React.useCallback(
    async (
      q: string,
      _signal?: AbortSignal,
      _opts?: { filterEquipment?: boolean; categorySlug?: string | null },
    ): Promise<ExerciseHit[]> => {
      return mockSearchExercises(q, 8).map((r) => ({
        exercise_id: r.exercise_id,
        slug: r.slug,
        name: r.name,
        matched_alias: r.matched_alias,
        score: r.score,
      }));
    },
    [],
  );

  const searchFoods = React.useCallback(
    async (q: string, _signal?: AbortSignal, _applyDietFilter = true): Promise<FoodHit[]> => {
      return mockSearchFoods(q, 8).map((f) => ({
        food_id: f.food_id,
        slug: f.slug,
        name: f.name,
        brand: f.brand,
        kcal: f.kcal,
        protein_g: f.protein_g,
        serving_name: f.serving_name,
        serving_grams: f.serving_grams,
        score: f.score,
      }));
    },
    [],
  );

  return { searchExercises, searchFoods };
}
