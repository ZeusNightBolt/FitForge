import * as React from 'react';
import type { OnboardingStep } from '@fitforge/shared/schemas';

/**
 * Small onboarding step header art (§4.3): a keyed 64px spot illustration per
 * questionnaire step. Muted slate strokes carry the object; one gold accent
 * element per piece keeps every step on-brand. `welcome`/`auth` have no art
 * (they show the lockup) and fall back to the spark motif.
 */
export interface StepArtProps extends React.SVGProps<SVGSVGElement> {
  step: OnboardingStep;
  size?: number | string;
}

const SLATE = 'var(--muted-foreground)';
const GOLD = 'var(--accent)';

type Art = React.ReactNode;

const ART: Partial<Record<OnboardingStep, Art>> = {
  // target + spark
  goals: (
    <>
      <circle cx="28" cy="34" r="18" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <circle cx="28" cy="34" r="10" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <circle cx="28" cy="34" r="3" fill={GOLD} />
      <path d="M50 6 L52.4 12 L58 14 L52.4 16 L50 22 L47.6 16 L42 14 L47.6 12 Z" fill={GOLD} />
    </>
  ),
  // ascending strength bars + spark (echoes the beginner/intermediate/advanced card icons)
  experience: (
    <>
      <rect x="10" y="40" width="10" height="14" rx="3" fill={SLATE} opacity="0.55" />
      <rect x="27" y="30" width="10" height="24" rx="3" fill={SLATE} />
      <rect x="44" y="18" width="10" height="36" rx="3" fill={GOLD} />
      <path d="M49 4 L50.8 8.2 L55 10 L50.8 11.8 L49 16 L47.2 11.8 L43 10 L47.2 8.2 Z" fill={GOLD} />
    </>
  ),
  // calendar grid with gold days
  schedule: (
    <>
      <rect x="8" y="12" width="48" height="44" rx="5" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <path d="M8 22 h48" stroke={SLATE} strokeWidth="2.5" />
      <path d="M20 8 v8 M44 8 v8" stroke={SLATE} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="15" y="28" width="7" height="7" rx="1.5" fill={GOLD} />
      <rect x="30" y="28" width="7" height="7" rx="1.5" fill={SLATE} opacity="0.5" />
      <rect x="45" y="28" width="7" height="7" rx="1.5" fill={GOLD} />
      <rect x="15" y="42" width="7" height="7" rx="1.5" fill={SLATE} opacity="0.5" />
      <rect x="30" y="42" width="7" height="7" rx="1.5" fill={GOLD} />
      <rect x="45" y="42" width="7" height="7" rx="1.5" fill={SLATE} opacity="0.5" />
    </>
  ),
  // home + building duo
  location: (
    <>
      <path d="M8 30 L20 20 L32 30 v22 h-24 Z" fill="none" stroke={SLATE} strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="16" y="40" width="8" height="12" fill={GOLD} />
      <rect x="38" y="18" width="18" height="34" rx="2" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <path d="M42 24 h3 M50 24 h3 M42 31 h3 M50 31 h3 M42 38 h3 M50 38 h3" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // dumbbell + band cluster
  equipment: (
    <>
      <path d="M10 26 v12 M16 22 v20 M40 22 v20 M46 26 v12 M16 32 h24" stroke={SLATE} strokeWidth="3" strokeLinecap="round" />
      <path d="M30 44 q14 6 22 -2" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="52" cy="42" r="3" fill="none" stroke={GOLD} strokeWidth="2.5" />
    </>
  ),
  // heart with a dumbbell held inside it — "exercises you love"
  exercise_prefs: (
    <>
      <path
        d="M32 52 C14 40 10 26 18 19 C24 14 30 17 32 22 C34 17 40 14 46 19 C54 26 50 40 32 52 Z"
        fill="none"
        stroke={SLATE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M22 27 v10 M27 24 v16 M37 24 v16 M42 27 v10 M27 32 h10" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // shield over knee joint
  exclusions: (
    <>
      <path d="M32 8 L52 15 v14 C52 42 42 50 32 54 C22 50 12 42 12 29 V15 Z" fill="none" stroke={SLATE} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="32" cy="28" r="6" fill={GOLD} />
      <path d="M32 22 v-6 M32 40 v-6" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // ruler + scale
  body_metrics: (
    <>
      <rect x="10" y="14" width="10" height="38" rx="2" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <path d="M10 22 h4 M10 30 h4 M10 38 h4 M10 46 h4" stroke={SLATE} strokeWidth="2" strokeLinecap="round" />
      <circle cx="42" cy="36" r="14" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <path d="M42 36 L48 28" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="42" cy="36" r="2.5" fill={GOLD} />
    </>
  ),
  // plate + fork with a gold leaf garnish
  nutrition_prefs: (
    <>
      <circle cx="28" cy="36" r="18" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <circle cx="28" cy="36" r="10" fill="none" stroke={SLATE} strokeWidth="2" opacity="0.55" />
      <path d="M54 26 v26 M51 26 v7 M57 26 v7 M51 33 a3 3 0 0 0 6 0" stroke={SLATE} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M40 12 C48 10 54 14 54 20 C48 22 41 20 40 12 Z" fill={GOLD} />
      <path d="M41 13 C44 16 48 18 52 19" stroke="var(--accent-press)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // macro ring trio — aligned row, each ring a bit fuller than the last
  targets_review: (
    <>
      <circle cx="14" cy="36" r="9" fill="none" stroke={SLATE} strokeWidth="3" opacity="0.55" />
      <path d="M14 27 a9 9 0 0 1 7.8 4.5" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="35" cy="36" r="9" fill="none" stroke={SLATE} strokeWidth="3" opacity="0.55" />
      <path d="M35 27 a9 9 0 0 1 6.4 15.4" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="53" cy="36" r="9" fill="none" stroke={SLATE} strokeWidth="3" opacity="0.55" />
      <path d="M53 27 a9 9 0 1 1 -8.5 6" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // calendar + gold flame — the forged week
  plan_preview: (
    <>
      <rect x="6" y="14" width="36" height="40" rx="5" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <path d="M6 24 h36" stroke={SLATE} strokeWidth="2.5" />
      <path d="M15 10 v8 M33 10 v8" stroke={SLATE} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 32 h6 M29 32 h6 M13 42 h6 M29 42 h6" stroke={SLATE} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path
        d="M51 56 C43 53 41 45 45 39 C46.5 36.5 49 34.5 50 31 C52 34 51.5 37 53 38.5 C54.5 40 56 38 56 35 C59 39 61 44 59.5 49 C58.3 53.4 55 56 51 56 Z"
        fill={GOLD}
      />
    </>
  ),
  // anvil with big spark burst
  done: (
    <>
      {/* anvil: top face + horn, waist, base */}
      <rect x="14" y="30" width="32" height="8" rx="2" fill={SLATE} />
      <path d="M15 30 C9 30 6 33 4 37 L15 38 Z" fill={SLATE} />
      <path d="M23 38 L41 38 L38 47 L26 47 Z" fill={SLATE} />
      <rect x="20" y="47" width="24" height="6" rx="2" fill={SLATE} />
      <path d="M44 6 L47 15 L56 18 L47 21 L44 30 L41 21 L32 18 L41 15 Z" fill={GOLD} />
      <path d="M44 12 v-8 M56 18 h8 M52 26 l5 5" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
};

// spark fallback for welcome/auth (steps without dedicated art)
const FALLBACK: Art = (
  <path d="M32 8 L36 26 L54 30 L36 34 L32 52 L28 34 L10 30 L28 26 Z" fill={GOLD} />
);

export function StepArt({ step, size = 64, ...props }: StepArtProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {ART[step] ?? FALLBACK}
    </svg>
  );
}

export default StepArt;
