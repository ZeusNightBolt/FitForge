'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Sheet, Chip } from '@/components/ui';
import { generateStarterRoutine } from '@/lib/onboarding/persistence';
import { useOnboarding } from '../OnboardingProvider';
import { OnboardingFooter } from '../OnboardingFooter';

interface RoutineExerciseView {
  id: string;
  position: number;
  exercise_id: string;
  sets: number;
  rep_min: number;
  rep_max: number;
  rest_seconds: number;
  exercises: { name: string; slug: string; image_path: string | null } | null;
}
interface RoutineDayView {
  id: string;
  day_index: number;
  name: string;
  focus: string | null;
  routine_exercises: RoutineExerciseView[];
}
interface RoutineView {
  id: string;
  name: string;
  description: string | null;
  routine_days: RoutineDayView[];
}

interface SubHit {
  exercise_id: string;
  slug: string;
  name: string;
  score: number;
  reason: string | null;
}

const ROUTINE_SELECT =
  '*,routine_days(*,routine_exercises(*,exercises(name,slug,image_path)))';

/** Screen 12 · Plan preview (§2.2 / §7.5). Generates the routine, shows it, allows swaps. */
export function PlanPreviewStep() {
  const { finish } = useOnboarding();
  const supabase = React.useMemo(() => createClient(), []);
  const [routine, setRoutine] = React.useState<RoutineView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [openDay, setOpenDay] = React.useState<string | null>(null);
  const [swap, setSwap] = React.useState<{ rowId: string; exerciseId: string } | null>(null);
  const [subs, setSubs] = React.useState<SubHit[]>([]);
  const ranRef = React.useRef(false);

  const loadRoutine = React.useCallback(
    async (routineId: string) => {
      const { data, error: err } = await supabase
        .from('routines')
        .select(ROUTINE_SELECT)
        .eq('id', routineId)
        .single();
      if (err) {
        setError(err.message);
        return;
      }
      const r = data as unknown as RoutineView;
      r.routine_days.sort((a, b) => a.day_index - b.day_index);
      for (const d of r.routine_days) d.routine_exercises.sort((a, b) => a.position - b.position);
      setRoutine(r);
      setOpenDay(r.routine_days[0]?.id ?? null);
    },
    [supabase],
  );

  // Generate once on mount (§7.5 RPC), then hydrate the tree.
  React.useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    generateStarterRoutine(supabase)
      .then((id) => loadRoutine(id))
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not generate your plan.'));
  }, [supabase, loadRoutine]);

  const openSwap = async (row: RoutineExerciseView) => {
    setSwap({ rowId: row.id, exerciseId: row.exercise_id });
    setSubs([]);
    const { data } = await supabase.rpc('suggest_substitutes', {
      p_exercise_id: row.exercise_id,
      p_limit: 5,
    });
    setSubs((data ?? []) as SubHit[]);
  };

  const applySwap = async (sub: SubHit) => {
    if (!swap || !routine) return;
    await supabase.from('routine_exercises').update({ exercise_id: sub.exercise_id }).eq('id', swap.rowId);
    await loadRoutine(routine.id);
    setSwap(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-card bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!routine && !error && (
        <p className="text-sm text-muted-foreground">Building your plan…</p>
      )}

      {routine && (
        <>
          <p className="text-sm text-muted-foreground">{routine.name}</p>
          <div className="space-y-3">
            {routine.routine_days.map((day) => {
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
                      {day.routine_exercises.map((row) => (
                        <li
                          key={row.id}
                          className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                          <span>
                            <span className="block text-foreground">
                              {row.exercises?.name ?? 'Exercise'}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {row.sets} × {row.rep_min}–{row.rep_max} · {row.rest_seconds}s rest
                            </span>
                          </span>
                          <button
                            type="button"
                            aria-label={`Swap ${row.exercises?.name ?? 'exercise'}`}
                            onClick={() => openSwap(row)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent-muted"
                          >
                            {'⇄'} Swap
                          </button>
                        </li>
                      ))}
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
          <p className="text-sm text-muted-foreground">Finding good alternatives…</p>
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
        onContinue={finish}
      />
    </div>
  );
}
