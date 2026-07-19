import { describe, it, expect } from 'vitest';
import {
  searchScore,
  rankSearchRows,
  normalizeQuery,
  isWordBoundaryMatch,
  trigramSimilarity,
} from './search.js';

describe('§7.1 search ranking', () => {
  it('normalizeQuery trims/lowercases and enforces min length', () => {
    expect(normalizeQuery('  Squat ')).toBe('squat');
    expect(normalizeQuery('a')).toBe('');
    expect(normalizeQuery('')).toBe('');
  });

  it('exact name match outscores prefix-only match', () => {
    const exact = searchScore({ q: 'squat', name: 'Squat', popularity: 50 });
    const prefix = searchScore({ q: 'squa', name: 'Squat', popularity: 50 });
    expect(exact).toBeGreaterThan(prefix);
  });

  it('alias prefix match adds its term', () => {
    const withAlias = searchScore({ q: 'db', name: 'Dumbbell Bench Press', aliases: ['db bench'] });
    const without = searchScore({ q: 'db', name: 'Dumbbell Bench Press' });
    expect(withAlias).toBeGreaterThan(without);
  });

  it('favorite boost and exclusion penalty apply', () => {
    const fav = searchScore({ q: 'bench', name: 'Bench Press', isFavorite: true });
    const plain = searchScore({ q: 'bench', name: 'Bench Press' });
    expect(fav - plain).toBe(15);
    const excluded = searchScore({ q: 'bench', name: 'Bench Press', isExcluded: true });
    expect(excluded).toBeLessThan(0);
  });

  it('food verified adds 5 and recents adds 10', () => {
    const base = searchScore({ q: 'egg', name: 'Egg' });
    const verified = searchScore({ q: 'egg', name: 'Egg', verified: true });
    const recent = searchScore({ q: 'egg', name: 'Egg', verified: true, isRecent: true });
    expect(verified - base).toBe(5);
    expect(recent - verified).toBe(10);
  });

  it('word-boundary match detects mid-name words', () => {
    expect(isWordBoundaryMatch('barbell back squat', 'squat')).toBe(true);
    expect(isWordBoundaryMatch('barbell back squat', 'ack')).toBe(false);
  });

  it('trigram similarity is 1 for identical strings and lower for different', () => {
    expect(trigramSimilarity('squat', 'squat')).toBeCloseTo(1);
    expect(trigramSimilarity('squat', 'deadlift')).toBeLessThan(0.25);
  });

  it('rankSearchRows orders by score desc then name asc and drops non-matches', () => {
    const ranked = rankSearchRows(
      [
        { id: '1', q: 'press', name: 'Overhead Press', popularity: 85 },
        { id: '2', q: 'press', name: 'Bench Press', popularity: 95 },
        { id: '3', q: 'press', name: 'Squat', popularity: 95 }, // no match → dropped
      ],
      10,
    );
    expect(ranked.map((r) => r.row.id)).not.toContain('3');
    expect(ranked[0]!.score).toBeGreaterThanOrEqual(ranked[1]!.score);
  });
});
