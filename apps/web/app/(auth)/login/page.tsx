import Link from 'next/link';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { DumbbellIcon } from '@/components/ui/icons';

/**
 * Standalone entry (§8 tree) — DEMO MODE. "I have an account" from the landing page. There is no
 * real auth: "Enter the demo" seeds a local session and routes to onboarding (or /today if it is
 * already complete).
 */
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-8 pt-16 sm:max-w-md">
      <Link href="/" className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-[var(--shadow-card)]">
          <DumbbellIcon size={20} />
        </span>
        <span className="text-lg font-extrabold tracking-tight">FitForge</span>
      </Link>

      <div className="mt-16 flex-1">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Jump straight in — pick up where you left off, or start fresh.
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
