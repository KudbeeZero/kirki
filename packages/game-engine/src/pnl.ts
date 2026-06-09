/**
 * Profit-and-loss percentage.
 *
 * PnL % is a *ratio* used for ranking and display, not a money balance, so it is
 * computed and returned as a JS `number` (percent). Money amounts themselves
 * stay as the string `Decimal` type and are added/subtracted with
 * `@simcoin/shared/decimal` — but to keep this package dependency-free (only
 * `@simcoin/types`), the inputs here are parsed via a tiny local helper rather
 * than importing the shared money module.
 *
 * If you need the *amount* of profit (a money value), do that subtraction with
 * the shared decimal helpers; this module is for the percentage only.
 */

/** Parse a decimal string (or number) to a JS number, rejecting garbage. */
function toNumber(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`not a finite number: ${value}`);
    return value;
  }
  const trimmed = value.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    throw new TypeError(`invalid decimal string: "${value}"`);
  }
  return Number(trimmed);
}

/**
 * Percentage change from `start` to `current`, e.g. 100 → 150 yields `50`.
 * Returns `0` when `start` is `0` (no basis to measure against).
 */
export function pnlPct(start: string | number, current: string | number): number {
  const s = toNumber(start);
  const c = toNumber(current);
  if (s === 0) return 0;
  return ((c - s) / s) * 100;
}

/**
 * Round a percentage to `decimals` places (default 2) for stable display and
 * leaderboard scoring.
 */
export function roundPct(pct: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(pct * factor) / factor;
}

/** Convenience: PnL % of a position given average entry and current price. */
export function positionPnlPct(
  avgEntry: string | number,
  marketPrice: string | number,
  side: 'long' | 'short' = 'long',
): number {
  const raw = pnlPct(avgEntry, marketPrice);
  return side === 'short' ? -raw : raw;
}
