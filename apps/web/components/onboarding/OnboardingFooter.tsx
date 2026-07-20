'use client';

import * as React from 'react';
import { Button } from '@/components/ui';
import { useOnboarding } from './OnboardingProvider';
import type { OnboardingStep } from '@fitforge/shared/schemas';

export interface OnboardingFooterProps {
  step: OnboardingStep;
  /** primary CTA label (default "Continue") */
  continueLabel?: string;
  /** disable the primary CTA (validation gate) */
  canContinue?: boolean;
  /** show a secondary "Skip" link that commits current (possibly empty) draft and advances */
  skippable?: boolean;
  /** override the default commit-and-next behaviour (e.g. plan preview) */
  onContinue?: () => void | Promise<void>;
}

/**
 * Bottom-anchored primary CTA (§1.3 thumb-first). Reads `saving`/`error` from context so every
 * step gets consistent loading + error surfacing.
 */
export function OnboardingFooter({
  step,
  continueLabel = 'Continue',
  canContinue = true,
  skippable = false,
  onContinue,
}: OnboardingFooterProps) {
  const { commitAndNext, saving, error } = useOnboarding();

  const handle = () => (onContinue ? onContinue() : commitAndNext(step));

  return (
    <div className="sticky bottom-0 mt-6 space-y-2 bg-gradient-to-t from-surface via-surface to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      {error && (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      )}
      <Button
        size="lg"
        block
        glow
        loading={saving}
        disabled={!canContinue}
        onClick={handle}
        data-testid="onboarding-continue"
      >
        {continueLabel}
      </Button>
      {skippable && (
        <Button
          size="md"
          variant="ghost"
          block
          disabled={saving}
          onClick={() => commitAndNext(step)}
          data-testid="onboarding-skip"
        >
          Skip for now
        </Button>
      )}
    </div>
  );
}
