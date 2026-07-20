import * as React from 'react';
import { cn } from '@/lib/utils';
import type { IllustrationProps } from './types';
import { resolveEquipmentGlyph } from './registry';

/**
 * 48×48 equipment "object portrait" (§4.2). Muted round-capped strokes
 * (`currentColor`, inheriting `text-muted-foreground`) with exactly one gold
 * accent element per item. When `selected`, the whole glyph turns gold
 * (`text-accent`) — pair it with the tile's `.border-gradient-gold` treatment.
 *
 * Decorative by default (`aria-hidden`): the picker tile supplies the visible
 * name, which is the accessible label.
 */
export function EquipmentIllustration({
  slug,
  size = 48,
  selected = false,
  className,
}: IllustrationProps) {
  const Glyph = resolveEquipmentGlyph(slug);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn(
        'shrink-0 transition-colors duration-150',
        selected ? 'text-accent' : 'text-muted-foreground',
        className,
      )}
    >
      <Glyph />
    </svg>
  );
}
