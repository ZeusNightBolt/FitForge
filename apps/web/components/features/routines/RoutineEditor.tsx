'use client';

/**
 * Routine editor (§2.3): switch days, reorder/edit/remove exercises, add via type-ahead search,
 * swap via substitutes, duplicate. Reorder is exposed as up/down controls (keyboard- & touch-
 * friendly stand-in for the drag interaction; INTEGRATION: wire a drag lib if desired). All edits
 * are local optimistic state over mocked data.
 */
import * as React from 'react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardTitle,
  Chip,
  SearchInput,
  Stepper,
} from '@/components/ui';
import { SubstituteSheet } from '@/components/features/shared/SubstituteSheet';
import {
  mockRoutineById,
  mockSearchExercises,
  mockExerciseById,
  type RoutineExercise,
  type RoutineDay,
  type ExerciseSearchRow,
  type SubstituteRow,
} from '@/components/features/_mock/data';

let nextId = 1;
const genId = () => `new-rex-${nextId++}`;

export function RoutineEditor({ routineId }: { routineId: string }) {
  const initial = React.useMemo(() => mockRoutineById(routineId), [routineId]);
  const [name, setName] = React.useState(initial.name);
  const [days, setDays] = React.useState<RoutineDay[]>(() =>
    initial.days.map((d) => ({ ...d, exercises: d.exercises.map((e) => ({ ...e })) })),
  );
  const [activeDayId, setActiveDayId] = React.useState(days[0]?.id ?? '');
  const [swapFor, setSwapFor] = React.useState<RoutineExercise | null>(null);
  const [dirty, setDirty] = React.useState(false);

  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0]!;

  function mutateDay(dayId: string, fn: (d: RoutineDay) => RoutineDay) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? fn(d) : d)));
    setDirty(true);
  }
  function mutateExercise(dayId: string, rexId: string, patch: Partial<RoutineExercise>) {
    mutateDay(dayId, (d) => ({
      ...d,
      exercises: d.exercises.map((e) => (e.id === rexId ? { ...e, ...patch } : e)),
    }));
  }
  function move(dayId: string, rexId: string, dir: -1 | 1) {
    mutateDay(dayId, (d) => {
      const idx = d.exercises.findIndex((e) => e.id === rexId);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= d.exercises.length) return d;
      const next = [...d.exercises];
      const [item] = next.splice(idx, 1);
      next.splice(to, 0, item!);
      return { ...d, exercises: next.map((e, i) => ({ ...e, position: i + 1 })) };
    });
  }
  function remove(dayId: string, rexId: string) {
    mutateDay(dayId, (d) => ({
      ...d,
      exercises: d.exercises
        .filter((e) => e.id !== rexId)
        .map((e, i) => ({ ...e, position: i + 1 })),
    }));
  }
  function addExercise(dayId: string, row: ExerciseSearchRow) {
    const ex = mockExerciseById(row.exercise_id);
    if (!ex) return;
    mutateDay(dayId, (d) => ({
      ...d,
      exercises: [
        ...d.exercises,
        {
          id: genId(),
          position: d.exercises.length + 1,
          exercise_id: ex.id,
          exercise_slug: ex.slug,
          exercise_name: ex.name,
          image_path: ex.image_path,
          sets: 3,
          rep_min: 8,
          rep_max: 12,
          target_rpe: 7,
          rest_seconds: 90,
          superset_group: null,
          notes: null,
        },
      ],
    }));
  }
  function applySwap(sub: SubstituteRow) {
    if (!swapFor) return;
    const ex = mockExerciseById(sub.exercise_id);
    mutateExercise(activeDay.id, swapFor.id, {
      exercise_id: sub.exercise_id,
      exercise_slug: ex?.slug ?? swapFor.exercise_slug,
      exercise_name: sub.name,
    });
  }

  return (
    <div className="space-y-5 pb-4">
      <header className="space-y-3">
        <Link href="/routines" className="text-sm font-medium text-muted-foreground">
          ← Workouts
        </Link>
        <input
          value={name}
          aria-label="Routine name"
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-xl font-extrabold tracking-tight outline-none focus:border-accent"
        />
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={!dirty}>
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
          <Button size="sm" variant="ghost">
            Duplicate
          </Button>
        </div>
      </header>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <Chip key={d.id} selected={d.id === activeDayId} onClick={() => setActiveDayId(d.id)}>
            {d.name.replace(/^Day /, '')}
          </Chip>
        ))}
      </div>

      {/* Active day exercises */}
      <div className="space-y-3">
        {activeDay.exercises.map((e, i) => (
          <Card key={e.id} className="!p-0">
            <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/exercises/${e.exercise_slug}`}
                  className="block truncate text-sm font-semibold text-foreground hover:text-accent"
                >
                  {i + 1}. {e.exercise_name}
                </Link>
                {e.superset_group != null && (
                  <span className="text-xs text-accent">Superset {e.superset_group}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => move(activeDay.id, e.id, -1)}>
                  ↑
                </IconBtn>
                <IconBtn
                  label="Move down"
                  disabled={i === activeDay.exercises.length - 1}
                  onClick={() => move(activeDay.id, e.id, 1)}
                >
                  ↓
                </IconBtn>
                <IconBtn label="Swap" onClick={() => setSwapFor(e)}>
                  ⇄
                </IconBtn>
                <IconBtn label="Remove" onClick={() => remove(activeDay.id, e.id)}>
                  ✕
                </IconBtn>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-4">
              <Field label="Sets">
                <Stepper
                  value={e.sets}
                  min={1}
                  max={10}
                  onChange={(v) => mutateExercise(activeDay.id, e.id, { sets: v })}
                  aria-label={`${e.exercise_name} sets`}
                />
              </Field>
              <Field label="Rep min">
                <NumberBox
                  value={e.rep_min}
                  onChange={(v) =>
                    mutateExercise(activeDay.id, e.id, { rep_min: v, rep_max: Math.max(v, e.rep_max) })
                  }
                />
              </Field>
              <Field label="Rep max">
                <NumberBox
                  value={e.rep_max}
                  onChange={(v) =>
                    mutateExercise(activeDay.id, e.id, { rep_max: Math.max(v, e.rep_min) })
                  }
                />
              </Field>
              <Field label="Rest (s)">
                <NumberBox
                  value={e.rest_seconds}
                  step={15}
                  onChange={(v) => mutateExercise(activeDay.id, e.id, { rest_seconds: v })}
                />
              </Field>
            </div>
          </Card>
        ))}
      </div>

      {/* Add exercise via type-ahead */}
      <Card>
        <CardTitle className="mb-2 text-sm">Add exercise</CardTitle>
        <SearchInput<ExerciseSearchRow>
          search={async (q) => mockSearchExercises(q, 8)}
          getKey={(r) => r.exercise_id}
          onSelect={(r) => addExercise(activeDay.id, r)}
          renderResult={(r) => <span className="font-medium">{r.name}</span>}
          placeholder="Search the catalog…"
          aria-label="Add exercise to day"
        />
      </Card>

      <SubstituteSheet
        open={swapFor != null}
        onClose={() => setSwapFor(null)}
        exerciseId={swapFor?.exercise_id ?? ''}
        exerciseName={swapFor?.exercise_name ?? ''}
        onPick={applySwap}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumberBox({
  value,
  onChange,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base tabular-nums outline-none focus:border-accent"
    />
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-sm text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}
