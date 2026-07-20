/**
 * Body silhouette outline path data (§4.1). viewBox `0 0 200 440`, drawn as a stroke
 * (var(--body-outline)) with no fill. Each view is a set of closed subpaths: the
 * head+torso+legs mass plus the two hanging arms. Symmetric about x = 100.
 *
 * `front` and `back` share the same standing silhouette (a back view has the same
 * outer contour); the muscle plating in `paths.ts` is what differentiates the views.
 */

/** head + torso + legs, symmetric about x=100, one closed subpath. */
const TORSO_LEGS =
  'M100 14 ' +
  'C112 14 121 24 121 36 C121 46 116 53 110 57 L108 64 ' +
  'L120 68 L134 82 L126 98 L122 126 L116 152 L124 178 L126 200 ' +
  'L122 250 L118 300 L120 312 L119 340 L112 400 L114 420 L126 424 ' +
  'L104 426 L102 405 L104 345 L103 312 L104 255 L100 212 ' +
  'L96 255 L97 312 L96 345 L98 405 L96 426 L74 424 ' +
  'L86 420 L88 400 L81 340 L82 312 L78 300 L74 250 L76 200 ' +
  'L84 178 L78 152 L74 98 L66 82 L80 68 L92 64 L90 57 ' +
  'C84 53 79 46 79 36 C79 24 88 14 100 14 Z';

/** right arm, hanging at the side with a small gap from the torso. */
const ARM_RIGHT = 'M134 84 L150 92 L153 150 L151 205 L142 217 L134 217 L130 205 L128 150 L126 100 Z';
/** left arm (mirror of ARM_RIGHT across x=100). */
const ARM_LEFT = 'M66 84 L50 92 L47 150 L49 205 L58 217 L66 217 L70 205 L72 150 L74 100 Z';

const SILHOUETTE = `${TORSO_LEGS} ${ARM_RIGHT} ${ARM_LEFT}`;

export const BODY_OUTLINE: { front: string; back: string } = {
  front: SILHOUETTE,
  back: SILHOUETTE,
};

/** Decorative rectus-abdominis crosslines (the "wall"), drawn over the abs fill in the front view. */
export const ABS_CROSSLINES =
  'M100 122 L100 176 M89 138 L111 138 M89 153 L111 153 M90 167 L110 167';
