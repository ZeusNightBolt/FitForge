import * as React from 'react';

/**
 * FitForge "Anvil Bar" logo mark (§3.1).
 *
 * A barbell resting across an anvil — training (bar) + forging (anvil) in one
 * silhouette, topped by a 4-point spark. viewBox 0 0 64 64, authored in ~10
 * shapes so it reads down to 16px.
 *
 * - Default: single gold gradient (`--gradient-gold` stops) with the spark in
 *   flat bright gold (`#F6D883`) on top.
 * - `mono`: everything `currentColor` (icon/print contexts, footers).
 */
export interface LogoMarkProps extends Omit<React.SVGProps<SVGSVGElement>, 'fill'> {
  size?: number | string;
  /** Monochrome variant — all shapes inherit `currentColor`. */
  mono?: boolean;
  /** Accessible title; when omitted the mark is decorative (`aria-hidden`). */
  title?: string;
}

export function LogoMark({ size = 32, mono = false, title, ...props }: LogoMarkProps) {
  const rid = React.useId();
  const gradId = `ffgold-${rid}`;
  const fill = mono ? 'currentColor' : `url(#${gradId})`;
  const sparkFill = mono ? 'currentColor' : '#F6D883';
  const labelled = Boolean(title);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
      {...props}
    >
      {!mono && (
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6D883" />
            <stop offset="0.45" stopColor="#E4B84D" />
            <stop offset="1" stopColor="#B8862C" />
          </linearGradient>
        </defs>
      )}

      {/* Anvil top face + left forge horn */}
      <path d="M17 28 C11 28 8 30 6 34 L17 35 Z" fill={fill} />
      <rect x="17" y="28" width="30" height="7" rx="2" fill={fill} />
      {/* Anvil waist */}
      <path d="M25 35 L39 35 L36 44 L28 44 Z" fill={fill} />
      {/* Anvil base */}
      <rect x="23" y="44" width="18" height="6" rx="2" fill={fill} />

      {/* Bar (full width) */}
      <rect x="4" y="17" width="56" height="6" rx="3" fill={fill} />
      {/* Plate pair straddling the bar, with an ink gap-stroke so the plate
          reads as a separate mass even when the mark is printed flat. */}
      <rect x="10" y="10" width="6" height="20" rx="2" fill={fill} stroke="#0A0D14" strokeWidth="1.5" />
      <rect x="48" y="10" width="6" height="20" rx="2" fill={fill} stroke="#0A0D14" strokeWidth="1.5" />

      {/* Spark — the strike, brightest gold on top */}
      <path
        d="M50 3 L51.8 6.2 L55 8 L51.8 9.8 L50 13 L48.2 9.8 L45 8 L48.2 6.2 Z"
        fill={sparkFill}
      />
    </svg>
  );
}

export default LogoMark;
