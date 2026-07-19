'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** show a small leading icon/emoji */
  leading?: React.ReactNode;
  /** render a removable "×" affordance (used for selected type-ahead tokens) */
  removable?: boolean;
  onRemove?: () => void;
}

/**
 * A capsule toggle. Selectable equipment / allergen / weekday / suggestion chip (§2.2).
 * Renders as a button with `aria-pressed` so it is accessible as a toggle.
 */
export function Chip({
  selected,
  leading,
  removable,
  onRemove,
  className,
  children,
  type,
  ...rest
}: ChipProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-chip border px-3.5 py-2 text-sm font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'touch-manipulation',
        selected
          ? 'border-accent bg-accent-muted text-accent'
          : 'border-border bg-surface-2 text-foreground hover:border-accent/50',
        className,
      )}
      {...rest}
    >
      {leading && <span aria-hidden>{leading}</span>}
      {children}
      {removable && (
        <span
          role="button"
          aria-label="Remove"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-current/70 hover:text-current"
        >
          ×
        </span>
      )}
    </button>
  );
}
