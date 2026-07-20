'use client';

import * as React from 'react';
import Link from 'next/link';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { StepArt } from '@/components/illustrations';

/**
 * Screen 1 · Local Mode entry (§5.3). Reframed as a choice: start in Local Mode (primary, seeds a
 * local session and advances to /onboarding/goals) or create an account / sign in (secondary).
 */
export function AuthStep() {
  return (
    <div className="flex min-h-dvh flex-col pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-1 flex-col justify-center">
        <StepArt step="done" size={56} />
        <h1 className="mt-4 font-display text-[1.75rem] font-bold leading-[1.15] tracking-tight">
          Start in Local Mode
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No sign-up required. Your plan and progress are saved in this browser only — pick up right
          where you left off on this device.
        </p>
        <div className="mt-8">
          <AuthPanel next="/onboarding/goals" />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
          <p className="text-sm font-semibold text-foreground">Prefer an account?</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Accounts with cloud sync are part of the hosted build.{' '}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Create account or sign in
            </Link>
            .
          </p>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to train responsibly. FitForge is guidance, not medical advice.
      </p>
    </div>
  );
}
