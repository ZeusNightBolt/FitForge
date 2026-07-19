'use client';

/**
 * Progress (§2.3): weight & measurement charts, PR list (v_exercise_prs best Epley e1RM), photo
 * timeline (uploads target the `progress-photos` Storage bucket, path `{user_id}/…`). Charts are
 * inline SVG (charts.tsx). Upload is a mocked local preview — INTEGRATION: wire to
 * supabase.storage.from('progress-photos').upload(`${uid}/${uuid}.jpg`, file).
 */
import * as React from 'react';
import { Button, Card, CardTitle, Chip, Sheet } from '@/components/features/_stubs';
import { LineChart } from '@/components/features/progress/charts';
import {
  MOCK_BODY_METRICS,
  MOCK_MEASUREMENTS,
  MOCK_PRS,
  MOCK_PHOTOS,
  type ProgressPhoto,
  type PhotoPose,
} from '@/components/features/_mock/data';

type Tab = 'weight' | 'measurements' | 'prs' | 'photos';
const TABS: { id: Tab; label: string }[] = [
  { id: 'weight', label: 'Weight' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'prs', label: 'PRs' },
  { id: 'photos', label: 'Photos' },
];

export function ProgressView() {
  const [tab, setTab] = React.useState<Tab>('weight');

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Progress</h1>

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

function WeightTab() {
  const data = MOCK_BODY_METRICS.filter((b) => b.weight_kg != null).map((b) => ({
    label: b.measured_on.slice(5),
    value: b.weight_kg as number,
  }));
  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const delta = +(last - first).toFixed(1);
  return (
    <Card>
      <div className="mb-2 flex items-baseline justify-between">
        <CardTitle>Body weight</CardTitle>
        <span
          className={
            'text-sm font-semibold ' + (delta <= 0 ? 'text-success' : 'text-muted-foreground')
          }
        >
          {delta > 0 ? '+' : ''}
          {delta} kg over {data.length} weeks
        </span>
      </div>
      <LineChart data={data} unit="kg" height={200} />
      <Button variant="secondary" block className="mt-4">
        + Log today&rsquo;s weight
      </Button>
    </Card>
  );
}

function MeasurementsTab() {
  return (
    <div className="space-y-3">
      {MOCK_MEASUREMENTS.map((m) => {
        const data = m.series.map((v, i) => ({ label: `W${i + 1}`, value: v }));
        return (
          <Card key={m.key}>
            <CardTitle className="mb-1 text-base">{m.label}</CardTitle>
            <LineChart data={data} unit="cm" height={140} />
          </Card>
        );
      })}
      <Button variant="secondary" block>
        + Log measurements
      </Button>
    </div>
  );
}

function PrTab() {
  const prs = [...MOCK_PRS].sort((a, b) => b.best_e1rm - a.best_e1rm);
  return (
    <Card className="!p-0">
      <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2 border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Exercise</span>
        <span className="text-right">Best set</span>
        <span className="text-right">e1RM</span>
      </div>
      <ul className="divide-y divide-border">
        {prs.map((pr) => (
          <li
            key={pr.exercise_id}
            className="grid grid-cols-[1fr_4.5rem_4.5rem] items-center gap-2 px-4 py-3"
          >
            <span className="truncate text-sm font-medium text-foreground">{pr.exercise_name}</span>
            <span className="text-right text-sm tabular-nums text-muted-foreground">
              {pr.best_weight_kg}×{pr.best_reps}
            </span>
            <span className="text-right text-sm font-bold tabular-nums text-accent">
              {pr.best_e1rm} kg
            </span>
          </li>
        ))}
      </ul>
      <p className="px-4 py-2 text-xs text-muted-foreground">
        Estimated 1-rep max via Epley: weight × (1 + reps/30).
      </p>
    </Card>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = React.useState<ProgressPhoto[]>(MOCK_PHOTOS);
  const [uploadOpen, setUploadOpen] = React.useState(false);

  // Group by date (timeline).
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
      <Button block onClick={() => setUploadOpen(true)}>
        + Add progress photo
      </Button>
      {byDate.map(([date, group]) => (
        <div key={date}>
          <p className="mb-2 text-sm font-semibold text-muted-foreground">{date}</p>
          <div className="grid grid-cols-3 gap-2">
            {group.map((p) => (
              <figure
                key={p.id}
                className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface-2"
              >
                <div className="grid h-full w-full place-items-center text-4xl text-muted-foreground/40">
                  {'\u{1F4F7}'}
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
                taken_on: new Date().toISOString().slice(0, 10),
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
      <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-border bg-surface-2 text-sm text-muted-foreground">
        Tap to choose a photo (mock)
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
      <p className="text-xs text-muted-foreground">
        Uploads to the private <code>progress-photos</code> bucket at{' '}
        <code>{'{user_id}'}/…jpg</code>.
      </p>
      <Button block size="lg" onClick={() => onAdd(pose)}>
        Save photo
      </Button>
    </div>
  );
}
