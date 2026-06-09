import { describe, it, expect } from 'vitest';
import { xpForLevel, levelFromXp, levelProgress, XP_BASE } from './xp.js';

describe('xp — quadratic levelling curve', () => {
  it('xpForLevel follows BASE*(L-1)^2', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(XP_BASE); // 100
    expect(xpForLevel(3)).toBe(XP_BASE * 4); // 400
    expect(xpForLevel(4)).toBe(XP_BASE * 9); // 900
  });

  it('xpForLevel rejects non-positive / non-integer levels', () => {
    expect(() => xpForLevel(0)).toThrow(RangeError);
    expect(() => xpForLevel(-1)).toThrow(RangeError);
    expect(() => xpForLevel(2.5)).toThrow(RangeError);
  });

  it('levelFromXp inverts the curve and floors between thresholds', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2); // exactly at level 2 threshold
    expect(levelFromXp(399)).toBe(2);
    expect(levelFromXp(400)).toBe(3);
  });

  it('levelFromXp rejects negative or non-finite xp', () => {
    expect(() => levelFromXp(-1)).toThrow(RangeError);
    expect(() => levelFromXp(Infinity)).toThrow(RangeError);
  });

  it('xpForLevel and levelFromXp are mutually consistent at thresholds', () => {
    for (let L = 1; L <= 10; L++) {
      expect(levelFromXp(xpForLevel(L))).toBe(L);
    }
  });

  it('levelProgress reports an accurate progress bar', () => {
    const atFloor = levelProgress(100); // start of level 2
    expect(atFloor.level).toBe(2);
    expect(atFloor.xpIntoLevel).toBe(0);
    expect(atFloor.xpForNextLevel).toBe(300); // 400 - 100
    expect(atFloor.progress).toBe(0);

    const mid = levelProgress(250); // halfway through level 2 (100..400)
    expect(mid.level).toBe(2);
    expect(mid.xpIntoLevel).toBe(150);
    expect(mid.progress).toBeCloseTo(0.5, 5);
  });

  it('levelProgress handles 0 xp (level 1)', () => {
    const p = levelProgress(0);
    expect(p.level).toBe(1);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.xpForNextLevel).toBe(100);
    expect(p.progress).toBe(0);
  });
});
