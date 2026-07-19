import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth / magic-link callback (§8 tree). Exchanges the `code` for a session cookie, then routes:
 * - explicit `next` param if safe (relative path), else
 * - /today for completed profiles, /onboarding/goals otherwise.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.onboarding_completed_at) {
      return NextResponse.redirect(`${origin}/today`);
    }
  }
  return NextResponse.redirect(`${origin}/onboarding/goals`);
}
