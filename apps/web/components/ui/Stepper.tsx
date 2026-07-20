'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { clamp } from '@/lib/utils';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** unit label rendered after the number, e.g. "days" */
  unit?: string;
  className?: string;
  'aria-label'?: string;
}

/** Numeric −/+ stepper (days per week, meals per day, §2.2 screens 4 & 10). */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 7,
  step = 1,
  unit,
  className,
  ...aria
}: StepperProps) {
  const set = (n: number) => onChange(clamp(n, min, max));
  return (
    <div
      className={cn(
        'inline-flex items-center gap-4 rounded-2xl border border-border bg-surface-2 p-2',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => set(value - step)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-xl font-semibold transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:hover:bg-surface"
      >
        −
      </button>
      <div
        className="min-w-16 text-center tabular-nums"
        role="status"
        aria-live="polite"
        aria-label={aria['aria-label']}
      >
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
      </div>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => set(value + step)}
        className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-xl font-semibold transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:hover:bg-surface"
      >
        +
      </button>
    </div>
  );
}
