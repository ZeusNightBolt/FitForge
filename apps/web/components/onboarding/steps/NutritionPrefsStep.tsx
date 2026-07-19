'use client';

import * as React from 'react';
import type { DietType } from '@fitforge/shared/types';
import { ALLERGEN_TAGS, type AllergenTag } from '@fitforge/shared/types';
import { Chip, SelectableCardGrid, SearchInput, Stepper, type SelectableOption } from '@/components/ui';
import { useOnboarding } from '../OnboardingProvider';
import { useCatalogSearch, type FoodHit } from '../useCatalogSearch';
import type { NamedRef } from '../types';
import { OnboardingFooter } from '../OnboardingFooter';

const DIET_OPTIONS: SelectableOption<DietType>[] = [
  { value: 'omnivore', title: 'Omnivore', description: 'Everything on the table' },
  { value: 'vegetarian', title: 'Vegetarian', description: 'No meat or fish' },
  { value: 'vegan', title: 'Vegan', description: 'No animal products' },
  { value: 'pescatarian', title: 'Pescatarian', description: 'Vegetarian + seafood' },
  { value: 'keto', title: 'Keto', description: 'Very low carb, high fat' },
  { value: 'mediterranean', title: 'Mediterranean', description: 'Whole foods, healthy fats' },
  { value: 'none', title: 'Just track', description: 'No diet rules — log everything' },
];

const ALLERGEN_LABEL: Record<AllergenTag, string> = {
  peanut: 'Peanut',
  tree_nut: 'Tree nut',
  dairy: 'Dairy',
  gluten: 'Gluten',
  egg: 'Egg',
  soy: 'Soy',
  shellfish: 'Shellfish',
  fish: 'Fish',
  sesame: 'Sesame',
};

/** Screen 10 · Nutrition preferences (§2.2 / §7.2.3). */
export function NutritionPrefsStep() {
  const { draft, patch } = useOnboarding();
  const { searchFoods } = useCatalogSearch();

  const avoidIds = React.useMemo(() => new Set(draft.avoid_foods.map((f) => f.id)), [draft.avoid_foods]);

  const toggleAllergy = (tag: AllergenTag) => {
    const has = draft.allergies.includes(tag);
    patch({ allergies: has ? draft.allergies.filter((a) => a !== tag) : [...draft.allergies, tag] });
  };

  const addAvoid = (ref: NamedRef) => {
    if (avoidIds.has(ref.id)) return;
    patch({ avoid_foods: [...draft.avoid_foods, ref] });
  };
  const removeAvoid = (id: string) => {
    patch({ avoid_foods: draft.avoid_foods.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-8">
      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Diet style</p>
        <SelectableCardGrid
          options={DIET_OPTIONS}
          value={draft.diet_type}
          onChange={(v) => patch({ diet_type: v })}
          mode="single"
          columns={2}
        />
      </section>

      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Allergies</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_TAGS.map((tag) => (
            <Chip key={tag} selected={draft.allergies.includes(tag)} onClick={() => toggleAllergy(tag)}>
              {ALLERGEN_LABEL[tag]}
            </Chip>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          We&apos;ll hide foods containing anything you select.
        </p>
      </section>

      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Foods to avoid</p>
        <SearchInput<FoodHit>
          aria-label="Search foods to avoid"
          placeholder="Search foods…"
          search={(q, signal) => searchFoods(q, signal, true)}
          getKey={(r) => r.food_id}
          renderResult={(r) => (
            <span className="flex w-full items-center justify-between">
              <span>{r.name}</span>
              <span className="text-xs text-muted-foreground">{Math.round(r.kcal)} kcal/100g</span>
            </span>
          )}
          onSelect={(r) => addAvoid({ id: r.food_id, slug: r.slug, name: r.name })}
        />
        {draft.avoid_foods.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.avoid_foods.map((f) => (
              <Chip key={f.id} selected removable onRemove={() => removeAvoid(f.id)}>
                {f.name}
              </Chip>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="mb-3 text-sm font-medium text-foreground">Meals per day</p>
        <Stepper
          value={draft.meals_per_day}
          onChange={(n) => patch({ meals_per_day: n })}
          min={1}
          max={6}
          unit="meals"
          aria-label="Meals per day"
        />
      </section>

      <div className="flex-1" />
      <OnboardingFooter step="nutrition_prefs" skippable canContinue />
    </div>
  );
}
