import { describe, it, expect } from 'vitest';
import {
  evaluateCriteria,
  criteriaProgress,
  parseCriteria,
  type Criterion,
} from './achievements.js';

describe('evaluateCriteria', () => {
  it('matches a gte trade_count criterion (from the seed catalogue)', () => {
    const first = parseCriteria('{"type":"trade_count","gte":1}');
    expect(evaluateCriteria(first, { trade_count: 0 })).toBe(false);
    expect(evaluateCriteria(first, { trade_count: 1 })).toBe(true);
    expect(evaluateCriteria(first, { trade_count: 5 })).toBe(true);
  });

  it('matches the Centurion (100 trades) criterion', () => {
    const centurion: Criterion = { type: 'trade_count', gte: 100 };
    expect(evaluateCriteria(centurion, { trade_count: 99 })).toBe(false);
    expect(evaluateCriteria(centurion, { trade_count: 100 })).toBe(true);
  });

  it('matches an lte criterion (top-100 finish, lower rank is better)', () => {
    const top100: Criterion = { type: 'season_rank', lte: 100 };
    expect(evaluateCriteria(top100, { season_rank: 100 })).toBe(true);
    expect(evaluateCriteria(top100, { season_rank: 101 })).toBe(false);
  });

  it('fails closed for missing metrics', () => {
    expect(evaluateCriteria({ type: 'trade_count', gte: 1 }, {})).toBe(false);
  });

  it('fails closed for a leaf with no comparators (misconfigured)', () => {
    expect(evaluateCriteria({ type: 'trade_count' }, { trade_count: 999 })).toBe(false);
  });

  it('supports composite all/any groups', () => {
    const stats = { trade_count: 120, season_return_pct: 50 };
    const all: Criterion = {
      all: [
        { type: 'trade_count', gte: 100 },
        { type: 'season_return_pct', gte: 100 },
      ],
    };
    const any: Criterion = {
      any: [
        { type: 'trade_count', gte: 100 },
        { type: 'season_return_pct', gte: 100 },
      ],
    };
    expect(evaluateCriteria(all, stats)).toBe(false); // return only 50%
    expect(evaluateCriteria(any, stats)).toBe(true); // trade_count satisfies
  });
});

describe('criteriaProgress', () => {
  it('reports a 0..1 fraction toward a gte target', () => {
    expect(criteriaProgress({ type: 'trade_count', gte: 100 }, { trade_count: 63 })).toBeCloseTo(
      0.63,
    );
    expect(criteriaProgress({ type: 'trade_count', gte: 100 }, { trade_count: 200 })).toBe(1);
    expect(criteriaProgress({ type: 'trade_count', gte: 100 }, {})).toBe(0);
  });

  it('reports binary progress for lte criteria', () => {
    expect(criteriaProgress({ type: 'season_rank', lte: 100 }, { season_rank: 50 })).toBe(1);
    expect(criteriaProgress({ type: 'season_rank', lte: 100 }, { season_rank: 200 })).toBe(0);
  });
});
