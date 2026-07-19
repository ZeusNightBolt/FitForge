'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { OnboardingStep } from '@fitforge/shared/schemas';
import { nextStep as computeNext, prevStep as computePrev } from '@/lib/onboarding/steps';
import { STEP_COMMITTERS, finalizeOnboarding } from '@/lib/onboarding/persistence';
import { emptyDraft, type OnboardingDraft } from './types';

interface OnboardingContextValue {
  draft: OnboardingDraft;
  patch: (partial: Partial<OnboardingDraft>) => void;
  userId: string;
  saving: boolean;
  error: string | null;
  /** commit the given step (write-through) then advance to the next screen */
  commitAndNext: (step: OnboardingStep) => Promise<void>;
  /** go back one screen without losing draft state (§2.2 "back never loses data") */
  goBack: (step: OnboardingStep) => void;
  /** navigate to an arbitrary step (used by resume) */
  goTo: (step: OnboardingStep) => void;
  /** stamp the completion contract and leave onboarding for /today (§2.2) */
  finish: () => Promise<void>;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within <OnboardingProvider>');
  return ctx;
}

export interface OnboardingProviderProps {
  userId: string;
  initialDraft: Partial<OnboardingDraft>;
  children: React.ReactNode;
}

export function OnboardingProvider({ userId, initialDraft, children }: OnboardingProviderProps) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [draft, setDraft] = React.useState<OnboardingDraft>(() => ({
    ...emptyDraft(),
    ...initialDraft,
  }));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const patch = React.useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const goTo = React.useCallback(
    (step: OnboardingStep) => router.push(`/onboarding/${step}`),
    [router],
  );

  const goBack = React.useCallback(
    (step: OnboardingStep) => router.push(`/onboarding/${computePrev(step)}`),
    [router],
  );

  const commitAndNext = React.useCallback(
    async (step: OnboardingStep) => {
      setSaving(true);
      setError(null);
      try {
        const next = computeNext(step);
        const committer = STEP_COMMITTERS[step];
        if (committer) {
          await committer(supabase, userId, draft, next);
        }
        router.push(`/onboarding/${next}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong saving your progress.');
      } finally {
        setSaving(false);
      }
    },
    [supabase, userId, draft, router],
  );

  const finish = React.useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await finalizeOnboarding(supabase, userId);
      router.push('/today');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish onboarding.');
    } finally {
      setSaving(false);
    }
  }, [supabase, userId, router]);

  const value = React.useMemo<OnboardingContextValue>(
    () => ({ draft, patch, userId, saving, error, commitAndNext, goBack, goTo, finish }),
    [draft, patch, userId, saving, error, commitAndNext, goBack, goTo, finish],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
