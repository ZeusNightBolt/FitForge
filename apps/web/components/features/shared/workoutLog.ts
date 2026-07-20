'use client';

/**
 * WS-F lightweight workout-session persistence (§6 P1-7 / P2-15 / P1-11).
 *
 * The training surface needs *logged sets* to power three research features — the weekly volume
 * heatmap (Progress), PR detection + spark (workout summary), and weekly-target streaks (Today).
 * The Local Mode store (`lib/demo/**`) is owned by another workstream, so WS-F keeps its own
 * additive, versioned localStorage slice here. It is fully client-side, SSR-safe (server snapshot
 * is a stable empty array), and offline — no runtime fetches, no new deps.
 *
 * `window.localStorage.clear()` (the e2e reset + Settings "Erase Local Mode data") wipes this key
 * too, so it never outlives the Local Mode data it augments.
 */
import * as React from 'react';
import type { MuscleSlug } from '@/components/illustrations';
import type { Mechanics } from '@/components/features/_mock/data';

export const WORKOUT_LOG_KEY = 'fitforge.workoutlog.v1';

export interface LoggedSet {
  reps: number;
  weight_kg: number;
}
export interface LoggedExercise {
  exercise_id: string;
  exercise_slug: string;
  exercise_name: string;
  mechanics: Mechanics;
  /** seed muscle slugs (already the 20 MuscleSlug values) */
  primary_muscles: string[];
  secondary_muscles: string[];
  sets: LoggedSet[];
}
export interface WorkoutSession {
  id: string;
  dayId: string;
  dayName: string;
  /** ISO timestamp when the session was finished */
  finishedAt: string;
  exercises: LoggedExercise[];
}

interface LogState {
  version: 1;
  sessions: WorkoutSession[];
}

const SERVER_STATE: LogState = { version: 1, sessions: [] };
let cache: LogState | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function load(): LogState {
  if (!isBrowser()) return SERVER_STATE;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(WORKOUT_LOG_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LogState>) : null;
    cache =
      parsed && Array.isArray(parsed.sessions)
        ? { version: 1, sessions: parsed.sessions as WorkoutSession[] }
        : { version: 1, sessions: [] };
  } catch {
    cache = { version: 1, sessions: [] };
  }
  return cache;
}

function persist(next: LogState) {
  cache = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(WORKOUT_LOG_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode — keep in-memory only */
    }
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): LogState {
  return load();
}
function getServerSnapshot(): LogState {
  return SERVER_STATE;
}

/** Append a finished session. Newest first. Caps at 200 sessions to bound storage. */
export function logSession(session: WorkoutSession): void {
  const s = load();
  persist({ version: 1, sessions: [session, ...s.sessions].slice(0, 200) });
}

export function getSessions(): WorkoutSession[] {
  return load().sessions;
}

export function useWorkoutSessions(): WorkoutSession[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).sessions;
}

/* -------------------------------------------------------------------- derived analytics */

export const HEATMAP_SET_CEILING = 12; // sets/muscle that maps to a fully-saturated (heat=1) fill

function daysAgo(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

/**
 * Weekly volume per muscle over the last 7 days (§6 P1-7). Every completed set credits its primary
 * muscles +1 and its secondary muscles +0.5. Returns raw sets-per-muscle (feed to `heat` after
 * dividing by {@link HEATMAP_SET_CEILING}).
 */
export function setsPerMuscleLast7Days(sessions: WorkoutSession[]): Partial<Record<MuscleSlug, number>> {
  const cutoff = daysAgo(7);
  const out: Partial<Record<string, number>> = {};
  for (const sess of sessions) {
    if (new Date(sess.finishedAt).getTime() < cutoff) continue;
    for (const ex of sess.exercises) {
      const n = ex.sets.length;
      if (n === 0) continue;
      for (const m of ex.primary_muscles) out[m] = (out[m] ?? 0) + n;
      for (const m of ex.secondary_muscles) out[m] = (out[m] ?? 0) + n * 0.5;
    }
  }
  return out as Partial<Record<MuscleSlug, number>>;
}

/** MuscleMap `heat` payload (0..1) from the last 7 days of logged sets. */
export function weeklyHeat(sessions: WorkoutSession[]): Partial<Record<MuscleSlug, number>> {
  const raw = setsPerMuscleLast7Days(sessions);
  const heat: Partial<Record<MuscleSlug, number>> = {};
  for (const [slug, sets] of Object.entries(raw)) {
    heat[slug as MuscleSlug] = Math.min(1, (sets ?? 0) / HEATMAP_SET_CEILING);
  }
  return heat;
}

/** Epley estimated 1-rep max for a single set. */
export function e1rm(weight_kg: number, reps: number): number {
  if (weight_kg <= 0 || reps <= 0) return 0;
  return weight_kg * (1 + reps / 30);
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  best_e1rm: number;
  best_weight_kg: number;
  best_reps: number;
}

/** Best Epley e1RM (and the set that produced it) per exercise across all logged sessions. */
export function computePRs(sessions: WorkoutSession[]): PersonalRecord[] {
  const byEx = new Map<string, PersonalRecord>();
  for (const sess of sessions) {
    for (const ex of sess.exercises) {
      for (const st of ex.sets) {
        const est = e1rm(st.weight_kg, st.reps);
        if (est <= 0) continue;
        const cur = byEx.get(ex.exercise_id);
        if (!cur || est > cur.best_e1rm) {
          byEx.set(ex.exercise_id, {
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            best_e1rm: est,
            best_weight_kg: st.weight_kg,
            best_reps: st.reps,
          });
        }
      }
    }
  }
  return [...byEx.values()].sort((a, b) => b.best_e1rm - a.best_e1rm);
}

/**
 * PRs set *by a candidate session* relative to everything logged before it. Used by the summary to
 * fire the gold spark + PR chips. `priorSessions` must exclude the candidate.
 */
export function prsInSession(
  candidate: WorkoutSession,
  priorSessions: WorkoutSession[],
): PersonalRecord[] {
  const prior = computePRs(priorSessions);
  const priorBest = new Map(prior.map((p) => [p.exercise_id, p.best_e1rm]));
  const beaten: PersonalRecord[] = [];
  for (const ex of candidate.exercises) {
    let bestSet: { est: number; w: number; r: number } | null = null;
    for (const st of ex.sets) {
      const est = e1rm(st.weight_kg, st.reps);
      if (est > 0 && (!bestSet || est > bestSet.est)) bestSet = { est, w: st.weight_kg, r: st.reps };
    }
    if (!bestSet) continue;
    const before = priorBest.get(ex.exercise_id) ?? 0;
    if (bestSet.est > before + 1e-6) {
      beaten.push({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        best_e1rm: bestSet.est,
        best_weight_kg: bestSet.w,
        best_reps: bestSet.r,
      });
    }
  }
  return beaten;
}

/* ---------------------------------------------------------------------- weekly streaks */

/** Monday-anchored week key (YYYY-MM-DD of that week's Monday) for a timestamp. */
function weekKey(ts: number): string {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}
function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}
function prevWeekKey(key: string): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export interface StreakInfo {
  /** consecutive weeks (incl. current if already met) hitting the weekly training target */
  streak: number;
  /** distinct training days logged in the current week */
  daysThisWeek: number;
  target: number;
  /** whether the current week has already met the target */
  metThisWeek: boolean;
}

/**
 * Weekly-target streak (§6 P1-11): a robust "trained N-of-target days this week" chain rather than a
 * fragile daily one. One free "forge freeze" per streak forgives a single missed week. The current,
 * in-progress week never *breaks* the streak (it only extends it once the target is met).
 */
export function weeklyStreak(sessions: WorkoutSession[], target: number): StreakInfo {
  const tgt = Math.max(1, target);
  const daysByWeek = new Map<string, Set<string>>();
  for (const sess of sessions) {
    if (sess.exercises.every((e) => e.sets.length === 0)) continue;
    const wk = weekKey(new Date(sess.finishedAt).getTime());
    const set = daysByWeek.get(wk) ?? new Set<string>();
    set.add(dayKey(sess.finishedAt));
    daysByWeek.set(wk, set);
  }
  const met = (wk: string) => (daysByWeek.get(wk)?.size ?? 0) >= tgt;

  const currentWeek = weekKey(Date.now());
  const daysThisWeek = daysByWeek.get(currentWeek)?.size ?? 0;
  const metThisWeek = daysThisWeek >= tgt;

  let streak = 0;
  let freezeUsed = false;
  let wk = currentWeek;
  for (let guard = 0; guard < 104; guard++) {
    if (met(wk)) {
      streak++;
    } else if (wk === currentWeek) {
      // in-progress week: neither counts nor breaks the streak
    } else if (!freezeUsed) {
      freezeUsed = true; // forge freeze forgives one missed week
    } else {
      break;
    }
    wk = prevWeekKey(wk);
  }

  return { streak, daysThisWeek, target: tgt, metThisWeek };
}
