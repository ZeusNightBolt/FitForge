/** Tiny classname joiner (no clsx/tailwind-merge dependency for the MVP scaffold). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Human label for a substitution similarity score. Raw scores (seed similarity + context boosts)
 * are meaningless to users — a "157" chip reads like a bug. Thresholds chosen from the observed
 * range (seed 40–92, boosted up to ~160).
 */
export function matchQuality(score: number): string {
  if (score >= 120) return 'Top match';
  if (score >= 80) return 'Great match';
  return 'Good match';
}

/** Clamp a number into [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Prefix a `public/` asset path with the deploy base path so it resolves under GitHub Pages'
 * `/FitForge` subpath (and `''` in local dev/build). Next.js's `basePath` rewrites `<Link>` and
 * bundler asset URLs automatically, but NOT hand-written string URLs (raw `<img src>`, inline
 * SVG `<image href>`, `background-image`, or metadata icon/OG paths) — those must go through here.
 *
 * `withBase('/og.png')` → `'/FitForge/og.png'` when `NEXT_PUBLIC_BASE_PATH=/FitForge`, else `'/og.png'`.
 */
export function withBase(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}
