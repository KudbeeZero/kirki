/**
 * XP curve and levelling.
 *
 * Levels use a quadratic curve: the cumulative XP required to *reach* level L is
 *   xpForLevel(L) = BASE * (L - 1)^2
 * so each level costs progressively more than the last (classic RPG pacing).
 * Level 1 starts at 0 XP. All functions are pure and deterministic.
 */

/** XP scaling constant; tune to stretch/compress the whole curve. */
export const XP_BASE = 100;

/** Cumulative XP required to be *at* the start of `level` (level >= 1). */
export function xpForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`level must be an integer >= 1, got ${level}`);
  }
  return XP_BASE * (level - 1) ** 2;
}

/** The level a user with `xp` total experience has reached (>= 1). */
export function levelFromXp(xp: number): number {
  if (xp < 0 || !Number.isFinite(xp)) {
    throw new RangeError(`xp must be a finite, non-negative number, got ${xp}`);
  }
  // Invert xp = BASE * (L-1)^2  →  L = 1 + sqrt(xp / BASE).
  return 1 + Math.floor(Math.sqrt(xp / XP_BASE));
}

export interface LevelProgress {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** Total XP the current level spans (to the next level). */
  xpForNextLevel: number;
  /** Fraction of the way to the next level, 0..1. */
  progress: number;
}

/** Full progress breakdown for a UI progress bar. */
export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  const into = xp - floor;
  return {
    level,
    xpIntoLevel: into,
    xpForNextLevel: span,
    progress: span === 0 ? 0 : into / span,
  };
}
