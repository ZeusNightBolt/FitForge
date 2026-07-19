/**
 * §7.1 — Type-ahead search ranking (pure-TS mirror of the ranking used by `search_exercises`
 * and `search_foods`).
 *
 * NOTE the trigram term uses a JS Dice-coefficient over character trigrams as a stand-in for
 * Postgres `pg_trgm similarity()`. Scores will be close but not bit-identical to the SQL RPC;
 * the SQL RPC remains authoritative for server results. This mirror powers instant client
 * previews only.
 */

export const MIN_QUERY_LENGTH = 2;

/** Normalize a raw query: trim + lowercase. Returns '' if under the min length. */
export function normalizeQuery(raw: string): string {
  const q = raw.trim().toLowerCase();
  return q.length >= MIN_QUERY_LENGTH ? q : '';
}

/** Character-trigram set for a string (padded), used for the pg_trgm-style similarity stand-in. */
function trigrams(input: string): Set<string> {
  const s = `  ${input.toLowerCase().trim()} `;
  const out = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) out.add(s.slice(i, i + 3));
  return out;
}

/** Dice-coefficient trigram similarity in [0,1] (pg_trgm analogue). */
export function trigramSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return (2 * shared) / (ta.size + tb.size);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** name ~* '\m' || q — does q begin a word inside name? */
export function isWordBoundaryMatch(name: string, q: string): boolean {
  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(q)}`, 'i');
  return re.test(name);
}

export interface SearchScoreInput {
  /** normalized (trimmed/lowercased) query */
  q: string;
  name: string;
  aliases?: readonly string[];
  /** exercises: 0–100 popularity → adds popularity*0.2. undefined for foods. */
  popularity?: number;
  /** foods: verified → +5. undefined for exercises. */
  verified?: boolean;
  /** in caller's favorites → +15 */
  isFavorite?: boolean;
  /** foods only: logged by caller in last 14 days → +10 */
  isRecent?: boolean;
  /** excluded by caller → −1000 (effectively filtered out) */
  isExcluded?: boolean;
}

/**
 * §7.1 additive score. Higher is better. Order results by score desc, then name asc.
 */
export function searchScore(input: SearchScoreInput): number {
  const { q } = input;
  const name = input.name.toLowerCase();
  let score = 0;

  if (name === q) score += 100; // exact-name match
  if (name.startsWith(q)) score += 60; // name prefix match

  if (input.aliases) {
    for (const alias of input.aliases) {
      const a = alias.toLowerCase();
      if (a === q || a.startsWith(q)) {
        score += 50; // alias exact/prefix match
        break;
      }
    }
  }

  if (isWordBoundaryMatch(name, q)) score += 40; // word-boundary match

  const sim = trigramSimilarity(name, q);
  if (sim > 0.25) score += 30 * sim; // trigram similarity

  if (typeof input.popularity === 'number') {
    score += input.popularity * 0.2; // exercises
  } else if (input.verified) {
    score += 5; // foods
  }

  if (input.isFavorite) score += 15;
  if (input.isRecent) score += 10; // foods recents boost
  if (input.isExcluded) score -= 1000;

  return score;
}

/**
 * Whether a row lexically matches the query at all (exact / prefix / alias / word-boundary /
 * trigram > 0.25). The additive §7.1 score alone always includes a popularity baseline, so this
 * predicate is what keeps non-matching rows out of type-ahead results (mirrors the SQL WHERE).
 */
export function hasSearchMatch(input: SearchScoreInput): boolean {
  const { q } = input;
  const name = input.name.toLowerCase();
  if (name === q || name.startsWith(q)) return true;
  if (input.aliases?.some((a) => a.toLowerCase() === q || a.toLowerCase().startsWith(q))) return true;
  if (isWordBoundaryMatch(name, q)) return true;
  if (trigramSimilarity(name, q) > 0.25) return true;
  return false;
}

export interface RankableRow extends SearchScoreInput {
  /** any identifier carried through for the caller */
  id: string;
}

export interface RankedRow<T> {
  row: T;
  score: number;
}

/**
 * Score + order + limit rows per §7.1 ("order by score desc, name asc limit p_limit").
 * Rows scoring ≤ 0 (e.g. excluded, no match) are dropped.
 */
export function rankSearchRows<T extends RankableRow>(rows: readonly T[], limit = 10): RankedRow<T>[] {
  return rows
    .filter((row) => !row.isExcluded && hasSearchMatch(row))
    .map((row) => ({ row, score: searchScore(row) }))
    .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
    .slice(0, limit);
}
