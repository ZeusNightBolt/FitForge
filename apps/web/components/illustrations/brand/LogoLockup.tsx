import * as React from 'react';
import { LogoMark } from './LogoMark';

/**
 * FitForge wordmark lockups (§3.1 / §3.2).
 *
 * "FitForge" set in Space Grotesk SemiBold, tracking -0.01em: "Fit" in ivory
 * `--foreground`, "Forge" in the gold text gradient (`.text-gradient-gold`,
 * defined in globals.css). Never letter-spaced wide — it's machined, not
 * fashion.
 *
 * - horizontal (default): mark + wordmark on one line, gap = one plate-width.
 * - stacked: mark centered above the wordmark (onboarding welcome, OG).
 * - `mono`: the mark uses `currentColor` and the whole wordmark inherits the
 *   surrounding text color (both words), for single-color contexts.
 */
export interface LogoLockupProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'title'> {
  /** Mark height in px (the wordmark scales from it). */
  size?: number;
  stacked?: boolean;
  mono?: boolean;
  title?: string;
}

const FONT_STACK =
  'var(--font-space-grotesk), var(--font-inter), ui-sans-serif, system-ui, -apple-system, sans-serif';

export function LogoLockup({
  size = 24,
  stacked = false,
  mono = false,
  title = 'FitForge',
  style,
  ...props
}: LogoLockupProps) {
  // Mark reads a touch larger than cap-height so it balances the wordmark.
  const markSize = stacked ? size * 1.9 : size * 1.35;
  const fontSize = size;
  const gap = stacked ? size * 0.42 : markSize * (6 / 64) + size * 0.18;

  const wordmark = (
    <span
      style={{
        fontFamily: FONT_STACK,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        fontSize,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: mono ? 'inherit' : 'var(--foreground)' }}>Fit</span>
      {mono ? (
        <span>Forge</span>
      ) : (
        <span className="text-gradient-gold">Forge</span>
      )}
    </span>
  );

  return (
    <span
      role="img"
      aria-label={title}
      style={{
        display: 'inline-flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        ...style,
      }}
      {...props}
    >
      <LogoMark size={markSize} mono={mono} aria-hidden />
      {wordmark}
    </span>
  );
}

export default LogoLockup;
