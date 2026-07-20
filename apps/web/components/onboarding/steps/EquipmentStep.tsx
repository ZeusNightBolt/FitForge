'use client';

import * as React from 'react';
import type { EquipmentCategory } from '@fitforge/shared/types';
import { EQUIPMENT_CATEGORIES } from '@fitforge/shared/types';
import {
  equipmentPresetForLocation,
  equipmentDependencySuggestions,
} from '@fitforge/shared/rules';
import { cn } from '@/lib/utils';
import { Chip, SearchInput } from '@/components/ui';
import { EquipmentIllustration } from '@/components/illustrations/equipment';
import { DEMO_EQUIPMENT, type DemoEquipmentRow } from '@/lib/demo/catalog';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

type EquipmentRow = DemoEquipmentRow;

const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  free_weights: 'Free weights',
  machines: 'Machines',
  cables: 'Cables',
  bodyweight_accessories: 'Bodyweight & accessories',
  cardio: 'Cardio',
  benches_racks: 'Benches & racks',
};

/** Bodyweight-only preset: nothing loaded except a pull-up bar + bands (§6 P0-3). */
const BODYWEIGHT_SLUGS = ['pull-up-bar', 'resistance-bands'];

interface Preset {
  id: 'home' | 'commercial' | 'bodyweight';
  label: string;
  compute: (catalog: readonly EquipmentRow[]) => string[];
}

const PRESETS: Preset[] = [
  {
    id: 'home',
    label: 'Home gym',
    compute: (c) => equipmentPresetForLocation('home', c).preset,
  },
  {
    id: 'commercial',
    label: 'Commercial gym',
    compute: (c) => equipmentPresetForLocation('commercial_gym', c).preset,
  },
  {
    id: 'bodyweight',
    label: 'Bodyweight only',
    compute: (c) => BODYWEIGHT_SLUGS.filter((s) => c.some((row) => row.slug === s)),
  },
];

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && new Set([...a, ...b]).size === a.length;

/**
 * Screen 6 · Equipment (§4.2 / §6 P0-3). Fitbod-grade illustrated tile grid grouped by
 * seed category, with quick presets (Home / Commercial / Bodyweight) + a type-ahead and
 * dependency nudges. The location preset from LocationStep is applied on first mount so the
 * step stays continue-able with sensible defaults (onboarding-flow contract).
 */
export function EquipmentStep() {
  const { draft, patch } = useOnboarding();
  // DEMO MODE: the equipment catalog is a static in-memory list (no backend).
  const catalog = DEMO_EQUIPMENT;

  // Apply the location preset once, when nothing is selected yet.
  React.useEffect(() => {
    if (catalog.length === 0) return;
    if (draft.equipment_slugs.length > 0) return;
    if (!draft.training_location) return;
    const { preset } = equipmentPresetForLocation(draft.training_location, catalog);
    if (preset.length > 0) patch({ equipment_slugs: preset });
  }, [catalog, draft.equipment_slugs.length, draft.training_location, patch]);

  const selected = React.useMemo(() => new Set(draft.equipment_slugs), [draft.equipment_slugs]);

  const toggle = (slug: string) => {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    patch({ equipment_slugs: [...next] });
  };

  const applyPreset = (preset: Preset) => {
    patch({ equipment_slugs: preset.compute(catalog) });
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

  const activePreset = React.useMemo(
    () => PRESETS.find((p) => sameSet(p.compute(catalog), draft.equipment_slugs))?.id ?? null,
    [catalog, draft.equipment_slugs],
  );

  return (
    <div className="space-y-6">
      {/* Quick presets (§6 P0-3) */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Quick setup
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Equipment presets">
          {PRESETS.map((preset) => (
            <Chip
              key={preset.id}
              selected={activePreset === preset.id}
              onClick={() => applyPreset(preset)}
              data-testid={`equipment-preset-${preset.id}`}
            >
              {preset.label}
            </Chip>
          ))}
        </div>
      </div>

      <SearchInput<EquipmentRow>
        aria-label="Search equipment"
        placeholder="Search equipment…"
        search={(q) => searchEquipment(q)}
        getKey={(r) => r.slug}
        renderResult={(r) => (
          <span className="flex w-full items-center gap-2.5">
            <EquipmentIllustration slug={r.slug} size={28} selected={selected.has(r.slug)} />
            <span className="flex-1">{r.name}</span>
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
          <div className="grid grid-cols-3 gap-2.5">
            {group.items.map((item) => {
              const isSelected = selected.has(item.slug);
              return (
                <button
                  key={item.slug}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(item.slug)}
                  data-testid={`equipment-tile-${item.slug}`}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-card p-3 text-center',
                    'transition-colors duration-150 touch-manipulation',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    isSelected
                      ? 'border-gradient-gold'
                      : 'border border-border bg-surface-2 hover:border-border-strong',
                  )}
                >
                  <EquipmentIllustration slug={item.slug} size={44} selected={isSelected} />
                  <span
                    className={cn(
                      'text-xs font-medium leading-tight',
                      isSelected ? 'text-accent' : 'text-foreground',
                    )}
                  >
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-xs text-muted-foreground">
        No equipment? That&apos;s fine — bodyweight exercises need nothing. You can skip.
      </p>

      <div className="flex-1" />
      <OnboardingFooter step="equipment" skippable canContinue />
    </div>
  );
}
