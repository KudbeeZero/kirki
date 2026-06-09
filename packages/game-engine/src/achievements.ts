/**
 * Achievement criteria evaluation.
 *
 * Achievements store a small JSON `criteria` object in the DB (see
 * `database/seeds/01_reference.sql`), e.g.
 *   {"type":"trade_count","gte":1}
 *   {"type":"season_return_pct","gte":100}
 *   {"type":"season_rank","lte":100}
 * Each criterion names a metric (`type`) and one or more numeric comparators
 * (`gte`, `lte`, `gt`, `lt`, `eq`). The evaluator reads the named metric from a
 * stats object and checks every comparator. Pure, total, no IO.
 *
 * It also supports composite `all`/`any` groups so future achievements can
 * combine conditions without a code change.
 */

/** Comparator keys allowed on a leaf criterion. */
export interface Comparators {
  gte?: number;
  lte?: number;
  gt?: number;
  lt?: number;
  eq?: number;
}

/** A single metric check, e.g. {type:"trade_count", gte:1}. */
export interface LeafCriterion extends Comparators {
  type: string;
}

/** Composite groups (optional, for richer achievements). */
export interface AllCriterion {
  all: Criterion[];
}
export interface AnyCriterion {
  any: Criterion[];
}

export type Criterion = LeafCriterion | AllCriterion | AnyCriterion;

/**
 * The metrics an evaluation runs against. Keys are criterion `type`s; values
 * are the player's current values. Missing metrics count as not-yet-met.
 */
export type PlayerStats = Record<string, number>;

function isAll(c: Criterion): c is AllCriterion {
  return (c as AllCriterion).all !== undefined;
}
function isAny(c: Criterion): c is AnyCriterion {
  return (c as AnyCriterion).any !== undefined;
}

/** Check the numeric comparators on a leaf against `value`. */
function comparatorsMet(c: Comparators, value: number): boolean {
  if (c.gte !== undefined && !(value >= c.gte)) return false;
  if (c.lte !== undefined && !(value <= c.lte)) return false;
  if (c.gt !== undefined && !(value > c.gt)) return false;
  if (c.lt !== undefined && !(value < c.lt)) return false;
  if (c.eq !== undefined && !(value === c.eq)) return false;
  // A leaf with a `type` but no comparators is never satisfied (misconfigured).
  return c.gte !== undefined ||
    c.lte !== undefined ||
    c.gt !== undefined ||
    c.lt !== undefined ||
    c.eq !== undefined;
}

/**
 * Returns true when `stats` satisfies `criterion`. An unknown metric or a leaf
 * with no comparators yields false (fail-closed), never throws.
 */
export function evaluateCriteria(criterion: Criterion, stats: PlayerStats): boolean {
  if (isAll(criterion)) return criterion.all.every((c) => evaluateCriteria(c, stats));
  if (isAny(criterion)) return criterion.any.some((c) => evaluateCriteria(c, stats));

  const value = stats[criterion.type];
  if (value === undefined) return false;
  return comparatorsMet(criterion, value);
}

/**
 * Progress toward a *single-comparator* leaf criterion, as a 0..1 fraction.
 * Useful for progress bars (e.g. "63/100 trades"). For `lte`/`lt` (lower is
 * better) and composite criteria, progress is reported as 1 when met else 0,
 * since a monotonic fraction isn't well defined.
 */
export function criteriaProgress(criterion: Criterion, stats: PlayerStats): number {
  if (isAll(criterion) || isAny(criterion)) {
    return evaluateCriteria(criterion, stats) ? 1 : 0;
  }
  const value = stats[criterion.type] ?? 0;
  const target = criterion.gte ?? criterion.gt;
  if (target !== undefined && target > 0) {
    return Math.max(0, Math.min(1, value / target));
  }
  return evaluateCriteria(criterion, stats) ? 1 : 0;
}

/**
 * Parse a criteria JSON string (as stored in the DB) into a {@link Criterion}.
 * Throws on invalid JSON; the caller decides how to handle a bad row.
 */
export function parseCriteria(json: string): Criterion {
  return JSON.parse(json) as Criterion;
}
