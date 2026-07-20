/**
 * Illustration system barrel (§4.0) — the frozen public surface for the
 * self-authored SVG asset system. Each subfolder ships its own `index` that
 * this barrel re-exports, so the fleet's workstreams drop files into their
 * owned subfolder without touching this file:
 *
 *   brand/       (WS-B) LogoMark, LogoLockup
 *   scenes/      (WS-B) LandingHero, StepArt, EmptyState
 *   muscle-map/  (WS-C) MuscleMap, MuscleMapThumb  (placeholder until WS-C lands)
 *   equipment/   (WS-D) EquipmentIllustration       (placeholder until WS-D lands)
 */
export * from './brand';
export * from './scenes';
export * from './muscle-map';
export * from './equipment';
