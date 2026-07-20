'use client';

/**
 * MuscleMapThumb (§4.1) — the tiny (≈56px) list-card "image". Single auto view, outline +
 * gold fills only (no separation strokes on unhighlighted muscles), no labels, not
 * interactive. Same path data as MuscleMap — cheap and consistent.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import type { MuscleSlug, MuscleView } from './types';
import { MUSCLE_NAMES, ALL_MUSCLE_SLUGS } from './types';
import { MUSCLE_PATHS } from './paths';
import { BODY_OUTLINE } from './outline';

const RATIO = 200 / 440;
const MIRROR = 'scale(-1,1) translate(-200,0)';

export interface MuscleMapThumbProps {
  primary?: MuscleSlug[];
  secondary?: MuscleSlug[];
  height?: number;
  className?: string;
}

function pickView(primary: MuscleSlug[]): MuscleView {
  let front = 0;
  let back = 0;
  for (const slug of primary) {
    for (const p of MUSCLE_PATHS[slug] ?? []) {
      if (p.view === 'front') front += 1;
      else back += 1;
    }
  }
  return back > front ? 'back' : 'front';
}

export function MuscleMapThumb({
  primary = [],
  secondary = [],
  height = 56,
  className,
}: MuscleMapThumbProps) {
  const view = pickView(primary);
  const primarySet = new Set(primary);
  const secondarySet = new Set(secondary);
  const width = height * RATIO;

  const label =
    primary.length > 0
      ? `Target muscles: ${primary.map((m) => MUSCLE_NAMES[m]).join(', ')}`
      : 'Muscle map';

  const slugsInView = ALL_MUSCLE_SLUGS.filter((slug) =>
    (MUSCLE_PATHS[slug] ?? []).some((p) => p.view === view),
  );

  return (
    <svg
      viewBox="0 0 200 440"
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className={cn('block', className)}
    >
      <path
        d={BODY_OUTLINE[view]}
        fill="none"
        stroke="var(--body-outline)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {slugsInView.map((slug) => {
        const isPrimary = primarySet.has(slug);
        const isSecondary = secondarySet.has(slug);
        if (!isPrimary && !isSecondary) return null;
        const opacity = isPrimary ? 0.95 : 0.38;
        return (MUSCLE_PATHS[slug] ?? [])
          .filter((p) => p.view === view)
          .flatMap((p, i) => {
            const el = <path key={`${slug}-${i}-a`} d={p.d} fill="var(--accent)" fillOpacity={opacity} />;
            if (p.side === 'center') return [el];
            return [
              el,
              <path key={`${slug}-${i}-b`} d={p.d} transform={MIRROR} fill="var(--accent)" fillOpacity={opacity} />,
            ];
          });
      })}
    </svg>
  );
}
