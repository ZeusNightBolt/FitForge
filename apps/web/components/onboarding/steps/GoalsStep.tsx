'use client';

import * as React from 'react';
import type { GoalType } from '@fitforge/shared/types';
import { SelectableCardGrid, Chip, type SelectableOption } from '@/components/ui';
import { TrophyIcon, DumbbellIcon, FlameIcon, RunIcon, HeartIcon } from '@/components/ui/icons';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

const GOAL_OPTIONS: SelectableOption<GoalType>[] = [
  { value: 'strength', title: 'Get stronger', description: 'Lift heavier over time', icon: <TrophyIcon size={22} /> },
  { value: 'hypertrophy', title: 'Build muscle', description: 'Add size and definition', icon: <DumbbellIcon size={22} /> },
  { value: 'fat_loss', title: 'Lose fat', description: 'Lean out while keeping muscle', icon: <FlameIcon size={22} /> },
  { value: 'endurance', title: 'Build endurance', description: 'Last longer, recover faster', icon: <RunIcon size={22} /> },
  { value: 'general_health', title: 'General health', description: 'Feel good and stay consistent', icon: <HeartIcon size={22} /> },
];

const GOAL_LABEL: Record<GoalType, string> = {
  strength: 'strength',
  hypertrophy: 'building muscle',
  fat_loss: 'fat loss',
  endurance: 'endurance',
  general_health: 'general health',
};

/** Screen 2 · Goals (§2.2). Primary required + optional secondary. */
export function GoalsStep() {
  const { draft, patch } = useOnboarding();

  const setPrimary = (value: GoalType) => {
    // if the new primary equals the current secondary, clear the secondary
    patch({
      primary_goal: value,
      secondary_goal: draft.secondary_goal === value ? null : draft.secondary_goal,
    });
  };

  const toggleSecondary = (value: GoalType) => {
    patch({ secondary_goal: draft.secondary_goal === value ? null : value });
  };

  return (
    <>
      <SelectableCardGrid
        options={GOAL_OPTIONS}
        value={draft.primary_goal}
        onChange={setPrimary}
        mode="single"
      />

      {draft.primary_goal && (
        <div className="mt-6 rounded-card bg-accent-muted p-3 text-sm text-accent">
          Nice — we&apos;ll tune your plan for {GOAL_LABEL[draft.primary_goal]}.
        </div>
      )}

      {draft.primary_goal && (
        <div className="mt-6">
          <p className="text-sm font-medium text-foreground">Add a secondary goal? (optional)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {GOAL_OPTIONS.filter((o) => o.value !== draft.primary_goal).map((o) => (
              <Chip
                key={o.value}
                selected={draft.secondary_goal === o.value}
                onClick={() => toggleSecondary(o.value)}
              >
                {o.title}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />
      <OnboardingFooter step="goals" canContinue={!!draft.primary_goal} />
    </>
  );
}
