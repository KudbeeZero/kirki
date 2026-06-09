/**
 * @simcoin/game-engine — pure, IO-free game logic.
 *
 * XP/levels, league promotion/relegation, season schedule math, PnL %, and
 * achievement criteria evaluation. No timers, no network, no database — every
 * function is deterministic given its arguments. Depends only on @simcoin/types.
 */
export * from './xp.js';
export * from './league.js';
export * from './season.js';
export * from './pnl.js';
export * from './achievements.js';
