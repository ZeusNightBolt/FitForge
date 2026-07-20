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
  type DemoState,
} from './store';
import {
  MOCK_ROUTINE,
  MOCK_TODAY_LOGS,
  MOCK_PROFILE,
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

export function useProfileName(): string {
  const state = useDemoState();
  return state.profile?.display_name ?? MOCK_PROFILE.display_name;
}

/** Today's food logs, with a persister that writes through to the store. */
export function useTodayLogs(): {
  logs: NutritionLog[];
  setLogs: (updater: (prev: NutritionLog[]) => NutritionLog[]) => void;
} {
  const state = useDemoState();
  const today = todayISO();
  const logs = state.logsByDate[today] ?? MOCK_TODAY_LOGS;

  const setLogs = React.useCallback(
    (updater: (prev: NutritionLog[]) => NutritionLog[]) => {
      const prev = getSnapshot().logsByDate[today] ?? MOCK_TODAY_LOGS;
      setLogsFor(today, updater(prev));
    },
    [today],
  );

  return { logs, setLogs };
}
