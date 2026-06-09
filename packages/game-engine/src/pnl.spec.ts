import { describe, it, expect } from 'vitest';
import { pnlPct, roundPct, positionPnlPct } from './pnl.js';

describe('pnl — percentage change for ranking & display', () => {
  it('computes percentage change from start to current', () => {
    expect(pnlPct(100, 150)).toBe(50);
    expect(pnlPct(100, 50)).toBe(-50);
    expect(pnlPct(100, 100)).toBe(0);
  });

  it('accepts decimal strings', () => {
    expect(pnlPct('100', '125')).toBe(25);
    expect(pnlPct('200.00', '300')).toBe(50);
  });

  it('returns 0 when there is no basis (start = 0)', () => {
    expect(pnlPct(0, 1000)).toBe(0);
    expect(pnlPct('0', '1000')).toBe(0);
  });

  it('rejects invalid inputs', () => {
    expect(() => pnlPct('abc', '100')).toThrow(TypeError);
    expect(() => pnlPct(100, Infinity)).toThrow(TypeError);
    expect(() => pnlPct('1.2.3', '1')).toThrow(TypeError);
  });

  it('roundPct rounds to the requested precision', () => {
    expect(roundPct(33.33333)).toBe(33.33);
    expect(roundPct(12.3456, 2)).toBe(12.35);
    expect(roundPct(12.344, 2)).toBe(12.34);
    expect(roundPct(50)).toBe(50);
    expect(roundPct(99.999, 0)).toBe(100);
  });

  it('positionPnlPct inverts the sign for shorts', () => {
    expect(positionPnlPct(100, 150)).toBe(50); // default long
    expect(positionPnlPct(100, 150, 'long')).toBe(50);
    expect(positionPnlPct(100, 150, 'short')).toBe(-50);
    expect(positionPnlPct(100, 80, 'short')).toBe(20);
  });
});
