/**
 * League tiers, and promotion/relegation at season end.
 *
 * Five tiers (bronze → master). A player's end-of-season *percentile* within
 * their tier decides whether they move up, stay, or move down:
 *  - finish in the top `promoteTopPct` of the tier → promote (up one tier),
 *  - finish in the bottom `relegateBottomPct` → relegate (down one tier),
 *  - otherwise stay.
 * The top tier cannot promote; the bottom tier cannot relegate. Pure logic.
 */
import type { LeagueTierName } from '@simcoin/types';

export type LeagueAction = 'promote' | 'stay' | 'relegate';

export interface TierThreshold {
  name: LeagueTierName;
  /** 0 (bronze) … 4 (master). */
  rank: number;
  /** Top fraction of the tier promoted at season end (0..1). */
  promoteTopPct: number;
  /** Bottom fraction relegated at season end (0..1). */
  relegateBottomPct: number;
}

/** Ordered low → high. Higher tiers promote fewer and relegate more. */
export const TIERS: readonly TierThreshold[] = [
  { name: 'bronze', rank: 0, promoteTopPct: 0.3, relegateBottomPct: 0.0 },
  { name: 'silver', rank: 1, promoteTopPct: 0.25, relegateBottomPct: 0.15 },
  { name: 'gold', rank: 2, promoteTopPct: 0.2, relegateBottomPct: 0.2 },
  { name: 'diamond', rank: 3, promoteTopPct: 0.15, relegateBottomPct: 0.25 },
  { name: 'master', rank: 4, promoteTopPct: 0.0, relegateBottomPct: 0.3 },
] as const;

const TIER_BY_NAME = new Map<LeagueTierName, TierThreshold>(
  TIERS.map((t) => [t.name, t]),
);

/** Look up a tier's thresholds by name. */
export function tier(name: LeagueTierName): TierThreshold {
  const t = TIER_BY_NAME.get(name);
  if (!t) throw new RangeError(`Unknown league tier: ${name}`);
  return t;
}

/** The tier one step above, or null if already at the top. */
export function nextTier(name: LeagueTierName): LeagueTierName | null {
  return TIERS[tier(name).rank + 1]?.name ?? null;
}

/** The tier one step below, or null if already at the bottom. */
export function previousTier(name: LeagueTierName): LeagueTierName | null {
  const rank = tier(name).rank;
  return rank === 0 ? null : (TIERS[rank - 1]?.name ?? null);
}

/**
 * Decide a player's end-of-season action.
 *
 * @param current   the player's current tier
 * @param percentile rank percentile within the tier, 0 = best, 1 = worst.
 *                   (Rank 1 of 100 → percentile 0.0; rank 100 of 100 → ~0.99.)
 */
export function evaluatePromotion(
  current: LeagueTierName,
  percentile: number,
): LeagueAction {
  if (percentile < 0 || percentile > 1 || Number.isNaN(percentile)) {
    throw new RangeError(`percentile must be within [0, 1], got ${percentile}`);
  }
  const t = tier(current);

  // Promotion: top of the tier (small percentile), if not already top tier.
  if (nextTier(current) && percentile < t.promoteTopPct) return 'promote';

  // Relegation: bottom of the tier (large percentile), if not already bottom.
  if (previousTier(current) && percentile >= 1 - t.relegateBottomPct) {
    return 'relegate';
  }

  return 'stay';
}

/** The resulting tier after applying an action (clamped to the ends). */
export function applyAction(
  current: LeagueTierName,
  action: LeagueAction,
): LeagueTierName {
  if (action === 'promote') return nextTier(current) ?? current;
  if (action === 'relegate') return previousTier(current) ?? current;
  return current;
}

/**
 * Convert a 1-based rank within a population to a 0..1 percentile where 0 is
 * best. A field of 1 player yields 0.
 */
export function rankToPercentile(rank: number, total: number): number {
  if (rank < 1 || total < 1 || rank > total) {
    throw new RangeError(`invalid rank ${rank} of ${total}`);
  }
  return total === 1 ? 0 : (rank - 1) / (total - 1);
}
