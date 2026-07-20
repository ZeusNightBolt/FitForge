'use client';

/**
 * MuscleMap (§4.1) — the data-driven front/back anatomy map that doubles as the exercise
 * "image", the onboarding body picker, the exercises muscle filter, and (via `heat`) the
 * weekly-volume / recovery heatmap. FROZEN props contract lives in ./types.
 *
 * Rendering: one <svg> per view (viewBox 0 0 200 440). Muscles are simplified closed
 * polygons filled var(--muscle-base); `side:'right'` shapes are drawn once as authored and
 * once mirrored (scale(-1,1) translate(-200,0)). Highlighted muscles fill gold. Interactive
 * mode wraps each muscle in a focusable <a role="button">.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import type { MuscleSlug, MuscleView, MuscleMapProps } from './types';
import { MUSCLE_NAMES, ALL_MUSCLE_SLUGS } from './types';
import { MUSCLE_PATHS, MUSCLE_LABEL_ANCHORS } from './paths';
import { BODY_OUTLINE, ABS_CROSSLINES } from './outline';

const RATIO = 200 / 440;
const MIRROR = 'scale(-1,1) translate(-200,0)';

interface MuscleStyle {
  fill: string;
  opacity: number;
  highlighted: boolean;
}

function styleFor(
  slug: MuscleSlug,
  primary: Set<MuscleSlug>,
  secondary: Set<MuscleSlug>,
  heat: MuscleMapProps['heat'],
): MuscleStyle {
  if (heat && heat[slug] != null) {
    const v = Math.max(0, Math.min(1, heat[slug] as number));
    return { fill: 'var(--accent)', opacity: 0.15 + 0.75 * v, highlighted: true };
  }
  if (primary.has(slug)) return { fill: 'var(--accent)', opacity: 0.95, highlighted: true };
  if (secondary.has(slug)) return { fill: 'var(--accent)', opacity: 0.38, highlighted: true };
  return { fill: 'var(--muscle-base)', opacity: 1, highlighted: false };
}

/** Pick the auto view: the one with the most primary paths; ties → front. */
function autoView(primary: Set<MuscleSlug>, heat: MuscleMapProps['heat']): MuscleView {
  const keys = primary.size > 0 ? [...primary] : heat ? (Object.keys(heat) as MuscleSlug[]) : [];
  let front = 0;
  let back = 0;
  for (const slug of keys) {
    for (const p of MUSCLE_PATHS[slug] ?? []) {
      if (p.view === 'front') front += 1;
      else back += 1;
    }
  }
  return back > front ? 'back' : 'front';
}

function composeAriaLabel(primary: MuscleSlug[], secondary: MuscleSlug[], heat?: MuscleMapProps['heat']): string {
  if (heat && Object.keys(heat).length > 0) return 'Muscle activity map';
  const parts: string[] = [];
  if (primary.length) parts.push(`primary: ${primary.map((m) => MUSCLE_NAMES[m]).join(', ')}`);
  if (secondary.length) parts.push(`secondary: ${secondary.map((m) => MUSCLE_NAMES[m]).join(', ')}`);
  return parts.length ? `Muscles worked — ${parts.join('; ')}` : 'Muscle map';
}

interface ViewFigureProps {
  view: MuscleView;
  primary: Set<MuscleSlug>;
  secondary: Set<MuscleSlug>;
  heat: MuscleMapProps['heat'];
  interactive: boolean;
  labels: boolean;
  thumb: boolean;
  height: number;
  hovered: MuscleSlug | null;
  setHovered: React.Dispatch<React.SetStateAction<MuscleSlug | null>>;
  onMuscleClick?: (slug: MuscleSlug) => void;
}

function ViewFigure({
  view,
  primary,
  secondary,
  heat,
  interactive,
  labels,
  thumb,
  height,
  hovered,
  setHovered,
  onMuscleClick,
}: ViewFigureProps) {
  const slugsInView = ALL_MUSCLE_SLUGS.filter((slug) =>
    (MUSCLE_PATHS[slug] ?? []).some((p) => p.view === view),
  );
  // Draw unhighlighted first, highlighted on top so gold never gets overdrawn.
  const styled = slugsInView.map((slug) => ({ slug, style: styleFor(slug, primary, secondary, heat) }));
  const ordered = [
    ...styled.filter((s) => !s.style.highlighted),
    ...styled.filter((s) => s.style.highlighted),
  ];

  const vb = labels ? '-66 0 332 440' : '0 0 200 440';
  const width = height * (labels ? 332 / 440 : RATIO);

  const renderMuscle = (slug: MuscleSlug, style: MuscleStyle) => {
    const paths = (MUSCLE_PATHS[slug] ?? []).filter((p) => p.view === view);
    const isHover = interactive && hovered === slug;
    const stroke = isHover
      ? 'var(--accent)'
      : thumb && !style.highlighted
        ? 'none'
        : 'var(--muscle-line)';
    const strokeWidth = isHover ? 1.6 : 1;
    const shapes = paths.flatMap((p, i) => {
      const el = (
        <path
          key={`${i}-a`}
          d={p.d}
          fill={style.fill}
          fillOpacity={style.opacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      );
      if (p.side === 'center') return [el];
      return [
        el,
        <path
          key={`${i}-b`}
          d={p.d}
          transform={MIRROR}
          fill={style.fill}
          fillOpacity={style.opacity}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />,
      ];
    });

    if (!interactive) return <g key={slug}>{shapes}</g>;
    return (
      <a
        key={slug}
        role="button"
        tabIndex={0}
        aria-label={MUSCLE_NAMES[slug]}
        className="cursor-pointer outline-none"
        onClick={() => onMuscleClick?.(slug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onMuscleClick?.(slug);
          }
        }}
        onMouseEnter={() => setHovered(slug)}
        onMouseLeave={() => setHovered((cur) => (cur === slug ? null : cur))}
        onFocus={() => setHovered(slug)}
        onBlur={() => setHovered((cur) => (cur === slug ? null : cur))}
      >
        {shapes}
      </a>
    );
  };

  return (
    <svg
      viewBox={vb}
      width={width}
      height={height}
      role="presentation"
      className="block overflow-visible"
    >
      {/* silhouette outline */}
      <path
        d={BODY_OUTLINE[view]}
        fill="none"
        stroke="var(--body-outline)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {ordered.map(({ slug, style }) => renderMuscle(slug, style))}
      {/* abs "wall" crosslines (front only) */}
      {view === 'front' && !thumb && (
        <path d={ABS_CROSSLINES} fill="none" stroke="var(--muscle-line)" strokeWidth={1.1} strokeLinecap="round" />
      )}
      {/* leader-line labels */}
      {labels && !thumb && <Labels view={view} primary={primary} secondary={secondary} />}
    </svg>
  );
}

/** Distributed leader-line labels for highlighted muscles, on the nearer margin. */
function Labels({
  view,
  primary,
  secondary,
}: {
  view: MuscleView;
  primary: Set<MuscleSlug>;
  secondary: Set<MuscleSlug>;
}) {
  const highlighted = ALL_MUSCLE_SLUGS.filter((s) => primary.has(s) || secondary.has(s));
  const anchored = highlighted
    .map((slug) => {
      const a = MUSCLE_LABEL_ANCHORS[slug]?.[view];
      return a ? { slug, x: a[0], y: a[1] } : null;
    })
    .filter((v): v is { slug: MuscleSlug; x: number; y: number } => v !== null);

  const left = anchored.filter((a) => a.x < 100).sort((p, q) => p.y - q.y);
  const right = anchored.filter((a) => a.x >= 100).sort((p, q) => p.y - q.y);

  const place = (items: typeof anchored, side: 'left' | 'right') => {
    const gap = 22;
    const labelX = side === 'left' ? -62 : 262;
    const ys: number[] = [];
    let last = -Infinity;
    for (const it of items) {
      const y = Math.max(it.y, last + gap);
      ys.push(y);
      last = y;
    }
    return items.map((it, i) => {
      const ly = ys[i]!;
      const knee = side === 'left' ? it.x - 12 : it.x + 12;
      return (
        <g key={it.slug} aria-hidden>
          <path
            d={`M${it.x} ${it.y} L${knee} ${ly} L${labelX + (side === 'left' ? 6 : -6)} ${ly}`}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth={0.8}
          />
          <circle cx={it.x} cy={it.y} r={1.6} fill="var(--accent)" />
          <text
            x={labelX}
            y={ly}
            dy="0.32em"
            textAnchor={side === 'left' ? 'end' : 'start'}
            fontSize={11}
            fontWeight={600}
            fill="var(--muted-foreground)"
          >
            {MUSCLE_NAMES[it.slug]}
          </text>
        </g>
      );
    });
  };

  return (
    <>
      {place(left, 'left')}
      {place(right, 'right')}
    </>
  );
}

export function MuscleMap({
  primary = [],
  secondary = [],
  view = 'auto',
  heat,
  height = 260,
  interactive = false,
  onMuscleClick,
  labels = false,
  className,
}: MuscleMapProps) {
  const [hovered, setHovered] = React.useState<MuscleSlug | null>(null);
  const primarySet = React.useMemo(() => new Set(primary), [primary]);
  const secondarySet = React.useMemo(() => new Set(secondary), [secondary]);

  const resolved: MuscleView | 'both' =
    view === 'auto' ? autoView(primarySet, heat) : view;
  const ariaLabel = composeAriaLabel(primary, secondary, heat);

  const figure = (v: MuscleView) => (
    <ViewFigure
      key={v}
      view={v}
      primary={primarySet}
      secondary={secondarySet}
      heat={heat}
      interactive={interactive}
      labels={labels}
      thumb={false}
      height={height}
      hovered={hovered}
      setHovered={setHovered}
      onMuscleClick={onMuscleClick}
    />
  );

  return (
    <div role="img" aria-label={ariaLabel} className={cn('flex items-start justify-center gap-4', className)}>
      {resolved === 'both' ? (
        <>
          {figure('front')}
          {figure('back')}
        </>
      ) : (
        figure(resolved)
      )}
    </div>
  );
}
