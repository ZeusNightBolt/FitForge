'use client';

/**
 * DEMO MODE persistence layer.
 *
 * The entire app runs backend-free: all user data (a fake session, the onboarding draft, the
 * generated profile / routine / nutrition targets, and food logs) lives in `localStorage` under a
 * single versioned key. Everything here is SSR-safe — during static prerender there is no
 * `window`, so reads return the in-memory default state and writes are no-ops.
 *
 * There is exactly one demo user; auth is bypassed with a fixed id.
 */
import type {
  Profile,
  NutritionProfile,
  Routine,
  NutritionLog,
  NutritionTargets,
} from '@/components/features/_mock/data';
import type { OnboardingDraft } from '@/components/onboarding/types';
import type { OnboardingStep } from '@fitforge/shared/schemas';

export const DEMO_STORAGE_KEY = 'fitforge.demo.v1';
export const DEMO_USER_ID = 'demo-user';

export interface DemoState {
  version: 1;
  /** fake session — null until "Enter the demo" seeds it */
  userId: string | null;
  /** resume pointer for the onboarding wizard */
  onboardingStep: OnboardingStep;
  /** the working onboarding draft (superset of every step) */
  draft: Partial<OnboardingDraft>;
  /** stamped when onboarding finishes (ISO) */
  completedAt: string | null;
  /** generated on finish */
  profile: Profile | null;
  nutritionProfile: NutritionProfile | null;
  routine: Routine | null;
  targets: NutritionTargets | null;
  /** food logs keyed by YYYY-MM-DD */
  logsByDate: Record<string, NutritionLog[]>;
}

export function defaultState(): DemoState {
  return {
    version: 1,
    userId: null,
    onboardingStep: 'welcome',
    draft: {},
    completedAt: null,
    profile: null,
    nutritionProfile: null,
    routine: null,
    targets: null,
    logsByDate: {},
  };
}

/** A frozen default used as the server snapshot (stable identity for useSyncExternalStore). */
const SERVER_STATE: DemoState = defaultState();

let cache: DemoState | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function load(): DemoState {
  if (!isBrowser()) return SERVER_STATE;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      cache = { ...defaultState(), ...parsed };
    } else {
      cache = defaultState();
    }
  } catch {
    cache = defaultState();
  }
  return cache;
}

function persist(next: DemoState) {
  cache = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode — keep in-memory only */
    }
  }
  for (const l of listeners) l();
}

/* ----------------------------------------------------------------- external-store contract */

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client snapshot (stable ref until a write happens). */
export function getSnapshot(): DemoState {
  return load();
}

/** Server / prerender snapshot (constant identity). */
export function getServerSnapshot(): DemoState {
  return SERVER_STATE;
}

/* ------------------------------------------------------------------------------ mutations */

export function update(mutator: (draft: DemoState) => DemoState): DemoState {
  const next = mutator(load());
  persist(next);
  return next;
}

export function getState(): DemoState {
  return load();
}

/** Seed the fake session (called by "Enter the demo"). Idempotent. */
export function ensureSession(): void {
  update((s) => (s.userId ? s : { ...s, userId: DEMO_USER_ID }));
}

export function hasSession(): boolean {
  return load().userId != null;
}

export function isOnboarded(): boolean {
  return load().completedAt != null;
}

/** Wipe all demo state (used by "Sign out" / "Reset demo"). */
export function resetDemo(): void {
  cache = defaultState();
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  for (const l of listeners) l();
}

/* ------------------------------------------------------------------------ onboarding draft */

export function saveDraft(draft: Partial<OnboardingDraft>, step: OnboardingStep): void {
  update((s) => ({ ...s, draft: { ...s.draft, ...draft }, onboardingStep: step }));
}

export function loadDraft(): Partial<OnboardingDraft> {
  return load().draft;
}

/* ---------------------------------------------------------------------------- food logging */

export function getLogsFor(date: string): NutritionLog[] | undefined {
  return load().logsByDate[date];
}

export function setLogsFor(date: string, logs: NutritionLog[]): void {
  update((s) => ({ ...s, logsByDate: { ...s.logsByDate, [date]: logs } }));
}
