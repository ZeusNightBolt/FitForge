'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { ensureSession, isOnboarded } from '@/lib/demo/store';

export interface AuthPanelProps {
  /** where to land after entering the demo (default: onboarding). */
  next?: string;
}

/**
 * DEMO MODE auth bypass (§2.2 screen 1 / §8 login page). There is no real auth: "Enter the demo"
 * seeds a fake local session and routes onward — to `/today` if onboarding is already complete,
 * otherwise to `next`.
 */
export function AuthPanel({ next = '/onboarding/goals' }: AuthPanelProps) {
  const router = useRouter();
  const [entering, setEntering] = React.useState(false);

  const enter = () => {
    setEntering(true);
    ensureSession();
    router.push(isOnboarded() ? '/today' : next);
  };

  return (
    <div className="space-y-4">
      <Button size="lg" block loading={entering} onClick={enter} data-testid="enter-demo">
        <span aria-hidden>{'\u{1F680}'}</span> Enter the demo
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No account needed — this is a fully client-side demo. Your data is saved locally in your
        browser and never leaves this device.
      </p>
    </div>
  );
}
