import * as React from 'react';
import { cn } from '@/lib/utils';
import { clamp } from '@/lib/utils';

export interface MacroRingProps {
  /** consumed value */
  value: number;
  /** target value */
  target: number;
  label?: string;
  /** center caption, defaults to `value / target` */
  caption?: React.ReactNode;
  size?: number;
  stroke?: number;
  /** ring color CSS value; defaults to the accent token */
  color?: string;
  className?: string;
}

/**
 * SVG progress ring for the calorie/macro dashboard (§2.3 Today). Pure/presentational so it can
 * be reused by WS-5's Today view. Overfill (>100%) is clamped visually but shown in the caption.
 */
export function MacroRing({
  value,
  target,
  label,
  caption,
  size = 120,
  stroke = 10,
  color = 'var(--color-accent)',
  className,
}: MacroRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;
  const dash = circumference * pct;

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${value} of ${target}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-bold"
          style={{ fontSize: size * 0.16 }}
        >
          {caption ?? `${Math.round(value)}`}
        </text>
      </svg>
      {label && <span className="mt-1 text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
