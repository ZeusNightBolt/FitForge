'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { DumbbellIcon, TargetIcon, AppleIcon, SparkleIcon } from '@/components/ui/icons';
import { useOnboarding } from '../OnboardingProvider';

const HIGHLIGHTS = [
  {
    Icon: TargetIcon,
    title: 'A routine built around you',
    body: 'From your goals, schedule, and the exact equipment you have.',
  },
  {
    Icon: DumbbellIcon,
    title: 'Swap anything, instantly',
    body: 'Hate an exercise or missing a machine? Get an equal alternative.',
  },
  {
    Icon: AppleIcon,
    title: 'Nutrition that matches',
    body: 'Calorie and macro targets calculated from your body and goal.',
  },
];

/** Screen 0 · Welcome (§2.2). */
export function WelcomeStep() {
  const { goTo } = useOnboarding();
  return (
    <div className="flex min-h-dvh flex-col pt-14 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-[var(--shadow-card)]">
          <DumbbellIcon size={20} />
        </span>
        <span className="text-lg font-extrabold tracking-tight">FitForge</span>
      </div>

      <div className="mt-10 flex-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
          <SparkleIcon size={14} /> Personalized in ~2 minutes
        </span>
        <h1 className="mt-4 text-[2rem] font-extrabold leading-[1.1] tracking-tight">
          Your training &amp; nutrition, built around your life.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Answer a few quick questions about your goals, gear, and preferences — we&apos;ll forge
          the rest.
        </p>

        <ul className="mt-8 space-y-3">
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
        <Button size="lg" block onClick={() => goTo('auth')}>
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
