'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Sheet } from '@/components/ui';
import { TargetIcon, AppleIcon, SwapIcon, type IconProps } from '@/components/ui/icons';
import { LogoLockup, LandingHero } from '@/components/illustrations';
import { getState, resetDemo } from '@/lib/demo/store';

/** Marketing landing (§5.2). Dark-first, one gold accent, mobile-first — the start of onboarding. */
const VALUE_ROWS: { Icon: (p: IconProps) => React.ReactElement; title: string; body: string }[] = [
  { Icon: TargetIcon, title: 'A plan tuned to you', body: 'Built from your goals, schedule, and gear.' },
  { Icon: AppleIcon, title: 'Macros, explained', body: 'Calorie and protein targets that make sense.' },
  { Icon: SwapIcon, title: 'Smart substitutions', body: 'Swap any exercise for an equal alternative.' },
];

export default function LandingPage() {
  const router = useRouter();
  // Hydration gate: read the store only after mount so the returning-user CTA swap never flashes.
  const [mounted, setMounted] = React.useState(false);
  const [returning, setReturning] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState(false);

  React.useEffect(() => {
    setReturning(getState().completedAt != null);
    setMounted(true);
  }, []);

  const startOver = () => {
    resetDemo();
    setConfirmReset(false);
    setReturning(false);
    router.push('/onboarding/welcome');
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-14 sm:max-w-md">
      <header className="flex items-center justify-between">
        <LogoLockup size={22} />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--accent)_45%,transparent)] bg-accent-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Local
        </span>
      </header>

      <section className="mt-10">
        <h1 className="text-[2.75rem] font-bold leading-[1.05] tracking-tight text-foreground">
          Your personal trainer.
          <br />
          <span className="text-gradient-gold">Forged around you.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Training plans, macro targets, and a muscle-smart exercise library — free and
          offline-friendly.
        </p>
      </section>

      <div className="mt-6">
        <LandingHero width={360} className="mx-auto" />
      </div>

      <ul className="mt-4 space-y-3">
        {VALUE_ROWS.map(({ Icon, title, body }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent">
              <Icon size={20} />
            </span>
            <div>
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <footer className="mt-10 space-y-3">
        {/* Render CTAs only after hydration so the returning-user swap doesn't flash (§5.2). */}
        <div className={mounted ? '' : 'invisible'}>
          {returning ? (
            <div className="space-y-3">
              <Link href="/today" className="block">
                <Button size="lg" block glow>
                  Continue your plan
                </Button>
              </Link>
              <Button size="lg" variant="ghost" block onClick={() => setConfirmReset(true)}>
                Start over
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link href="/onboarding/welcome" className="block">
                <Button size="lg" block glow>
                  Start in Local Mode
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button size="lg" variant="ghost" block>
                  I have an account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </footer>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Start over?"
      >
        <p className="text-sm text-muted-foreground">
          This erases your Local Mode data — plan, logs, and meals stored in this browser — and
          restarts onboarding. This cannot be undone.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="danger" block onClick={startOver}>
            Erase and start over
          </Button>
          <Button variant="ghost" block onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
