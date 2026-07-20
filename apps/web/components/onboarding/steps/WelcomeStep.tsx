'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { TargetIcon, SwapIcon, AppleIcon, SparkleIcon } from '@/components/ui/icons';
import { LogoLockup } from '@/components/illustrations';
import { patchDraft } from '@/lib/demo/store';
import { useOnboarding } from '../OnboardingProvider';

const HIGHLIGHTS = [
  {
    Icon: TargetIcon,
    title: 'A plan forged around you',
    body: 'From your goals, schedule, and the exact equipment you have.',
  },
  {
    Icon: SwapIcon,
    title: 'Swap anything, instantly',
    body: 'Hate an exercise or missing a machine? Get an equal alternative.',
  },
  {
    Icon: AppleIcon,
    title: 'Nutrition that matches',
    body: 'Calorie and macro targets calculated from your body and goal.',
  },
];

/** Screen 0 · Welcome (§5.2 / §5.4). Stacked logo, optional name capture, then "Get started". */
export function WelcomeStep() {
  const { goTo, patch } = useOnboarding();
  const [name, setName] = React.useState('');

  const start = () => {
    const trimmed = name.trim();
    const value = trimmed ? trimmed : null;
    patch({ display_name: value });
    patchDraft({ display_name: value });
    goTo('auth');
  };

  return (
    <div className="flex min-h-dvh flex-col pt-14 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center pt-6">
        <LogoLockup size={30} stacked />
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
          <SparkleIcon size={14} /> Personalized in ~2 minutes
        </span>
      </div>

      <div className="mt-8 flex-1">
        <h1 className="text-center text-[2rem] font-bold leading-[1.1] tracking-tight text-foreground">
          Your personal trainer,
          <br />
          <span className="text-gradient-gold">forged around you.</span>
        </h1>
        <p className="mt-3 text-center text-base text-muted-foreground">
          Answer a few quick questions about your goals, gear, and preferences — we&apos;ll forge
          the rest.
        </p>

        <label className="mt-8 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What should we call you?
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            autoComplete="given-name"
            data-testid="onboarding-name"
            className="mt-1.5 h-12 w-full rounded-[var(--radius-field)] border border-border bg-surface-2 px-4 text-base text-foreground outline-none transition-colors focus:border-accent"
          />
        </label>

        <ul className="mt-6 space-y-3">
          {HIGHLIGHTS.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3.5 shadow-[var(--shadow-card)]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-muted text-accent">
                <Icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-3">
        <Button size="lg" block glow onClick={start}>
          Get started
        </Button>
        <Link href="/login" className="block">
          <Button size="lg" variant="ghost" block>
            I already have an account
          </Button>
        </Link>
      </div>
    </div>
  );
}
