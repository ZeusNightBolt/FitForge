'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Sheet } from '@/components/ui';
import { finalizeOnboarding } from '@/lib/demo/generate';
import { getState, update } from '@/lib/demo/store';
import { mockSuggestSubstitutes, type Routine, type RoutineExercise } from '@/components/features/_mock/data';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

interface SubHit {
  exercise_id: string;
  slug: string;
  name: string;
  score: number;
  reason: string | null;
}

/**
 * Screen 12 · Plan preview (§2.2 / §7.5) — DEMO MODE. Generates the starter routine from the draft
 * with the §7.5 split rule over the fixture catalog, persists it, shows it, and allows swaps
 * (§7.4). "Start plan" routes to /today.
 */
export function PlanPreviewStep() {
  const { draft } = useOnboarding();
  const router = useRouter();
  const [routine, setRoutine] = React.useState<Routine | null>(null);
  const [openDay, setOpenDay] = React.useState<string | null>(null);
  const [swap, setSwap] = React.useState<{ dayId: string; rowId: string; exerciseId: string } | null>(null);
  const [subs, setSubs] = React.useState<SubHit[]>([]);
  const ranRef = React.useRef(false);

  // Generate + persist once on mount (§7.5).
  React.useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const r = finalizeOnboarding(draft);
    setRoutine(r);
    setOpenDay(r.days[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSwap = (dayId: string, row: RoutineExercise) => {
    setSwap({ dayId, rowId: row.id, exerciseId: row.exercise_id });
    setSubs(mockSuggestSubstitutes(row.exercise_id, 5));
  };

  const applySwap = (sub: SubHit) => {
    if (!swap) return;
    const next = update((s) => {
      if (!s.routine) return s;
      const days = s.routine.days.map((d) =>
        d.id !== swap.dayId
          ? d
          : {
              ...d,
              exercises: d.exercises.map((e) =>
                e.id !== swap.rowId
                  ? e
                  : { ...e, exercise_id: sub.exercise_id, exercise_slug: sub.slug, exercise_name: sub.name },
              ),
            },
      );
      return { ...s, routine: { ...s.routine, days } };
    });
    setRoutine(next.routine);
    setSwap(null);
  };

  const startPlan = () => {
    // ensure everything is persisted, then head to Today.
    if (!getState().completedAt) finalizeOnboarding(draft);
    router.push('/today');
  };

  const targets = getState().targets;
  const trainingDays = routine?.days.filter((d) => d.exercises.length > 0).length ?? 0;
  const totalExercises =
    routine?.days.reduce((n, d) => n + d.exercises.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      {!routine && <p className="text-sm text-muted-foreground">Building your plan…</p>}

      {routine && (
        <>
          {/* Forged-plan summary — the "money moment" premium card (§P2-14). */}
          <Card premium className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
              Your forged plan
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-foreground">{routine.name}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-display text-3xl font-semibold leading-none tabular-nums text-accent">
                  {trainingDays}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  days / week
                </p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold leading-none tabular-nums text-foreground">
                  {totalExercises}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  exercises
                </p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold leading-none tabular-nums text-foreground">
                  {targets?.kcal_target ?? '—'}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  kcal / day
                </p>
              </div>
            </div>
          </Card>
          <p className="text-sm text-muted-foreground">
            Tap a day to review it — swap anything you like.
          </p>
          <div className="space-y-3">
            {routine.days.map((day) => {
              const expanded = openDay === day.id;
              return (
                <Card key={day.id} className="p-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-4 text-left"
                    onClick={() => setOpenDay(expanded ? null : day.id)}
                  >
                    <span>
                      <span className="block font-semibold text-foreground">{day.name}</span>
                      {day.focus && (
                        <span className="block text-xs text-muted-foreground">{day.focus}</span>
                      )}
                    </span>
                    <span aria-hidden className="text-muted-foreground">
                      {expanded ? '−' : '+'}
                    </span>
                  </button>
                  {expanded && (
                    <ul className="border-t border-border">
                      {day.exercises.map((row) => (
                        <li
                          key={row.id}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <span>
                            <span className="block text-foreground">{row.exercise_name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {row.sets} × {row.rep_min}–{row.rep_max} · {row.rest_seconds}s rest
                            </span>
                          </span>
                          <button
                            type="button"
                            aria-label={`Swap ${row.exercise_name}`}
                            onClick={() => openSwap(day.id, row)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-muted"
                          >
                            {'⇄'} Swap
                          </button>
                        </li>
                      ))}
                      {day.exercises.length === 0 && (
                        <li className="px-4 py-3 text-xs text-muted-foreground">
                          Rest / recovery day.
                        </li>
                      )}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Sheet open={swap !== null} onClose={() => setSwap(null)} title="Swap exercise">
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alternatives found.</p>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <button
                key={s.exercise_id}
                type="button"
                onClick={() => applySwap(s)}
                className="flex w-full flex-col rounded-xl border border-border bg-surface-2 p-3 text-left hover:border-accent"
              >
                <span className="font-medium text-foreground">{s.name}</span>
                {s.reason && <span className="text-xs text-muted-foreground">{s.reason}</span>}
              </button>
            ))}
          </div>
        )}
      </Sheet>

      <div className="flex-1" />
      <OnboardingFooter
        step="plan_preview"
        continueLabel="Start plan"
        canContinue={routine !== null}
        onContinue={startPlan}
      />
    </div>
  );
}
