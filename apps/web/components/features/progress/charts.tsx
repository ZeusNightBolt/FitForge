/**
 * Inline-SVG charts (no chart library — §2.3 "charts via a light lib or inline SVG").
 * Pure/presentational, theme-aware via the design tokens (accent/muted/foreground CSS vars).
 */
import * as React from 'react';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
}

/** Compact trend line for the Today weight card (§2.3). */
export function Sparkline({
  data,
  width = 160,
  height = 44,
  className,
  strokeWidth = 2,
}: SparklineProps) {
  if (data.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = strokeWidth;
  const stepX = (width - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1]!;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Trend"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={strokeWidth + 1} fill="var(--color-accent)" />
    </svg>
  );
}

export interface LinePoint {
  label: string;
  value: number;
}
export interface LineChartProps {
  data: LinePoint[];
  height?: number;
  className?: string;
  unit?: string;
  color?: string;
}

/** Full-width responsive line chart (weight / measurement history). */
export function LineChart({
  data,
  height = 200,
  className,
  unit = '',
  color = 'var(--color-accent)',
}: LineChartProps) {
  const width = 320;
  const padL = 34;
  const padR = 8;
  const padT = 10;
  const padB = 22;
  if (data.length < 2) {
    return <div className={cn('text-sm text-muted-foreground', className)}>Not enough data yet.</div>;
  }
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const stepX = plotW / (data.length - 1);
  const pts = data.map((d, i) => {
    const x = padL + i * stepX;
    const y = padT + (1 - (d.value - min) / span) * plotH;
    return [x, y] as const;
  });
  const linePath = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1]![0].toFixed(1)} ${padT + plotH} L${pts[0]![0].toFixed(1)} ${padT + plotH} Z`;
  const gridVals = [max, (max + min) / 2, min];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full', className)}
      role="img"
      aria-label="History chart"
      preserveAspectRatio="none"
    >
      {gridVals.map((gv, i) => {
        const y = padT + (1 - (gv - min) / span) * plotH;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="var(--color-border)" strokeWidth={1} />
            <text x={2} y={y + 3} fontSize={9} fill="var(--color-muted-foreground)">
              {Math.round(gv)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill={color} opacity={0.12} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.4} fill={color} />
      ))}
      {data.map((d, i) =>
        i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
          <text
            key={i}
            x={padL + i * stepX}
            y={height - 6}
            fontSize={8}
            textAnchor="middle"
            fill="var(--color-muted-foreground)"
          >
            {d.label}
          </text>
        ) : null,
      )}
      {unit && (
        <text x={width - padR} y={padT + 6} fontSize={9} textAnchor="end" fill="var(--color-muted-foreground)">
          {unit}
        </text>
      )}
    </svg>
  );
}

export interface BarPoint {
  label: string;
  value: number;
  color?: string;
}
export interface MiniBarsProps {
  data: BarPoint[];
  height?: number;
  className?: string;
}

/** Small labelled bar row (macro split, per-muscle volume). */
export function MiniBars({ data, height = 120, className }: MiniBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('flex items-end gap-3', className)} style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(d.value / max) * 100}%`,
                backgroundColor: d.color ?? 'var(--color-accent)',
                minHeight: 4,
              }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
