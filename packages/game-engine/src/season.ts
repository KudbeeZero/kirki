/**
 * Season schedule math.
 *
 * Seasons run on a fixed cadence (30 days by default). Given a season's start
 * and a reference time, these helpers compute the current season index, the
 * next reset boundary, and time remaining — all as pure date arithmetic with no
 * timers or clocks of their own (callers pass `now`).
 */

/** Default season length. */
export const SEASON_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Length of one season in milliseconds. */
export function seasonLengthMs(days = SEASON_DAYS): number {
  return days * MS_PER_DAY;
}

/**
 * The next reset boundary at or after `now`, given the first season's start.
 * Resets recur every `days`. If `now` lands exactly on a boundary, that instant
 * is returned.
 */
export function nextResetDate(seasonStart: Date, now: Date, days = SEASON_DAYS): Date {
  const len = seasonLengthMs(days);
  const elapsed = now.getTime() - seasonStart.getTime();
  if (elapsed <= 0) return new Date(seasonStart.getTime());
  const periods = Math.ceil(elapsed / len);
  return new Date(seasonStart.getTime() + periods * len);
}

/**
 * Zero-based index of the season active at `now` (season 0 is the first).
 * Times before `seasonStart` are treated as season 0.
 */
export function seasonIndex(seasonStart: Date, now: Date, days = SEASON_DAYS): number {
  const elapsed = now.getTime() - seasonStart.getTime();
  if (elapsed < 0) return 0;
  return Math.floor(elapsed / seasonLengthMs(days));
}

/** Milliseconds remaining until the next reset (never negative). */
export function msUntilReset(seasonStart: Date, now: Date, days = SEASON_DAYS): number {
  return Math.max(0, nextResetDate(seasonStart, now, days).getTime() - now.getTime());
}

export interface SeasonWindow {
  index: number;
  startsAt: Date;
  endsAt: Date;
}

/** The [start, end) window of the season active at `now`. */
export function currentSeasonWindow(
  seasonStart: Date,
  now: Date,
  days = SEASON_DAYS,
): SeasonWindow {
  const len = seasonLengthMs(days);
  const index = seasonIndex(seasonStart, now, days);
  const startsAt = new Date(seasonStart.getTime() + index * len);
  return { index, startsAt, endsAt: new Date(startsAt.getTime() + len) };
}
