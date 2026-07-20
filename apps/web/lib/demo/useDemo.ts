'use client';

/**
 * React bindings for the demo store.
 *
 * Built on `useSyncExternalStore` with a distinct server snapshot so static prerender always sees
 * the default (mock) data and the client re-reads `localStorage` after hydration — the sanctioned
 * pattern, so there are no hydration mismatches.
 */
import * as React from 'react';
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setLogsFor,
  logWeight as logWeightStore,
  type DemoState,
  type WeightEntry,
} from './store';
import {
  MOCK_ROUTINE,
  mockNutritionTargets,
  todayISO,
  type Routine,
  type NutritionTargets,
  type NutritionLog,
} from '@/components/features/_mock/data';

export function useDemoState(): DemoState {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Active routine: the generated one once onboarding is done, else the default demo routine. */
export function useActiveRoutine(): Routine {
  const state = useDemoState();
  return state.routine ?? MOCK_ROUTINE;
}

export function useNutritionTargets(): NutritionTargets {
  const state = useDemoState();
  return state.targets ?? mockNutritionTargets();
}

/**
 * Greeting-ready display name. Once onboarding is complete, an un-named athlete falls back to
 * "Athlete" (§5.4); before completion (pre-gate SSR / fresh state) it is empty so chrome can show
 * its own neutral placeholder.
 */
export function useProfileName(): string {
  const state = useDemoState();
  return state.profile?.display_name ?? (state.completedAt ? 'Athlete' : '');
}

/** Whether the user has finished onboarding (drives first-run empty states vs. real data). */
export function useHasOnboarded(): boolean {
  return useDemoState().completedAt != null;
}

/** Body-weight log (empty for a fresh user) + a persister. */
export function useWeights(): {
  weights: WeightEntry[];
  logWeight: (date: string, kg: number) => void;
} {
  const weights = useDemoState().weights;
  return { weights, logWeight: logWeightStore };
}

/**
 * Today's food logs, with a persister that writes through to the store.
 * A fresh demo user starts with an EMPTY day — nothing is auto-logged; the UI guides them to log
 * their first food. Logs only exist once the user (or a "load sample day" action) creates them.
 */
export function useTodayLogs(): {
  logs: NutritionLog[];
  setLogs: (updater: (prev: NutritionLog[]) => NutritionLog[]) => void;
} {
  const state = useDemoState();
  const today = todayISO();
  const logs = state.logsByDate[today] ?? [];

  const setLogs = React.useCallback(
    (updater: (prev: NutritionLog[]) => NutritionLog[]) => {
      const prev = getSnapshot().logsByDate[today] ?? [];
      setLogsFor(today, updater(prev));
    },
    [today],
  );

  return { logs, setLogs };
}
