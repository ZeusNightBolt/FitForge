'use client';

import * as React from 'react';
import { Button } from '@/components/ui';
import { StepArt } from '@/components/illustrations';
import { useOnboarding } from '../OnboardingProvider';

/** Terminal screen (§2.2 `done`). Reached only if the redirect to /today hasn't happened yet. */
export function DoneStep() {
  const { finish, saving } = useOnboarding();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center py-16 text-center">
      <span className="grid h-24 w-24 place-items-center rounded-full bg-accent-muted shadow-[var(--shadow-glow)]">
        <StepArt step="done" size={56} />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">You&apos;re all set!</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Your starter plan and daily targets are forged. Time to train.
      </p>
      <Button className="mt-8" size="lg" glow loading={saving} onClick={finish}>
        Go to Today
      </Button>
    </div>
  );
}
