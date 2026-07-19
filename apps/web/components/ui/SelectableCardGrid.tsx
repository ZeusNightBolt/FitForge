'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardTitle, CardDescription } from './Card';

export interface SelectableOption<V extends string> {
  value: V;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface SelectableCardGridProps<V extends string> {
  options: ReadonlyArray<SelectableOption<V>>;
  value: V | V[] | null;
  onChange: (value: V) => void;
  /** single = radio semantics (goals primary, experience, location); multiple = toggles */
  mode?: 'single' | 'multiple';
  columns?: 1 | 2;
  className?: string;
}

/**
 * Card-grid picker used across onboarding (goals, experience, location, diet, §2.2).
 * `single` behaves like a radio group; `multiple` toggles membership.
 */
export function SelectableCardGrid<V extends string>({
  options,
  value,
  onChange,
  mode = 'single',
  columns = 1,
  className,
}: SelectableCardGridProps<V>) {
  const selectedSet = React.useMemo(
    () => new Set(Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );

  return (
    <div
      role={mode === 'single' ? 'radiogroup' : 'group'}
      className={cn('grid gap-3', columns === 2 ? 'grid-cols-2' : 'grid-cols-1', className)}
    >
      {options.map((opt) => {
        const isSelected = selectedSet.has(opt.value);
        return (
          <Card
            key={opt.value}
            role={mode === 'single' ? 'radio' : 'checkbox'}
            aria-checked={isSelected}
            tabIndex={0}
            interactive
            selected={isSelected}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(opt.value);
              }
            }}
            className="flex items-start gap-3"
          >
            {opt.icon && (
              <span aria-hidden className="mt-0.5 text-2xl leading-none">
                {opt.icon}
              </span>
            )}
            <div className="min-w-0">
              <CardTitle>{opt.title}</CardTitle>
              {opt.description && <CardDescription>{opt.description}</CardDescription>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
