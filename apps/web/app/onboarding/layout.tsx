import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';

/**
 * Onboarding shell (§2.2) — DEMO MODE. No server/auth work: the client `OnboardingProvider`
 * owns draft state and rehydrates from localStorage on mount so the wizard resumes correctly.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
