'use client';

import * as React from 'react';
import type { EquipmentCategory } from '@fitforge/shared/types';
import { EQUIPMENT_CATEGORIES } from '@fitforge/shared/types';
import {
  equipmentPresetForLocation,
  equipmentDependencySuggestions,
} from '@fitforge/shared/rules';
import { Chip, SearchInput } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

interface EquipmentRow {
  slug: string;
  name: string;
  category: EquipmentCategory;
  common_in_home: boolean;
  common_in_gym: boolean;
}

const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  free_weights: 'Free weights',
  machines: 'Machines',
  cables: 'Cables',
  bodyweight_accessories: 'Bodyweight & accessories',
  cardio: 'Cardio',
  benches_racks: 'Benches & racks',
};

/** Screen 6 · Equipment (§2.2 / §7.2.1). Preset from location + type-ahead + dependency nudges. */
export function EquipmentStep() {
  const { draft, patch } = useOnboarding();
  const supabase = React.useMemo(() => createClient(), []);
  const [catalog, setCatalog] = React.useState<EquipmentRow[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  // Load the equipment catalog (world-readable).
  React.useEffect(() => {
    let cancelled = false;
    supabase
      .from('equipment')
      .select('slug,name,category,common_in_home,common_in_gym')
      .order('category')
      .order('name')
      .then(({ data }) => {
        if (cancelled) return;
        setCatalog((data ?? []) as EquipmentRow[]);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Apply the location preset once, when the catalog is available and nothing is selected yet.
  React.useEffect(() => {
    if (!loaded || catalog.length === 0) return;
    if (draft.equipment_slugs.length > 0) return;
    if (!draft.training_location) return;
    const { preset } = equipmentPresetForLocation(draft.training_location, catalog);
    if (preset.length > 0) patch({ equipment_slugs: preset });
  }, [loaded, catalog, draft.equipment_slugs.length, draft.training_location, patch]);

  const selected = React.useMemo(() => new Set(draft.equipment_slugs), [draft.equipment_slugs]);

  const toggle = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    patch({ equipment_slugs: [...next] });
  };

  const nameForSlug = React.useCallback(
    (slug: string) => catalog.find((c) => c.slug === slug)?.name ?? slug,
    [catalog],
  );

  const suggestions = React.useMemo(
    () => equipmentDependencySuggestions(draft.equipment_slugs),
    [draft.equipment_slugs],
  );

  const grouped = React.useMemo(() => {
    return EQUIPMENT_CATEGORIES.map((cat) => ({
      category: cat,
      items: catalog.filter((c) => c.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [catalog]);

  const searchEquipment = React.useCallback(
    async (q: string): Promise<EquipmentRow[]> => {
      const needle = q.toLowerCase();
      return catalog
        .filter((c) => c.name.toLowerCase().includes(needle) || c.slug.includes(needle))
        .slice(0, 8);
    },
    [catalog],
  );

  return (
    <div className="space-y-6">
      <SearchInput<EquipmentRow>
        aria-label="Search equipment"
        placeholder="Search equipment…"
        search={(q) => searchEquipment(q)}
        getKey={(r) => r.slug}
        renderResult={(r) => (
          <span className="flex w-full items-center justify-between">
            <span>{r.name}</span>
            {selected.has(r.slug) && <span className="text-xs text-accent">added</span>}
          </span>
        )}
        onSelect={(r) => {
          if (!selected.has(r.slug)) toggle(r.slug);
        }}
      />

      {suggestions.length > 0 && (
        <div className="rounded-card bg-accent-muted p-3">
          <p className="text-xs font-medium text-accent">Most people also add</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((slug) => (
              <Chip key={slug} leading="+" onClick={() => toggle(slug)}>
                {nameForSlug(slug)}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {grouped.map((group) => (
        <section key={group.category}>
          <p className="mb-3 text-sm font-medium text-foreground">
            {CATEGORY_LABEL[group.category]}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Chip
                key={item.slug}
                selected={selected.has(item.slug)}
                onClick={() => toggle(item.slug)}
              >
                {item.name}
              </Chip>
            ))}
          </div>
        </section>
      ))}

      {!loaded && <p className="text-sm text-muted-foreground">Loading equipment…</p>}

      <p className="text-xs text-muted-foreground">
        No equipment? That&apos;s fine — bodyweight exercises need nothing. You can skip.
      </p>

      <div className="flex-1" />
      <OnboardingFooter step="equipment" skippable canContinue />
    </div>
  );
}
