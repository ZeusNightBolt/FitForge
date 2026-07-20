'use client';

/**
 * Routines hub (the "Workouts" tab, §2.3). Shows the user's real active routine (the one generated
 * from their onboarding profile, persisted in the Local Mode store) — no fabricated history.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, CardTitle, CardDescription, Button } from '@/components/ui';
import { DumbbellIcon, PlusIcon } from '@/components/ui/icons';
import { useActiveRoutine } from '@/lib/demo/useDemo';
import { WEEKDAY_LABELS } from '@/components/features/_mock/data';

const GOAL_LABEL: Record<string, string> = {
  strength: 'Strength',
  hypertrophy: 'Build muscle',
  fat_loss: 'Lose fat',
  endurance: 'Endurance',
  general_health: 'General health',
};

export function RoutineList() {
  const routine = useActiveRoutine();
  const totalExercises = routine.days.reduce((n, d) => n + d.exercises.length, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Workouts</h1>
        <Link href="/exercises" className="text-sm font-medium text-accent">
          Browse exercises
        </Link>
      </header>

      <Card premium className="!p-0 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="truncate">{routine.name}</CardTitle>
                <span className="shrink-0 rounded-chip bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent">
                  Active
                </span>
              </div>
              {routine.description && <CardDescription>{routine.description}</CardDescription>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {routine.goal && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                    {GOAL_LABEL[routine.goal] ?? routine.goal}
                  </span>
                )}
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                  {routine.source === 'generated' ? 'Generated for you' : 'Custom'}
                </span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                  {routine.days.length} days · {totalExercises} exercises
                </span>
              </div>
            </div>
          </div>

          {/* Day rail */}
          <ul className="mt-4 space-y-1.5">
            {routine.days.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-muted text-accent">
                    <DumbbellIcon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-foreground">{d.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.weekday != null ? `${WEEKDAY_LABELS[d.weekday]} · ` : ''}
                      {d.exercises.length} exercises
                    </span>
                  </span>
                </span>
                <Link
                  href={`/workout/${d.id}`}
                  className="shrink-0 text-xs font-semibold text-accent"
                >
                  Start
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/routines/${routine.id}`}>
              <Button size="sm" variant="secondary">
                Edit routine
              </Button>
            </Link>
            <Link href="/settings">
              <Button size="sm" variant="ghost">
                Re-generate
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <Link href="/exercises" className="block">
        <Card interactive className="flex items-center gap-3 border-dashed">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-accent">
            <PlusIcon size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Build a custom day</p>
            <p className="text-xs text-muted-foreground">
              Browse the exercise library and forge your own session.
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
