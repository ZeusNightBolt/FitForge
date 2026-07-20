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
  // 3 ascending anvils
  experience: (
    <>
      <path d="M8 50 h10 v-3 h-3 v-4 h9 v7 h-16 Z" fill={SLATE} />
      <path d="M24 44 h11 v-3 h-3 v-5 h10 v8 h-18 Z" fill={SLATE} />
      <path d="M42 36 h12 v-3 h-3 v-6 h11 v9 h-20 Z" fill={GOLD} />
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
  // heart + dumbbell
  exercise_prefs: (
    <>
      <path
        d="M24 46 C10 36 10 22 20 22 C25 22 24 27 24 27 C24 27 23 22 28 22 C38 22 38 36 24 46 Z"
        fill={GOLD}
      />
      <path d="M36 40 v10 M42 37 v16 M50 40 v10 M42 45 h.01 M36 45 h6 M48 45 h4" stroke={SLATE} strokeWidth="2.5" strokeLinecap="round" />
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
  // plate + leaf
  nutrition_prefs: (
    <>
      <circle cx="30" cy="34" r="20" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <circle cx="30" cy="34" r="12" fill="none" stroke={SLATE} strokeWidth="2" opacity="0.6" />
      <path d="M44 20 C52 20 54 30 46 34 C40 37 40 28 44 20 Z" fill={GOLD} />
      <path d="M44 22 C44 26 45 30 47 33" stroke="var(--accent-press)" strokeWidth="1.5" fill="none" />
    </>
  ),
  // macro ring trio
  targets_review: (
    <>
      <circle cx="18" cy="34" r="10" fill="none" stroke={SLATE} strokeWidth="3" />
      <path d="M18 24 a10 10 0 0 1 8 15" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="26" r="9" fill="none" stroke={SLATE} strokeWidth="3" />
      <path d="M40 17 a9 9 0 0 1 6 4" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="44" r="9" fill="none" stroke={SLATE} strokeWidth="3" />
      <path d="M44 35 a9 9 0 0 1 8 13" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // flame + calendar
  plan_preview: (
    <>
      <rect x="8" y="14" width="34" height="40" rx="4" fill="none" stroke={SLATE} strokeWidth="2.5" />
      <path d="M8 24 h34" stroke={SLATE} strokeWidth="2.5" />
      <path d="M15 32 h6 M27 32 h6 M15 42 h6 M27 42 h6" stroke={SLATE} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path
        d="M48 52 C40 48 42 40 46 36 C46 40 49 40 49 37 C50 30 58 32 56 42 C55 49 52 52 48 52 Z"
        fill={GOLD}
      />
    </>
  ),
  // anvil with big spark burst
  done: (
    <>
      <path d="M14 48 h24 v-4 h-5 v-8 h14 v12 h4 v6 H14 Z" fill={SLATE} />
      <path d="M20 36 C12 36 9 39 6 44 L20 45 Z" fill={SLATE} />
      <path d="M44 6 L47 15 L56 18 L47 21 L44 30 L41 21 L32 18 L41 15 Z" fill={GOLD} />
      <path d="M44 12 v-8 M56 18 h8 M50 26 l5 5" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
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
