'use client';

import * as React from 'react';
import { AuthPanel } from '@/components/auth/AuthPanel';

/**
 * Screen 1 · Auth (§2.2) — DEMO MODE. No real account: "Enter the demo" seeds a local session and
 * advances to /onboarding/goals. Your answers are saved in this browser only.
 */
export function AuthStep() {
  return (
    <div className="flex min-h-dvh flex-col pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight">Continue as demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No sign-up required. We&apos;ll save your plan locally so you can pick up where you left
          off on this device.
        </p>
        <div className="mt-8">
          <AuthPanel next="/onboarding/goals" />
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        By continuing you agree to train responsibly. FitForge is guidance, not medical advice.
      </p>
    </div>
  );
}
