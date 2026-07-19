import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** raise emphasis with the accent ring — used for selected states */
  selected?: boolean;
  interactive?: boolean;
}

export function Card({ selected, interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border bg-surface-2 p-4',
        selected ? 'border-accent ring-2 ring-accent' : 'border-border',
        interactive && 'cursor-pointer transition-colors hover:border-accent/60',
        className,
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-foreground', className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-muted-foreground', className)} {...rest} />;
}
