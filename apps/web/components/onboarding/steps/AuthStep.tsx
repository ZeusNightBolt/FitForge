'use client';

import * as React from 'react';
import { AuthPanel } from '@/components/auth/AuthPanel';

/**
 * Screen 1 · Auth (§2.2). Web uses email magic link / Google OAuth via Supabase Auth. After
 * sign-in the callback returns to /onboarding/goals; `display_name` is prefilled from the provider
 * identity by the `handle_new_user` trigger (§4.3).
 */
export function AuthStep() {
  return (
    <div className="flex min-h-dvh flex-col pt-16 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex-1">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          So we can save your plan and pick up where you left off on any device.
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
