'use client';

import * as React from 'react';
import type { ExperienceLevel } from '@fitforge/shared/types';
import { SelectableCardGrid, type SelectableOption } from '@/components/ui';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

const OPTIONS: SelectableOption<ExperienceLevel>[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'Less than a year of consistent training, or coming back after a long break.',
    icon: '\u{1F331}',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: '1–3 years training consistently. Comfortable with the main lifts.',
    icon: '\u{1F33F}',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    description: '3+ years. You know your numbers and how you respond to programming.',
    icon: '\u{1F333}',
  },
];

/** Screen 3 · Experience (§2.2). Default Beginner. Drives difficulty ceiling + volume. */
export function ExperienceStep() {
  const { draft, patch } = useOnboarding();

  // Default = Beginner (§2.2).
  React.useEffect(() => {
    if (!draft.experience_level) patch({ experience_level: 'beginner' });
  }, [draft.experience_level, patch]);

  return (
    <>
      <SelectableCardGrid
        options={OPTIONS}
        value={draft.experience_level}
        onChange={(v) => patch({ experience_level: v })}
        mode="single"
      />
      <div className="flex-1" />
      <OnboardingFooter step="experience" canContinue={!!draft.experience_level} />
    </>
  );
}
