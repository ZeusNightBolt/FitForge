'use client';

import * as React from 'react';
import type { TrainingLocation } from '@fitforge/shared/types';
import { cn } from '@/lib/utils';
import { Card, CardTitle, CardDescription } from '@/components/ui';
import { CheckIcon } from '@/components/ui/icons';
import { EquipmentIllustration } from '@/components/illustrations/equipment';
import type { EquipmentSlug } from '@/components/illustrations/equipment';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

interface LocationOption {
  value: TrainingLocation;
  title: string;
  description: string;
  /** composite mini-illustration — 3 representative equipment glyphs (§4.2 usage map). */
  preview: EquipmentSlug[];
}

const OPTIONS: LocationOption[] = [
  {
    value: 'home',
    title: 'Home gym',
    description: 'Dumbbells, bands, a bench — whatever you have.',
    preview: ['dumbbell', 'adjustable-bench', 'resistance-bands'],
  },
  {
    value: 'commercial_gym',
    title: 'Commercial gym',
    description: 'Full rack of machines, cables, and free weights.',
    preview: ['squat-rack', 'cable-machine', 'leg-press'],
  },
  {
    value: 'minimal',
    title: 'Minimal / travel',
    description: 'Bodyweight and bands. Train anywhere.',
    preview: ['resistance-bands', 'pull-up-bar', 'suspension-trainer'],
  },
];

/** Screen 5 · Training location (§4.2). Each card previews the equipment it will preset next. */
export function LocationStep() {
  const { draft, patch } = useOnboarding();

  const select = (v: TrainingLocation) => {
    // Changing location clears any prior preset so the equipment screen re-seeds cleanly.
    patch({ training_location: v, equipment_slugs: [] });
  };

  return (
    <>
      <div role="radiogroup" aria-label="Training location" className="grid gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = draft.training_location === opt.value;
          return (
            <Card
              key={opt.value}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              interactive
              selected={isSelected}
              onClick={() => select(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(opt.value);
                }
              }}
              data-testid={`location-${opt.value}`}
              className="flex items-center gap-3.5 shadow-[var(--shadow-card)]"
            >
              {/* composite mini-illustration */}
              <span
                aria-hidden
                className={cn(
                  'flex shrink-0 items-center gap-0.5 rounded-sm px-1.5 py-1 transition-colors',
                  isSelected ? 'bg-accent-muted' : 'bg-muted',
                )}
              >
                {opt.preview.map((slug, i) => (
                  <EquipmentIllustration
                    key={slug}
                    slug={slug}
                    size={i === 1 ? 34 : 26}
                    selected={isSelected}
                  />
                ))}
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle>{opt.title}</CardTitle>
                <CardDescription>{opt.description}</CardDescription>
              </div>
              <span
                aria-hidden
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors',
                  isSelected
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border text-transparent',
                )}
              >
                <CheckIcon size={13} />
              </span>
            </Card>
          );
        })}
      </div>
      <div className="flex-1" />
      <OnboardingFooter step="location" canContinue={!!draft.training_location} />
    </>
  );
}
