'use client';

/**
 * Today (home tab, §2.3): today's workout card (active routine × weekday mapping), calorie/macro
 * ring (v_daily_nutrition vs targets), weight sparkline, streak.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, CardTitle, Button, MacroRing } from '@/components/ui';
import { Sparkline } from '@/components/features/progress/charts';
import {
  todaysRoutineDay,
  mockWeightSparkline,
  MOCK_BODY_METRICS,
  MOCK_STREAK,
  WEEKDAY_LABELS,
  blueprintWeekday,
} from '@/components/features/_mock/data';
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
  const weights = mockWeightSparkline();
  const latest = MOCK_BODY_METRICS[MOCK_BODY_METRICS.length - 1]?.weight_kg ?? null;
  const prev = MOCK_BODY_METRICS[MOCK_BODY_METRICS.length - 2]?.weight_kg ?? null;
  const delta = latest != null && prev != null ? +(latest - prev).toFixed(1) : null;

  const wdLabel = WEEKDAY_LABELS[blueprintWeekday()];
  const hello = new Date().getHours();
  const greeting = hello < 12 ? 'Good morning' : hello < 18 ? 'Good afternoon' : 'Good evening';

  const macros = [
    { label: 'Protein', value: nutrition.protein_g, target: targets.protein_g_target, color: 'var(--color-accent)' },
    { label: 'Carbs', value: nutrition.carbs_g, target: targets.carbs_g_target, color: 'var(--color-success)' },
    { label: 'Fat', value: nutrition.fat_g, target: targets.fat_g_target, color: 'var(--color-danger)' },
  ];

  return (
    <div className="space-y-5">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {greeting}, {displayName}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight">{wdLabel}&rsquo;s plan</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-accent-muted px-3 py-1.5 text-sm font-semibold text-accent">
          <span aria-hidden>{'\u{1F525}'}</span> {MOCK_STREAK}-day streak
        </div>
      </header>

      {/* Today's workout */}
      {day ? (
        <Card className="overflow-hidden !p-0">
          <div className="bg-accent-muted px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Today&rsquo;s workout
            </p>
            <CardTitle className="mt-1 text-lg">{day.name}</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
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
                <li className="text-xs text-muted-foreground">
                  +{day.exercises.length - 4} more
                </li>
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
        <Card>
          <CardTitle>Rest day</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            No workout scheduled today. You can still start a freestyle session.
          </p>
          <Link href={`/workout/${routine.days[0]?.id ?? 'freestyle'}`} className="mt-4 block">
            <Button variant="secondary" block>
              Start a freestyle workout
            </Button>
          </Link>
        </Card>
      )}

      {/* Nutrition ring */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Nutrition</CardTitle>
          <Link href="/nutrition" className="text-sm font-medium text-accent">
            Log food
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-5">
          <MacroRing
            value={nutrition.kcal}
            target={targets.kcal_target}
            size={128}
            stroke={12}
            caption={
              <>
                {Math.round(nutrition.kcal)}
              </>
            }
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
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Weight sparkline */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Body weight</CardTitle>
          <Link href="/progress" className="text-sm font-medium text-accent">
            Progress
          </Link>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-3xl font-extrabold tabular-nums">
              {latest != null ? latest.toFixed(1) : '—'}
              <span className="ml-1 text-base font-medium text-muted-foreground">kg</span>
            </p>
            {delta != null && (
              <p
                className={
                  'text-sm font-medium ' + (delta <= 0 ? 'text-success' : 'text-muted-foreground')
                }
              >
                {delta > 0 ? '+' : ''}
                {delta} kg since last entry
              </p>
            )}
          </div>
          <Sparkline data={weights} width={160} height={48} />
        </div>
      </Card>
    </div>
  );
}
