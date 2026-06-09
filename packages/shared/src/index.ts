/**
 * @simcoin/shared — cross-cutting runtime utilities.
 *
 * Logging, a typed Redis facade, the application error hierarchy, fixed-point
 * money math, env config loading, and the blockchain adapter contract. Every
 * service depends on this package; it depends only on @simcoin/types.
 */
export * from './logger.js';
export * from './redis.js';
export * from './errors.js';
export * from './config.js';
export * from './chain.js';

// `decimal` is namespaced to avoid colliding with the many short helper names
// (add, sub, mul, cmp, gt, …) other modules may legitimately define.
export * as decimal from './decimal.js';
