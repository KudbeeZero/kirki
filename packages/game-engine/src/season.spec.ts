import { describe, it, expect } from 'vitest';
import {
  seasonLengthMs,
  nextResetDate,
  seasonIndex,
  msUntilReset,
  currentSeasonWindow,
  SEASON_DAYS,
} from './season.js';

const DAY = 24 * 60 * 60 * 1000;
const start = new Date('2026-01-01T00:00:00.000Z');
const at = (days: number) => new Date(start.getTime() + days * DAY);

describe('season — 30-day cadence math', () => {
  it('season length defaults to 30 days', () => {
    expect(SEASON_DAYS).toBe(30);
    expect(seasonLengthMs()).toBe(30 * DAY);
    expect(seasonLengthMs(7)).toBe(7 * DAY);
  });

  it('seasonIndex floors elapsed time into 30-day buckets', () => {
    expect(seasonIndex(start, start)).toBe(0);
    expect(seasonIndex(start, at(29))).toBe(0);
    expect(seasonIndex(start, at(30))).toBe(1);
    expect(seasonIndex(start, at(61))).toBe(2);
  });

  it('seasonIndex clamps times before the start to season 0', () => {
    expect(seasonIndex(start, at(-5))).toBe(0);
  });

  it('nextResetDate returns the start for times at or before it', () => {
    expect(nextResetDate(start, start).getTime()).toBe(start.getTime());
    expect(nextResetDate(start, at(-1)).getTime()).toBe(start.getTime());
  });

  it('nextResetDate lands on the next 30-day boundary', () => {
    expect(nextResetDate(start, at(1)).getTime()).toBe(at(30).getTime());
    expect(nextResetDate(start, at(31)).getTime()).toBe(at(60).getTime());
    // exactly on a boundary returns that instant
    expect(nextResetDate(start, at(30)).getTime()).toBe(at(30).getTime());
  });

  it('msUntilReset is the gap to the next boundary, never negative', () => {
    expect(msUntilReset(start, at(15))).toBe(15 * DAY);
    expect(msUntilReset(start, at(30))).toBe(0);
    // Before the season starts, the next boundary is the start itself.
    expect(msUntilReset(start, at(-1))).toBe(1 * DAY);
  });

  it('currentSeasonWindow gives the [start,end) of the active season', () => {
    const w = currentSeasonWindow(start, at(45));
    expect(w.index).toBe(1);
    expect(w.startsAt.getTime()).toBe(at(30).getTime());
    expect(w.endsAt.getTime()).toBe(at(60).getTime());
  });

  it('respects a custom season length', () => {
    expect(seasonIndex(start, at(14), 7)).toBe(2);
    expect(nextResetDate(start, at(8), 7).getTime()).toBe(at(14).getTime());
  });
});
