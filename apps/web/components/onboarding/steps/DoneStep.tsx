'use client';

import * as React from 'react';
import { Button } from '@/components/ui';
import { CheckIcon } from '@/components/ui/icons';
import { useOnboarding } from '../OnboardingProvider';

/** Terminal screen (§2.2 `done`). Reached only if the redirect to /today hasn't happened yet. */
export function DoneStep() {
  const { finish, saving } = useOnboarding();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center py-16 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-pop)]">
        <CheckIcon size={40} />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight">You&apos;re all set!</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Your starter plan and daily targets are ready. Time to train.
      </p>
      <Button className="mt-8" size="lg" loading={saving} onClick={finish}>
        Go to Today
      </Button>
    </div>
  );
}
