import Link from 'next/link';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { LogoLockup } from '@/components/illustrations';

/**
 * Standalone entry (§8 tree / §5.3) — "I have an account" from the landing page. In the static
 * export there is no hosted auth: Local Mode seeds a local session and routes to onboarding (or
 * /today if it is already complete). The "Welcome back" heading is e2e-load-bearing (§7.9).
 */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-8 pt-16 sm:max-w-md">
      <Link href="/" aria-label="FitForge home">
        <LogoLockup size={22} />
      </Link>

      <div className="mt-16 flex-1">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cloud accounts are part of the hosted build. On this version, jump straight into Local
          Mode — your data stays in this browser.
        </p>

        <div className="mt-8">
          <AuthPanel next="/onboarding/welcome" />
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
