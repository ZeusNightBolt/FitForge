'use client';

/**
 * Workout player (§2.3): one exercise per screen (pager); set list with previous-session values
 * ghosted in as defaults (tap = log same); plate-math helper; rest timer auto-starts on set
 * completion; swap → substitutes (suggest_substitutes); finishing writes workout_sessions +
 * set_logs (here: mocked → session summary).
 */
import * as React from 'react';
import Link from 'next/link';
import { Button, Card, CardTitle, Sheet } from '@/components/ui';
import { ScaleIcon, CheckIcon } from '@/components/ui/icons';
import { SubstituteSheet } from '@/components/features/shared/SubstituteSheet';
import {
  mockPreviousSets,
  type RoutineDay,
  type RoutineExercise,
  type SubstituteRow,
} from '@/components/features/_mock/data';
import { useActiveRoutine } from '@/lib/demo/useDemo';

interface SetEntry {
  reps: number;
  weight_kg: number;
  rpe: number | null;
  done: boolean;
}
interface ExerciseState {
  routineExercise: RoutineExercise;
  /** overridden name/id when the user swaps */
  exerciseId: string;
  exerciseName: string;
  sets: SetEntry[];
}

function buildInitialState(day: RoutineDay): ExerciseState[] {
  return day.exercises.map((re) => {
    const prev = mockPreviousSets(re.exercise_slug, re.sets);
    const sets: SetEntry[] = Array.from({ length: re.sets }, (_, i) => {
      const p = prev[i];
      return {
        reps: p ? p.reps : re.rep_max,
        weight_kg: p ? p.weight_kg : 0,
        rpe: p ? p.rpe : re.target_rpe,
        done: false,
      };
    });
    return {
      routineExercise: re,
      exerciseId: re.exercise_id,
      exerciseName: re.exercise_name,
      sets,
    };
  });
}

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const BAR_KG = 20;

function plateBreakdown(total: number): { plate: number; count: number }[] {
  let perSide = (total - BAR_KG) / 2;
  if (perSide <= 0) return [];
  const out: { plate: number; count: number }[] = [];
  for (const p of PLATES) {
    const count = Math.floor(perSide / p + 1e-9);
    if (count > 0) {
      out.push({ plate: p, count });
      perSide = +(perSide - count * p).toFixed(4);
    }
  }
  return out;
}

export function WorkoutPlayer({ sessionId }: { sessionId: string }) {
  // DEMO MODE: resolve the day from the active (generated or default) routine; fall back to the
  // first day so a stale/unknown session id never dead-ends.
  const routine = useActiveRoutine();
  const day = React.useMemo<RoutineDay | undefined>(() => {
    return routine.days.find((d) => d.id === sessionId) ?? routine.days[0];
  }, [routine, sessionId]);

  const [exercises, setExercises] = React.useState<ExerciseState[]>(() =>
    day ? buildInitialState(day) : [],
  );
  const [index, setIndex] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const [startedAt] = React.useState(() => Date.now());

  // Rest timer -------------------------------------------------------------
  const [restLeft, setRestLeft] = React.useState<number | null>(null);
  const restTotalRef = React.useRef(0);
  React.useEffect(() => {
    if (restLeft == null) return;
    if (restLeft <= 0) {
      setRestLeft(null);
      return;
    }
    const t = setTimeout(() => setRestLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [restLeft]);

  // Sheets -----------------------------------------------------------------
  const [swapOpen, setSwapOpen] = React.useState(false);
  const [plateForSet, setPlateForSet] = React.useState<number | null>(null);

  if (!day) {
    return (
      <Card>
        <CardTitle>Workout not found</CardTitle>
        <Link href="/today" className="mt-3 inline-block text-sm font-medium text-accent">
          Back to Today
        </Link>
      </Card>
    );
  }

  const current = exercises[index]!;
  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetEntry>) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
          : ex,
      ),
    );
  }

  function completeSet(setIdx: number) {
    const s = current.sets[setIdx]!;
    const nextDone = !s.done;
    updateSet(index, setIdx, { done: nextDone });
    if (nextDone) {
      // Rest timer auto-starts on set completion (§2.3).
      restTotalRef.current = current.routineExercise.rest_seconds;
      setRestLeft(current.routineExercise.rest_seconds);
    }
  }

  function addSet() {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== index) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              reps: last?.reps ?? current.routineExercise.rep_max,
              weight_kg: last?.weight_kg ?? 0,
              rpe: last?.rpe ?? current.routineExercise.target_rpe,
              done: false,
            },
          ],
        };
      }),
    );
  }

  function onSwap(sub: SubstituteRow) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === index ? { ...ex, exerciseId: sub.exercise_id, exerciseName: sub.name } : ex,
      ),
    );
  }

  if (finished) {
    return <Summary day={day} exercises={exercises} elapsedMs={Date.now() - startedAt} />;
  }

  const re = current.routineExercise;
  const isLast = index === exercises.length - 1;

  return (
    <div className="space-y-4 pb-4">
      {/* Header / progress */}
      <div className="flex items-center justify-between">
        <Link href="/today" className="text-sm font-medium text-muted-foreground">
          ✕ Close
        </Link>
        <span className="text-sm font-medium text-muted-foreground">
          {doneSets}/{totalSets} sets
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      {/* Exercise header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Exercise {index + 1} of {exercises.length}
          </p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            {current.exerciseName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Target {re.sets} × {re.rep_min}–{re.rep_max}
            {re.target_rpe ? ` · RPE ${re.target_rpe}` : ''} · rest {re.rest_seconds}s
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSwapOpen(true)}>
          Swap
        </Button>
      </div>

      {/* Set list */}
      <Card className="!p-0">
        <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem_2.75rem] items-center gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Set</span>
          <span>Weight (kg)</span>
          <span>Reps</span>
          <span>RPE</span>
          <span className="text-right">Done</span>
        </div>
        <ul>
          {current.sets.map((s, i) => {
            const ghost = mockPreviousSets(re.exercise_slug, current.sets.length)[i];
            return (
              <li
                key={i}
                className="grid grid-cols-[2rem_1fr_1fr_2.5rem_2.75rem] items-center gap-2 border-b border-border px-4 py-2 last:border-b-0"
              >
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`Set ${i + 1} weight`}
                    value={s.weight_kg || ''}
                    placeholder={ghost ? String(ghost.weight_kg) : '0'}
                    onChange={(e) => updateSet(index, i, { weight_kg: Number(e.target.value) })}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm tabular-nums outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    aria-label="Plate math"
                    onClick={() => setPlateForSet(i)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground"
                  >
                    <ScaleIcon size={16} />
                  </button>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label={`Set ${i + 1} reps`}
                  value={s.reps || ''}
                  placeholder={ghost ? String(ghost.reps) : String(re.rep_max)}
                  onChange={(e) => updateSet(index, i, { reps: Number(e.target.value) })}
                  className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm tabular-nums outline-none focus:border-accent"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={`Set ${i + 1} RPE`}
                  value={s.rpe ?? ''}
                  placeholder={ghost?.rpe != null ? String(ghost.rpe) : '—'}
                  onChange={(e) =>
                    updateSet(index, i, { rpe: e.target.value ? Number(e.target.value) : null })
                  }
                  className="h-9 w-full rounded-lg border border-border bg-surface px-1 text-center text-sm tabular-nums outline-none focus:border-accent"
                />
                <button
                  type="button"
                  aria-label={`Mark set ${i + 1} ${s.done ? 'not done' : 'done'}`}
                  aria-pressed={s.done}
                  onClick={() => completeSet(i)}
                  className={
                    'ml-auto grid h-9 w-9 place-items-center rounded-lg border text-base font-bold transition-colors ' +
                    (s.done
                      ? 'border-success bg-success text-white'
                      : 'border-border bg-surface text-muted-foreground')
                  }
                >
                  ✓
                </button>
              </li>
            );
          })}
        </ul>
        <div className="px-4 py-2">
          <button
            type="button"
            onClick={addSet}
            className="text-sm font-medium text-accent"
          >
            + Add set
          </button>
        </div>
      </Card>

      {/* Ghost hint */}
      <p className="text-xs text-muted-foreground">
        Greyed numbers are last session&rsquo;s sets — tap ✓ to log the same, or edit first.
      </p>

      {/* Pager controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          ← Prev
        </Button>
        {isLast ? (
          <Button block onClick={() => setFinished(true)}>
            Finish workout
          </Button>
        ) : (
          <Button block onClick={() => setIndex((i) => Math.min(exercises.length - 1, i + 1))}>
            Next exercise →
          </Button>
        )}
      </div>

      {/* Rest timer overlay */}
      {restLeft != null && (
        <RestTimer
          left={restLeft}
          total={restTotalRef.current}
          onSkip={() => setRestLeft(null)}
          onAdd={() => setRestLeft((s) => (s == null ? 30 : s + 30))}
        />
      )}

      {/* Swap sheet */}
      <SubstituteSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        exerciseId={current.exerciseId}
        exerciseName={current.exerciseName}
        onPick={onSwap}
      />

      {/* Plate math sheet */}
      <Sheet
        open={plateForSet != null}
        onClose={() => setPlateForSet(null)}
        title="Plate math"
      >
        {plateForSet != null &&
          (() => {
            const target = current.sets[plateForSet]?.weight_kg ?? 0;
            const bd = plateBreakdown(target);
            return (
              <div>
                <p className="text-sm text-muted-foreground">
                  Loading <span className="font-semibold text-foreground">{target} kg</span> on a{' '}
                  {BAR_KG} kg bar — per side:
                </p>
                {bd.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Just the bar (or add micro-plates).
                  </p>
                ) : (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {bd.map((b) => (
                      <li
                        key={b.plate}
                        className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-semibold"
                      >
                        {b.count} × {b.plate} kg
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })()}
      </Sheet>
    </div>
  );
}

function RestTimer({
  left,
  total,
  onSkip,
  onAdd,
}: {
  left: number;
  total: number;
  onSkip: () => void;
  onAdd: () => void;
}) {
  const pct = total > 0 ? (left / total) * 100 : 0;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-[720px] px-4 md:bottom-4">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 shadow-lg">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-muted text-sm font-bold tabular-nums text-accent">
          {mm}:{ss}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Rest</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-lg bg-surface px-3 py-2 text-xs font-semibold"
        >
          +30s
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg bg-surface px-3 py-2 text-xs font-semibold"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

function Summary({
  day,
  exercises,
  elapsedMs,
}: {
  day: RoutineDay;
  exercises: ExerciseState[];
  elapsedMs: number;
}) {
  const doneSets = exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const volume = exercises.reduce(
    (v, e) => v + e.sets.filter((s) => s.done).reduce((a, s) => a + s.reps * s.weight_kg, 0),
    0,
  );
  const mins = Math.max(1, Math.round(elapsedMs / 60000));
  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
          <CheckIcon size={32} />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Workout complete</h1>
        <p className="mt-1 text-sm text-muted-foreground">{day.name}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-extrabold tabular-nums">{doneSets}</p>
          <p className="text-xs text-muted-foreground">sets logged</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold tabular-nums">{Math.round(volume).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">kg volume</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold tabular-nums">{mins}</p>
          <p className="text-xs text-muted-foreground">minutes</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Session detail</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {exercises.map((e) => {
            const done = e.sets.filter((s) => s.done);
            return (
              <li key={e.routineExercise.id} className="flex justify-between">
                <span className="truncate pr-3">{e.exerciseName}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {done.length > 0
                    ? done.map((s) => `${s.reps}×${s.weight_kg}`).join(', ')
                    : 'skipped'}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Link href="/today" className="block">
        <Button size="lg" block>
          Done
        </Button>
      </Link>
    </div>
  );
}
