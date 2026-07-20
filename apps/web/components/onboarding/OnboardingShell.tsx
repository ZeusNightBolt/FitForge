'use client';

import * as React from 'react';
import { ProgressBar } from '@/components/ui';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { StepArt } from '@/components/illustrations';
import { STEP_META, wizardProgress } from '@/lib/onboarding/steps';
import type { OnboardingStep } from '@fitforge/shared/schemas';
import { useOnboarding } from './OnboardingProvider';
import { STEP_COMPONENTS } from './steps';

/**
 * Chrome for an onboarding screen: progress bar + back button + title/subtitle for the
 * questionnaire steps; a bare full-bleed frame for welcome/auth/done. The actual step body
 * (including its bottom-anchored CTA) is supplied by the step component.
 */
export function OnboardingShell({ step }: { step: OnboardingStep }) {
  const meta = STEP_META[step];
  const { goBack } = useOnboarding();
  const StepBody = STEP_COMPONENTS[step];

  if (!meta.wizard) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 sm:max-w-md">
        <StepBody />
      </main>
    );
  }

  const { current, total } = wizardProgress(step);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 sm:max-w-md">
      <header className="sticky top-0 z-10 -mx-6 bg-surface/95 px-6 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={() => goBack(step)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeftIcon size={22} />
          </button>
          <ProgressBar current={current} total={total} label={`Step ${current} of ${total}`} />
        </div>
      </header>

      <div className="flex flex-1 flex-col pt-4">
        <StepArt step={step} size={52} className="mb-1 -ml-1" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{meta.title}</h1>
        {meta.subtitle && <p className="mt-2 text-sm text-muted-foreground">{meta.subtitle}</p>}
        <div className="flex flex-1 flex-col pt-6">
          <StepBody />
        </div>
      </div>
    </main>
  );
}
