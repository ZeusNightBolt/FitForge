'use client';

import * as React from 'react';
import type { TrainingLocation } from '@fitforge/shared/types';
import { SelectableCardGrid, type SelectableOption } from '@/components/ui';
import { HomeIcon, BuildingIcon, PlaneIcon } from '@/components/ui/icons';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

const OPTIONS: SelectableOption<TrainingLocation>[] = [
  {
    value: 'home',
    title: 'Home gym',
    description: 'Dumbbells, bands, a bench — whatever you have.',
    icon: <HomeIcon size={22} />,
  },
  {
    value: 'commercial_gym',
    title: 'Commercial gym',
    description: 'Full rack of machines, cables, and free weights.',
    icon: <BuildingIcon size={22} />,
  },
  {
    value: 'minimal',
    title: 'Minimal / travel',
    description: 'Bodyweight and bands. Train anywhere.',
    icon: <PlaneIcon size={22} />,
  },
];

/** Screen 5 · Training location (§2.2). Selection bulk-applies an equipment preset next (§7.2.1). */
export function LocationStep() {
  const { draft, patch } = useOnboarding();
  return (
    <>
      <SelectableCardGrid
        options={OPTIONS}
        value={draft.training_location}
        onChange={(v) => {
          // Changing location clears any prior preset so the equipment screen re-seeds cleanly.
          patch({ training_location: v, equipment_slugs: [] });
        }}
        mode="single"
      />
      <div className="flex-1" />
      <OnboardingFooter step="location" canContinue={!!draft.training_location} />
    </>
  );
}
