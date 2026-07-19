import * as React from 'react';
import { cn } from '@/lib/utils';
import { clamp } from '@/lib/utils';

export interface ProgressBarProps {
  /** current step (1-based) */
  current: number;
  /** total steps */
  total: number;
  className?: string;
  label?: string;
}

/** Thin top progress bar shown on every onboarding screen (§2.2). */
export function ProgressBar({ current, total, className, label }: ProgressBarProps) {
  const pct = clamp((current / Math.max(1, total)) * 100, 0, 100);
  return (
    <div className={cn('w-full', className)}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? `Step ${current} of ${total}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
