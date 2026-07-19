import Link from 'next/link';
import { AuthPanel } from '@/components/auth/AuthPanel';

/**
 * Standalone login (§8 tree). "I have an account" from the landing page.
 * After sign-in we send returning users to /today; middleware bounces them back into
 * onboarding if their profile is incomplete.
 */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-8 pt-16 sm:max-w-md">
      <Link href="/" className="flex items-center gap-2">
        <span aria-hidden className="text-2xl">
          {'\u{1F3CB}\u{FE0F}'}
        </span>
        <span className="text-lg font-bold tracking-tight">FitForge</span>
      </Link>

      <div className="mt-16 flex-1">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to pick up where you left off.</p>

        <div className="mt-8">
          <AuthPanel next="/today" />
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/onboarding/welcome" className="font-medium text-accent">
          Get started
        </Link>
      </p>
    </main>
  );
}
