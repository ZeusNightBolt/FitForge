'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useOnboarding } from '../OnboardingProvider';

/** Screen 0 · Welcome (§2.2). */
export function WelcomeStep() {
  const { goTo } = useOnboarding();
  return (
    <div className="flex min-h-dvh flex-col pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-2xl">
          {'\u{1F3CB}\u{FE0F}'}
        </span>
        <span className="text-lg font-bold tracking-tight">FitForge</span>
      </div>

      <div className="mt-16 flex-1">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
          Let&apos;s build a plan that fits your life.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Takes about two minutes. We&apos;ll ask about your goals, your equipment, and what you
          enjoy — then generate your routine and nutrition targets.
        </p>
      </div>

      <div className="space-y-3">
        <Button size="lg" block onClick={() => goTo('auth')}>
          Get started
        </Button>
        <Link href="/login" className="block">
          <Button size="lg" variant="ghost" block>
            I have an account
          </Button>
        </Link>
      </div>
    </div>
  );
}
