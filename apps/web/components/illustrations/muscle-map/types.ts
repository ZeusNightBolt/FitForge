/**
 * Muscle-map type contract (§4.1). The 20 seed muscle slugs (from seed/data/muscles.json),
 * the view union, the per-muscle path model, and the FROZEN `MuscleMap` props contract that
 * WS-C ships and WS-F consumes. Do not change these signatures without updating both.
 */

/** The 20 seed muscle slugs (verbatim from seed/data/muscles.json). */
export type MuscleSlug =
  | 'pecs'
  | 'lats'
  | 'traps'
  | 'rhomboids'
  | 'lower-back'
  | 'front-delts'
  | 'side-delts'
  | 'rear-delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'glute-max'
  | 'glute-med'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves'
  | 'hip-flexors';

export type MuscleView = 'front' | 'back';

export interface MusclePath {
  view: MuscleView;
  /** path data for the RIGHT-side (or center) shape only; `right` is auto-mirrored to the left */
  d: string;
  side: 'right' | 'center';
}

/** FROZEN component contract (§4.1). */
export interface MuscleMapProps {
  /** fill var(--accent), fill-opacity .95 */
  primary?: MuscleSlug[];
  /** fill var(--accent), fill-opacity .38 */
  secondary?: MuscleSlug[];
  /** 'auto' (default): the view containing the most primary paths; ties → front. 'both': side by side. */
  view?: MuscleView | 'both' | 'auto';
  /** 0..1 → gold fill-opacity .15+.75x (heatmap mode; overrides primary/secondary when present) */
  heat?: Partial<Record<MuscleSlug, number>>;
  /** px, default 260; width follows the 200:440 ratio */
  height?: number;
  /** muscles become focusable <a role="button" tabIndex=0>; hover/focus strokes gold */
  interactive?: boolean;
  onMuscleClick?: (slug: MuscleSlug) => void;
  /** tiny leader-line labels for highlighted muscles */
  labels?: boolean;
  className?: string;
}

/** Human-readable muscle names (seed names) for a11y labels + leader lines. */
export const MUSCLE_NAMES: Record<MuscleSlug, string> = {
  pecs: 'Chest',
  lats: 'Lats',
  traps: 'Traps',
  rhomboids: 'Mid-back',
  'lower-back': 'Lower Back',
  'front-delts': 'Front Delts',
  'side-delts': 'Side Delts',
  'rear-delts': 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  'glute-max': 'Glutes',
  'glute-med': 'Hip Abductors',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  adductors: 'Inner Thigh',
  calves: 'Calves',
  'hip-flexors': 'Hip Flexors',
};

/** All 20 slugs in a stable render order (torso → arms → core → legs). */
export const ALL_MUSCLE_SLUGS: MuscleSlug[] = [
  'traps',
  'pecs',
  'lats',
  'rhomboids',
  'lower-back',
  'front-delts',
  'side-delts',
  'rear-delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'hip-flexors',
  'glute-max',
  'glute-med',
  'quads',
  'adductors',
  'hamstrings',
  'calves',
];
