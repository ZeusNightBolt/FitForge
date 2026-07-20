/**
 * Per-muscle path data (§4.1). Author only RIGHT-half (`side:'right'`) or centered
 * (`side:'center'`) shapes; `MuscleMap` auto-mirrors `right` shapes to the left with
 * scale(-1,1) translate(-200,0), guaranteeing symmetry. Multi-region muscles (quads,
 * hamstrings, calves) are several `MusclePath` entries under one slug.
 *
 * viewBox `0 0 200 440`, symmetric about x=100. Placement follows the §4.1 view table.
 */
import type { MuscleSlug, MusclePath, MuscleView } from './types';

export const MUSCLE_PATHS: Record<MuscleSlug, MusclePath[]> = {
  /* ---------------------------------------------------------------- upper torso / shoulders */
  traps: [
    // front: thin collar sliver from neck to shoulder
    { view: 'front', side: 'right', d: 'M100 63 L114 66 L120 73 L112 75 L100 69 Z' },
    // back: kite from neck to mid-back
    { view: 'back', side: 'center', d: 'M100 62 L118 72 L114 108 L100 128 L86 108 L82 72 Z' },
  ],
  pecs: [
    { view: 'front', side: 'right', d: 'M100 80 L100 104 L120 100 C126 96 126 86 120 80 C112 76 104 77 100 80 Z' },
  ],
  'front-delts': [
    { view: 'front', side: 'right', d: 'M119 74 C128 74 134 80 134 92 C127 92 121 87 118 80 Z' },
  ],
  'side-delts': [
    { view: 'front', side: 'right', d: 'M134 80 C139 82 139 92 135 96 L132 92 L133 82 Z' },
    { view: 'back', side: 'right', d: 'M134 80 C139 82 139 92 135 96 L132 92 L133 82 Z' },
  ],
  'rear-delts': [
    { view: 'back', side: 'right', d: 'M118 76 C127 74 134 80 134 92 C127 92 120 86 118 80 Z' },
  ],
  rhomboids: [
    { view: 'back', side: 'right', d: 'M101 98 L115 104 L114 124 L101 126 Z' },
  ],
  lats: [
    { view: 'back', side: 'right', d: 'M101 112 L120 118 C126 130 124 150 116 160 L104 150 L101 130 Z' },
  ],
  'lower-back': [
    { view: 'back', side: 'right', d: 'M100 130 L109 134 L109 168 L100 172 Z' },
  ],

  /* ------------------------------------------------------------------------------ arms */
  biceps: [
    { view: 'front', side: 'right', d: 'M131 102 C140 100 147 104 147 118 L145 146 L135 146 L131 118 Z' },
  ],
  triceps: [
    { view: 'back', side: 'right', d: 'M131 102 L147 106 L146 146 L134 146 L130 116 Z' },
  ],
  forearms: [
    { view: 'front', side: 'right', d: 'M133 150 L148 152 L146 205 L138 210 L132 200 Z' },
    { view: 'back', side: 'right', d: 'M133 150 L148 152 L146 205 L138 210 L132 200 Z' },
  ],

  /* ------------------------------------------------------------------------------ core */
  abs: [
    { view: 'front', side: 'center', d: 'M87 120 L113 120 L112 150 L110 176 L100 182 L90 176 L88 150 Z' },
  ],
  obliques: [
    { view: 'front', side: 'right', d: 'M115 124 L123 130 L124 160 L118 166 L115 150 Z' },
  ],
  'hip-flexors': [
    { view: 'front', side: 'right', d: 'M101 176 L114 180 L110 192 L101 190 Z' },
  ],

  /* ---------------------------------------------------------------------------- glutes */
  'glute-max': [
    { view: 'back', side: 'right', d: 'M100 178 L124 180 C127 192 126 206 118 212 L102 210 L100 196 Z' },
  ],
  'glute-med': [
    { view: 'back', side: 'right', d: 'M116 170 L127 176 L126 186 L118 184 Z' },
  ],

  /* ------------------------------------------------------------------------------ legs */
  quads: [
    // rectus femoris (center of thigh)
    { view: 'front', side: 'right', d: 'M104 210 L116 212 L116 285 L108 295 L103 280 Z' },
    // vastus lateralis (outer)
    { view: 'front', side: 'right', d: 'M116 214 L123 224 L122 280 L117 285 L116 240 Z' },
    // vastus medialis (inner, lower)
    { view: 'front', side: 'right', d: 'M103 262 L112 268 L110 300 L104 298 Z' },
  ],
  adductors: [
    { view: 'front', side: 'right', d: 'M100 214 L104 216 L108 250 L104 278 L100 270 Z' },
  ],
  hamstrings: [
    // outer (biceps femoris)
    { view: 'back', side: 'right', d: 'M114 216 L122 224 L120 292 L114 296 L113 240 Z' },
    // inner (semitendinosus/-membranosus)
    { view: 'back', side: 'right', d: 'M102 218 L113 218 L112 296 L104 296 L101 240 Z' },
  ],
  calves: [
    // gastrocnemius lateral
    { view: 'back', side: 'right', d: 'M112 314 L120 330 L118 372 L112 388 L110 340 Z' },
    // gastrocnemius medial / soleus
    { view: 'back', side: 'right', d: 'M102 320 L111 324 L112 380 L104 390 L101 348 Z' },
  ],
};

/** Representative anchor point per muscle per view for leader-line labels (right-side/center). */
export const MUSCLE_LABEL_ANCHORS: Partial<Record<MuscleSlug, Partial<Record<MuscleView, [number, number]>>>> = {
  pecs: { front: [116, 90] },
  'front-delts': { front: [127, 84] },
  'side-delts': { front: [136, 88], back: [136, 88] },
  biceps: { front: [140, 122] },
  forearms: { front: [141, 182], back: [141, 182] },
  abs: { front: [100, 148] },
  obliques: { front: [120, 146] },
  'hip-flexors': { front: [108, 184] },
  quads: { front: [113, 250] },
  adductors: { front: [103, 250] },
  traps: { front: [112, 70], back: [100, 96] },
  'rear-delts': { back: [127, 84] },
  rhomboids: { back: [108, 112] },
  lats: { back: [116, 136] },
  'lower-back': { back: [106, 150] },
  triceps: { back: [140, 124] },
  'glute-max': { back: [114, 196] },
  'glute-med': { back: [123, 178] },
  hamstrings: { back: [113, 256] },
  calves: { back: [112, 356] },
};
