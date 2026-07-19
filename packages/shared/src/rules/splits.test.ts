import { describe, it, expect } from 'vitest';
import {
  dayPlanForDays,
  buildDayPlan,
  trimSlotsForSession,
  slotCountForSession,
  FULL_BODY_A,
} from './splits.js';

describe('§7.5 split templates', () => {
  it('day counts match days/week', () => {
    expect(dayPlanForDays(1)).toHaveLength(1);
    expect(dayPlanForDays(2)).toHaveLength(2);
    expect(dayPlanForDays(3)).toHaveLength(3);
    expect(dayPlanForDays(4)).toHaveLength(4);
    expect(dayPlanForDays(5)).toHaveLength(5);
    expect(dayPlanForDays(6)).toHaveLength(6);
    expect(dayPlanForDays(7)).toHaveLength(7);
  });

  it('3-day plan is Full Body A/B/C', () => {
    expect(dayPlanForDays(3).map((d) => d.key)).toEqual(['full_body_a', 'full_body_b', 'full_body_c']);
  });

  it('4-day plan is Upper/Lower ×2', () => {
    expect(dayPlanForDays(4).map((d) => d.focus)).toEqual(['Upper', 'Lower', 'Upper', 'Lower']);
  });

  it('5-day plan is U/L/Push/Pull/Legs', () => {
    expect(dayPlanForDays(5).map((d) => d.focus)).toEqual([
      'Upper',
      'Lower',
      'Push',
      'Pull',
      'Legs',
    ]);
  });

  it('7-day plan ends with a rest/cardio day', () => {
    expect(dayPlanForDays(7).at(-1)?.key).toBe('rest_cardio');
  });

  it('Full Body A leads with a squat slot', () => {
    expect(FULL_BODY_A.slots[0]!.pattern).toBe('squat');
  });
});

describe('§7.5 session-length trim', () => {
  it('slot counts by session minutes', () => {
    expect(slotCountForSession(30)).toBe(4);
    expect(slotCountForSession(45)).toBe(5);
    expect(slotCountForSession(60)).toBe(6);
    expect(slotCountForSession(90)).toBe(Number.POSITIVE_INFINITY);
  });

  it('trims Upper (6 slots) to 4 at 30 min', () => {
    const upper = dayPlanForDays(4)[0]!;
    expect(trimSlotsForSession(upper.slots, 30)).toHaveLength(4);
    expect(trimSlotsForSession(upper.slots, 90)).toHaveLength(6);
  });
});

describe('§7.5 buildDayPlan', () => {
  it('names days and pins weekdays in order', () => {
    const plan = buildDayPlan(3, 45, [0, 2, 4]);
    expect(plan.map((d) => d.name)).toEqual([
      'Day A — Full Body',
      'Day B — Full Body',
      'Day C — Full Body',
    ]);
    expect(plan.map((d) => d.weekday)).toEqual([0, 2, 4]);
    // 45 min → 5 slots kept
    expect(plan[0]!.slots).toHaveLength(5);
  });

  it('weekday is null when not enough preferred days provided', () => {
    const plan = buildDayPlan(3, 60, [0]);
    expect(plan[1]!.weekday).toBeNull();
  });
});
