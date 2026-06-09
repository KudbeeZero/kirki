import { describe, it, expect } from 'vitest';
import {
  evaluatePromotion,
  applyAction,
  nextTier,
  previousTier,
  rankToPercentile,
} from './league.js';

describe('evaluatePromotion', () => {
  it('promotes a gold player in the top 20%', () => {
    // gold promoteTopPct = 0.20
    expect(evaluatePromotion('gold', 0.1)).toBe('promote');
    expect(evaluatePromotion('gold', 0.19)).toBe('promote');
  });

  it('relegates a gold player in the bottom 20%', () => {
    // gold relegateBottomPct = 0.20 → percentile >= 0.80 relegates
    expect(evaluatePromotion('gold', 0.85)).toBe('relegate');
    expect(evaluatePromotion('gold', 0.8)).toBe('relegate');
  });

  it('keeps a mid-table gold player', () => {
    expect(evaluatePromotion('gold', 0.5)).toBe('stay');
  });

  it('never promotes from the top tier (master)', () => {
    expect(evaluatePromotion('master', 0.0)).toBe('stay');
  });

  it('never relegates from the bottom tier (bronze)', () => {
    // bronze relegateBottomPct = 0, and there is no tier below anyway
    expect(evaluatePromotion('bronze', 0.99)).toBe('stay');
  });

  it('rejects out-of-range percentiles', () => {
    expect(() => evaluatePromotion('gold', -0.1)).toThrow();
    expect(() => evaluatePromotion('gold', 1.5)).toThrow();
  });
});

describe('applyAction', () => {
  it('moves up and down between tiers', () => {
    expect(applyAction('silver', 'promote')).toBe('gold');
    expect(applyAction('silver', 'relegate')).toBe('bronze');
    expect(applyAction('silver', 'stay')).toBe('silver');
  });

  it('clamps at the ends', () => {
    expect(applyAction('master', 'promote')).toBe('master');
    expect(applyAction('bronze', 'relegate')).toBe('bronze');
  });
});

describe('tier navigation', () => {
  it('walks next/previous correctly', () => {
    expect(nextTier('bronze')).toBe('silver');
    expect(nextTier('master')).toBeNull();
    expect(previousTier('master')).toBe('diamond');
    expect(previousTier('bronze')).toBeNull();
  });
});

describe('rankToPercentile', () => {
  it('maps best rank to 0 and worst to 1', () => {
    expect(rankToPercentile(1, 100)).toBe(0);
    expect(rankToPercentile(100, 100)).toBe(1);
    expect(rankToPercentile(1, 1)).toBe(0);
  });

  it('drives a promotion when combined with evaluatePromotion', () => {
    // rank 5 of 100 in gold → percentile ~0.04 → top 20% → promote
    const pct = rankToPercentile(5, 100);
    expect(evaluatePromotion('gold', pct)).toBe('promote');
  });
});
