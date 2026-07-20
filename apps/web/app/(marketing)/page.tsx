import Link from 'next/link';
import { Button } from '@/components/ui';
import { DumbbellIcon } from '@/components/ui/icons';

/** Marketing landing (§8 tree, §1.1 value prop). Mobile-first, one accent, dark-mode aware. */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 sm:max-w-md">
      <header className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-[var(--shadow-card)]">
          <DumbbellIcon size={20} />
        </span>
        <span className="text-lg font-extrabold tracking-tight">FitForge</span>
      </header>

      <section className="mt-16 flex-1">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground">
          Your pocket personal trainer &amp; nutrition guide.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Answer a few questions about your goals, equipment, and the exercises you actually enjoy.
          FitForge builds your plan and macro targets — and adapts around injuries with smart
          substitutions.
        </p>

        <ul className="mt-8 space-y-3 text-sm text-foreground">
          <li className="flex gap-3">
            <span aria-hidden>{'✓'}</span> A starter routine tuned to your equipment and schedule
          </li>
          <li className="flex gap-3">
            <span aria-hidden>{'✓'}</span> Calorie &amp; macro targets, explained
          </li>
          <li className="flex gap-3">
            <span aria-hidden>{'✓'}</span> Swap any exercise you can&apos;t or don&apos;t want to do
          </li>
        </ul>
      </section>

      <footer className="mt-10 space-y-3">
        <Link href="/onboarding/welcome" className="block">
          <Button size="lg" block>
            Get started
          </Button>
        </Link>
        <Link href="/login" className="block">
          <Button size="lg" variant="ghost" block>
            I have an account
          </Button>
        </Link>
      </footer>
    </main>
  );
}
