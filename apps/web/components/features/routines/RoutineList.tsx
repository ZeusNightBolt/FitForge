'use client';

/**
 * Routines hub (the "Workouts" tab, §2.3). Lists routines with the single active one badged;
 * links into the editor; supports duplicate + new. Mocked list — writes are no-ops with local
 * optimistic state.
 */
import * as React from 'react';
import Link from 'next/link';
import { Card, CardTitle, CardDescription, Button, Chip } from '@/components/ui';
import { MOCK_ROUTINES_LIST } from '@/components/features/_mock/data';

const GOAL_LABEL: Record<string, string> = {
  strength: 'Strength',
  hypertrophy: 'Build muscle',
  fat_loss: 'Lose fat',
  endurance: 'Endurance',
  general_health: 'General health',
};

export function RoutineList() {
  const [routines, setRoutines] = React.useState(MOCK_ROUTINES_LIST);

  function setActive(id: string) {
    setRoutines((prev) => prev.map((r) => ({ ...r, is_active: r.id === id })));
  }
  function duplicate(id: string) {
    setRoutines((prev) => {
      const src = prev.find((r) => r.id === id);
      if (!src) return prev;
      return [
        ...prev,
        { ...src, id: `${id}-copy-${prev.length}`, name: `${src.name} (copy)`, is_active: false, source: 'custom' as const },
      ];
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Workouts</h1>
        <Link href="/exercises" className="text-sm font-medium text-accent">
          Browse exercises
        </Link>
      </header>

      <div className="space-y-3">
        {routines.map((r) => (
          <Card key={r.id} className="!p-0">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="truncate">{r.name}</CardTitle>
                    {r.is_active && (
                      <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                        Active
                      </span>
                    )}
                  </div>
                  {r.description && <CardDescription>{r.description}</CardDescription>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.goal && (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                        {GOAL_LABEL[r.goal] ?? r.goal}
                      </span>
                    )}
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                      {r.source === 'generated' ? 'Generated' : 'Custom'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link href={`/routines/${r.id}`}>
                  <Button size="sm" variant="secondary">
                    Edit
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => duplicate(r.id)}>
                  Duplicate
                </Button>
                {!r.is_active && (
                  <Button size="sm" variant="ghost" onClick={() => setActive(r.id)}>
                    Make active
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card interactive className="border-dashed text-center">
        <p className="text-sm font-medium text-muted-foreground">
          + New routine
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Start blank, or re-generate from your profile in Settings.
        </p>
      </Card>
    </div>
  );
}
