import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Route guard (BLUEPRINT §2.2 completion contract + §8 tree).
 *
 * - Always refreshes the Supabase session (`updateSession`) so Server Components see fresh auth.
 * - `(app)` routes (/today, /workout, /routines, /nutrition, /progress, /exercises, /settings):
 *     require a signed-in user AND a completed onboarding. Otherwise bounce to onboarding.
 * - `/onboarding/*`: the `welcome` and `auth` screens are public; every later step requires auth.
 *     A user who already completed onboarding is sent on to /today.
 */

// The authed-shell top-level segments owned by WS-5 (may 404 until WS-5 merges — acceptable).
const APP_SEGMENTS = [
  'today',
  'workout',
  'routines',
  'nutrition',
  'progress',
  'exercises',
  'settings',
];

const PUBLIC_ONBOARDING_STEPS = new Set(['welcome', 'auth']);

function firstSegment(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] ?? '';
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const seg = firstSegment(pathname);

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = '';
    const res = NextResponse.redirect(url);
    // carry the refreshed auth cookies onto the redirect response
    for (const cookie of supabaseResponse.cookies.getAll()) {
      res.cookies.set(cookie);
    }
    return res;
  };

  // ---- Protected app shell (WS-5) -------------------------------------------------
  if (APP_SEGMENTS.includes(seg)) {
    if (!user) return redirect('/onboarding/welcome');
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at, onboarding_step')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile?.onboarding_completed_at) {
      // resume at the saved pointer (kept in sync by per-step write-through, §2.2)
      const resume = profile?.onboarding_step && profile.onboarding_step !== 'done'
        ? profile.onboarding_step
        : 'goals';
      return redirect(`/onboarding/${resume}`);
    }
    return supabaseResponse;
  }

  // ---- Onboarding ------------------------------------------------------------------
  if (seg === 'onboarding') {
    const step = pathname.split('/').filter(Boolean)[1] ?? 'welcome';

    if (PUBLIC_ONBOARDING_STEPS.has(step)) {
      // Already-authed users skip straight past welcome/auth.
      if (user && step === 'auth') return redirect('/onboarding/goals');
      return supabaseResponse;
    }

    // Every step after auth requires a session.
    if (!user) return redirect('/onboarding/auth');

    // If onboarding is already finished, don't let them re-run the wizard.
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.onboarding_completed_at && step !== 'done') return redirect('/today');

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
