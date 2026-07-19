import { createClient } from '@/lib/supabase/server';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { loadInitialDraft } from '@/lib/onboarding/loadDraft';

/**
 * Onboarding shell provider (§2.2). Fetches the signed-in user (if any) and rehydrates the draft
 * from prior writes so the wizard resumes correctly, then wraps all step routes in the client
 * provider that owns draft state + write-through persistence. Route guarding lives in
 * `middleware.ts`; welcome/auth render with an empty draft when logged out.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialDraft = user ? await loadInitialDraft(supabase, user.id) : {};

  return (
    <OnboardingProvider userId={user?.id ?? ''} initialDraft={initialDraft}>
      {children}
    </OnboardingProvider>
  );
}
