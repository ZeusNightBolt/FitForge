'use client';

/**
 * Progress (§2.3): weight & measurement charts, PR list, photo timeline. A fresh demo user starts
 * empty — every tab shows a real empty state with a clear action. Weight logging is fully
 * functional and persists to the demo store (localStorage); the chart is built from real entries.
 * INTEGRATION: photos wire to supabase.storage.from('progress-photos'); PRs derive from set_logs.
 */
import * as React from 'react';
import { Button, Card, CardTitle, Chip, Sheet } from '@/components/ui';
import { LineChart } from '@/components/features/progress/charts';
import { ScaleIcon, TrendingUpIcon, PlusIcon, TargetIcon, TrophyIcon } from '@/components/ui/icons';
import { useWeights } from '@/lib/demo/useDemo';
import { MuscleMap, MUSCLE_NAMES, type MuscleSlug } from '@/components/illustrations';
import {
  useWorkoutSessions,
  weeklyHeat,
  setsPerMuscleLast7Days,
  computePRs,
} from '@/components/features/shared/workoutLog';
import type { ProgressPhoto, PhotoPose } from '@/components/features/_mock/data';

type Tab = 'weight' | 'measurements' | 'prs' | 'photos';
const TABS: { id: Tab; label: string }[] = [
  { id: 'weight', label: 'Weight' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'prs', label: 'PRs' },
  { id: 'photos', label: 'Photos' },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 border-2 border-dashed border-border py-9 text-center shadow-none">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-muted text-accent">
        {icon}
      </span>
      <CardTitle>{title}</CardTitle>
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">{body}</p>
      {action}
    </Card>
  );
}

export function ProgressView() {
  const [tab, setTab] = React.useState<Tab>('weight');
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold tracking-tight">Progress</h1>
      <WeeklyVolumeHeatmap />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Chip key={t.id} selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      {tab === 'weight' && <WeightTab />}
      {tab === 'measurements' && <MeasurementsTab />}
      {tab === 'prs' && <PrTab />}
      {tab === 'photos' && <PhotosTab />}
    </div>
  );
}

/**
 * Weekly volume heatmap (§6 P1-7) — the "my body as a dashboard" signature. Colours each muscle by
 * how many weighted sets it absorbed over the last 7 days (primary set = 1, secondary = 0.5),
 * mapped to gold saturation via the frozen MuscleMap `heat` prop.
 */
function WeeklyVolumeHeatmap() {
  const sessions = useWorkoutSessions();
  const heat = React.useMemo(() => weeklyHeat(sessions), [sessions]);
  const perMuscle = React.useMemo(() => setsPerMuscleLast7Days(sessions), [sessions]);
  const worked = Object.keys(heat).length > 0;

  // Top few worked muscles for the caption.
  const top = React.useMemo(
    () =>
      (Object.entries(perMuscle) as [MuscleSlug, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    [perMuscle],
  );

  return (
    <Card premium className="shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between">
        <CardTitle>Weekly volume</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">last 7 days</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {worked
          ? 'Where your training landed this week — brighter gold means more sets.'
          : 'Log a workout and your muscle map lights up with the week’s volume.'}
      </p>
      <div className="mt-3 flex items-center justify-center">
        <MuscleMap
          view="both"
          heat={heat}
          height={210}
          className="mx-auto"
        />
      </div>
      {worked ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {top.map(([slug, sets]) => (
            <span
              key={slug}
              className="rounded-chip bg-accent-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent"
            >
              {MUSCLE_NAMES[slug]} · {sets % 1 === 0 ? sets : sets.toFixed(1)}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <span>Fresh</span>
          <span className="h-2 w-24 rounded-full bg-gradient-to-r from-muted to-accent" />
          <span>High volume</span>
        </div>
      )}
    </Card>
  );
}

function WeightTab() {
  const { weights, logWeight } = useWeights();
  const [open, setOpen] = React.useState(false);

  if (weights.length === 0) {
    return (
      <>
        <EmptyState
          icon={<ScaleIcon size={26} />}
          title="Track your body weight"
          body="Log your weight to build a trend line and see progress toward your goal over time."
          action={
            <Button className="mt-1" onClick={() => setOpen(true)}>
              <PlusIcon size={18} /> Log your first weigh-in
            </Button>
          }
        />
        <WeightSheet open={open} onClose={() => setOpen(false)} onSave={(kg) => logWeight(todayISO(), kg)} />
      </>
    );
  }

  const data = weights.map((w) => ({ label: w.date.slice(5), value: w.kg }));
  const firstKg = weights[0]!.kg;
  const lastKg = weights[weights.length - 1]!.kg;
  const delta = +(lastKg - firstKg).toFixed(1);
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-baseline justify-between">
        <CardTitle>Body weight</CardTitle>
        {weights.length > 1 && (
          <span className={'text-sm font-semibold ' + (delta <= 0 ? 'text-success' : 'text-muted-foreground')}>
            {delta > 0 ? '+' : ''}
            {delta} kg · {weights.length} entries
          </span>
        )}
      </div>
      {weights.length > 1 ? (
        <LineChart data={data} unit="kg" height={200} />
      ) : (
        <p className="rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
          First entry logged: <span className="font-semibold text-foreground">{firstKg} kg</span>. Log
          again tomorrow to start your trend line.
        </p>
      )}
      <Button variant="secondary" block className="mt-4" onClick={() => setOpen(true)}>
        <PlusIcon size={18} /> Log today&rsquo;s weight
      </Button>
      <WeightSheet open={open} onClose={() => setOpen(false)} onSave={(kg) => logWeight(todayISO(), kg)} />
    </Card>
  );
}

function WeightSheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (kg: number) => void;
}) {
  const [kg, setKg] = React.useState('');
  const val = Number(kg);
  const valid = kg.trim() !== '' && val > 0 && val < 500;
  return (
    <Sheet open={open} onClose={onClose} title="Log weight">
      <div className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weight (kg)
          </span>
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={kg}
            placeholder="e.g. 78.5"
            onChange={(e) => setKg(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-lg tabular-nums outline-none focus:border-accent"
          />
        </label>
        <Button
          block
          size="lg"
          disabled={!valid}
          onClick={() => {
            onSave(val);
            setKg('');
            onClose();
          }}
        >
          Save weigh-in
        </Button>
      </div>
    </Sheet>
  );
}

function MeasurementsTab() {
  return (
    <EmptyState
      icon={<TargetIcon size={26} />}
      title="No measurements yet"
      body="Track chest, waist, arms and more to see how your body composition changes — not just the scale."
      action={
        <Button variant="secondary" className="mt-1" disabled>
          Coming soon
        </Button>
      }
    />
  );
}

function PrTab() {
  const sessions = useWorkoutSessions();
  const prs = React.useMemo(() => computePRs(sessions), [sessions]);

  if (prs.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUpIcon size={26} />}
        title="No personal records yet"
        body="Finish a logged workout and your best sets — plus an estimated 1-rep max (Epley) — show up here automatically."
      />
    );
  }

  return (
    <Card className="!p-0 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-accent">
        <TrophyIcon size={18} />
        <CardTitle>Personal records</CardTitle>
      </div>
      <ul>
        {prs.map((p, i) => (
          <li
            key={p.exercise_id}
            className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="truncate text-sm font-semibold text-foreground">
                {p.exercise_name}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-base font-bold tabular-nums text-accent">
                {Math.round(p.best_e1rm)} kg
              </span>
              <span className="block text-[11px] tabular-nums text-muted-foreground">
                {p.best_weight_kg}kg × {p.best_reps} · e1RM
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = React.useState<ProgressPhoto[]>([]);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  const byDate = React.useMemo(() => {
    const map = new Map<string, ProgressPhoto[]>();
    for (const p of photos) {
      const arr = map.get(p.taken_on) ?? [];
      arr.push(p);
      map.set(p.taken_on, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [photos]);

  return (
    <div className="space-y-4">
      {photos.length === 0 ? (
        <EmptyState
          icon={<PlusIcon size={26} />}
          title="No progress photos yet"
          body="Add front, side and back photos over time to see visual change. Photos stay on your device in demo mode."
          action={
            <Button className="mt-1" onClick={() => setUploadOpen(true)}>
              <PlusIcon size={18} /> Add a photo
            </Button>
          }
        />
      ) : (
        <Button block onClick={() => setUploadOpen(true)}>
          <PlusIcon size={18} /> Add progress photo
        </Button>
      )}
      {byDate.map(([date, group]) => (
        <div key={date}>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{date}</p>
          <div className="grid grid-cols-3 gap-2">
            {group.map((p) => (
              <figure
                key={p.id}
                className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-muted"
              >
                <div className="grid h-full w-full place-items-center text-muted-foreground/40">
                  <ScaleIcon size={28} />
                </div>
                <figcaption className="absolute bottom-1 left-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium capitalize text-white">
                  {p.pose}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}

      <Sheet open={uploadOpen} onClose={() => setUploadOpen(false)} title="Add progress photo">
        <UploadForm
          onAdd={(pose) => {
            setPhotos((prev) => [
              {
                id: `p-new-${prev.length}`,
                taken_on: todayISO(),
                pose,
                storage_path: `mock/${pose}-new.jpg`,
              },
              ...prev,
            ]);
            setUploadOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function UploadForm({ onAdd }: { onAdd: (pose: PhotoPose) => void }) {
  const [pose, setPose] = React.useState<PhotoPose>('front');
  const poses: PhotoPose[] = ['front', 'side', 'back'];
  return (
    <div className="space-y-4">
      <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
        Tap to choose a photo (demo)
      </div>
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Pose
        </span>
        <div className="flex gap-2">
          {poses.map((p) => (
            <Chip key={p} selected={pose === p} onClick={() => setPose(p)}>
              <span className="capitalize">{p}</span>
            </Chip>
          ))}
        </div>
      </div>
      <Button block size="lg" onClick={() => onAdd(pose)}>
        Save photo
      </Button>
    </div>
  );
}
