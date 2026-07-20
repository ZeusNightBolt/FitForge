'use client';

/**
 * Today (home tab, §2.3): today's workout card (active routine × weekday mapping), calorie/macro
 * ring (v_daily_nutrition vs targets), weight, and date. A fresh demo user sees real first-run
 * empty states with clear guidance — nothing is pre-filled.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, CardTitle, Button, MacroRing } from '@/components/ui';
import { PlusIcon, ScaleIcon, UtensilsIcon, ArrowRightIcon } from '@/components/ui/icons';
import { todaysRoutineDay, WEEKDAY_LABELS, blueprintWeekday } from '@/components/features/_mock/data';
import {
  useActiveRoutine,
  useNutritionTargets,
  useProfileName,
  useTodayLogs,
} from '@/lib/demo/useDemo';

export function TodayView() {
  const routine = useActiveRoutine();
  const day = todaysRoutineDay(routine);
  const targets = useNutritionTargets();
  const displayName = useProfileName();
  const { logs } = useTodayLogs();
  const nutrition = logs.reduce(
    (a, l) => ({
      kcal: a.kcal + l.kcal,
      protein_g: a.protein_g + l.protein_g,
      carbs_g: a.carbs_g + l.carbs_g,
      fat_g: a.fat_g + l.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
  const hasLogged = logs.length > 0;

  const wdLabel = WEEKDAY_LABELS[blueprintWeekday()];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const macros = [
    { label: 'Protein', value: nutrition.protein_g, target: targets.protein_g_target, color: 'var(--color-accent)' },
    { label: 'Carbs', value: nutrition.carbs_g, target: targets.carbs_g_target, color: 'var(--color-success)' },
    { label: 'Fat', value: nutrition.fat_g, target: targets.fat_g_target, color: 'var(--color-energy)' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting}
            {displayName ? `, ${displayName}` : ''}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">{wdLabel}&rsquo;s plan</h1>
        </div>
        <div className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold text-muted-foreground shadow-[var(--shadow-card)]">
          {dateLabel}
        </div>
      </header>

      {/* Today's workout */}
      {day ? (
        <Card className="overflow-hidden !p-0 shadow-[var(--shadow-card)]">
          <div className="bg-accent px-5 py-4 text-accent-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Today&rsquo;s workout
            </p>
            <h2 className="mt-1 text-lg font-bold text-accent-foreground">{day.name}</h2>
            <p className="mt-0.5 text-sm opacity-80">
              {day.exercises.length} exercises · from {routine.name}
            </p>
          </div>
          <div className="px-5 py-4">
            <ul className="mb-4 space-y-1.5 text-sm">
              {day.exercises.slice(0, 4).map((e) => (
                <li key={e.id} className="flex justify-between text-foreground">
                  <span className="truncate pr-3">{e.exercise_name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {e.sets} × {e.rep_min}–{e.rep_max}
                  </span>
                </li>
              ))}
              {day.exercises.length > 4 && (
                <li className="text-xs text-muted-foreground">+{day.exercises.length - 4} more</li>
              )}
            </ul>
            <Link href={`/workout/${day.id}`} className="block">
              <Button size="lg" block>
                Start workout
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="shadow-[var(--shadow-card)]">
          <CardTitle>Rest day</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            No workout scheduled today — recovery is part of the plan. Want to move anyway?
          </p>
          <Link href={`/workout/${routine.days[0]?.id ?? 'freestyle'}`} className="mt-4 block">
            <Button variant="secondary" block>
              Start a freestyle workout
            </Button>
          </Link>
        </Card>
      )}

      {/* Nutrition ring */}
      <Card className="shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <CardTitle>Nutrition</CardTitle>
          <Link href="/nutrition" className="text-sm font-semibold text-accent">
            {hasLogged ? 'Log food' : ''}
          </Link>
        </div>

        {hasLogged ? (
          <div className="mt-3 flex items-center gap-5">
            <MacroRing
              value={nutrition.kcal}
              target={targets.kcal_target}
              size={128}
              stroke={12}
              caption={<>{Math.round(nutrition.kcal)}</>}
              label={`of ${targets.kcal_target} kcal`}
            />
            <div className="flex-1 space-y-3">
              {macros.map((m) => {
                const pct = Math.min(100, Math.round((m.value / Math.max(1, m.target)) * 100));
                return (
                  <div key={m.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-foreground">{m.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {Math.round(m.value)} / {m.target} g
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl bg-muted/60 px-4 py-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-accent shadow-[var(--shadow-card)]">
              <UtensilsIcon size={24} />
            </span>
            <div>
              <p className="font-semibold text-foreground">Nothing logged yet today</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your target is <span className="font-semibold text-foreground">{targets.kcal_target} kcal</span> ·{' '}
                {targets.protein_g_target}g protein. Log a meal to fill your ring.
              </p>
            </div>
            <Link href="/nutrition" className="w-full">
              <Button block>
                <PlusIcon size={18} /> Log your first meal
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Body weight */}
      <Card className="shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <CardTitle>Body weight</CardTitle>
          <Link href="/progress" className="text-sm font-semibold text-accent">
            Progress
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-4 rounded-2xl bg-muted/60 px-4 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-accent shadow-[var(--shadow-card)]">
            <ScaleIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Track your weight</p>
            <p className="text-sm text-muted-foreground">Log weigh-ins to see your trend over time.</p>
          </div>
          <Link href="/progress">
            <Button variant="secondary" size="sm">
              Add <ArrowRightIcon size={16} />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
