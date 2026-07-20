import { notFound } from 'next/navigation';
import { ONBOARDING_STEPS } from '@fitforge/shared/schemas';
import { isOnboardingStep } from '@/lib/onboarding/steps';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';

/** Static params for the export: one page per §2.2 onboarding step. */
export function generateStaticParams() {
  return ONBOARDING_STEPS.map((step) => ({ step }));
}

/**
 * Dynamic onboarding route — one entry per §2.2 step. Validates the slug against the frozen
 * state machine and renders the shared shell + the matching step component.
 */
export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!isOnboardingStep(step)) notFound();
  return <OnboardingShell step={step} />;
}
