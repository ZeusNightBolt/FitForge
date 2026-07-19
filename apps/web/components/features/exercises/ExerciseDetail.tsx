'use client';

/**
 * Exercise detail (§2.3): the one-shot v_exercise_full read — muscles (primary/secondary),
 * equipment (grouped by alt_group: alternatives within a group, all groups required),
 * instructions, and the substitute list (suggest_substitutes). Mocked.
 */
import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardTitle, Button } from '@/components/features/_stubs';
import { SubstituteSheet } from '@/components/features/shared/SubstituteSheet';
import {
  mockExerciseBySlug,
  mockSuggestSubstitutes,
  type SubstituteRow,
} from '@/components/features/_mock/data';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function humanize(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ExerciseDetail({ slug }: { slug: string }) {
  const ex = mockExerciseBySlug(slug);
  const [swapOpen, setSwapOpen] = React.useState(false);
  if (!ex) return notFound();

  const subs: SubstituteRow[] = mockSuggestSubstitutes(ex.id, 5);

  return (
    <div className="space-y-5">
      <Link href="/exercises" className="text-sm font-medium text-muted-foreground">
        ← Exercises
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{ex.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <Tag>{ex.category_name}</Tag>
          <Tag>{ex.movement_pattern.replace(/_/g, ' ')}</Tag>
          <Tag>{ex.mechanics}</Tag>
          <Tag>{DIFFICULTY_LABEL[ex.difficulty]}</Tag>
          {ex.is_unilateral && <Tag>Unilateral</Tag>}
          {ex.is_bodyweight_ok && <Tag>Bodyweight OK</Tag>}
        </div>
      </div>

      {/* Hero placeholder */}
      <div className="grid aspect-video place-items-center rounded-2xl border border-border bg-surface-2 text-5xl text-muted-foreground/40">
        {'\u{1F3CB}\u{FE0F}'}
      </div>

      {/* Muscles */}
      <Card>
        <CardTitle className="mb-2 text-base">Muscles worked</CardTitle>
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Primary</span>
            {ex.primary_muscles.map((m) => (
              <span key={m} className="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent">
                {humanize(m)}
              </span>
            ))}
          </div>
          {ex.secondary_muscles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">Secondary</span>
              {ex.secondary_muscles.map((m) => (
                <span key={m} className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted-foreground">
                  {humanize(m)}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Equipment */}
      <Card>
        <CardTitle className="mb-2 text-base">Equipment</CardTitle>
        {ex.equipment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No equipment needed — bodyweight.</p>
        ) : (
          <div className="space-y-2">
            {ex.equipment.map((grp, i) => (
              <div key={grp.alt_group} className="flex flex-wrap items-center gap-1.5 text-sm">
                {i > 0 && <span className="text-xs font-bold text-muted-foreground">＋</span>}
                {grp.names.map((n, j) => (
                  <React.Fragment key={n}>
                    {j > 0 && <span className="text-xs text-muted-foreground">or</span>}
                    <span className="rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-foreground">
                      {n}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Items joined by &ldquo;or&rdquo; are interchangeable; separate groups are all required.
            </p>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card>
        <CardTitle className="mb-2 text-base">How to do it</CardTitle>
        <p className="text-sm leading-relaxed text-foreground">{ex.instructions}</p>
      </Card>

      {/* Substitutes */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="text-base">Substitutes</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setSwapOpen(true)}>
            See all
          </Button>
        </div>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No substitutes found.</p>
        ) : (
          <ul className="space-y-2">
            {subs.slice(0, 3).map((s) => (
              <li key={s.exercise_id}>
                <Link
                  href={`/exercises/${s.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:border-accent/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {s.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{s.reason}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent">
                    {Math.round(s.score)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SubstituteSheet
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        exerciseId={ex.id}
        exerciseName={ex.name}
        onPick={(s) => {
          window.location.href = `/exercises/${s.slug}`;
        }}
      />
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5 capitalize text-muted-foreground">
      {children}
    </span>
  );
}
