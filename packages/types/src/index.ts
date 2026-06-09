/**
 * @simcoin/types — canonical domain model.
 *
 * Every app and service imports its shapes from here so the wire format,
 * the database, and the UI never drift. Organised by bounded context.
 */

// ── Primitives ─────────────────────────────────────────────────────────────
export type UUID = string;
export type ISODateTime = string;
/** Decimal values cross the wire as strings to avoid float drift. */
export type Decimal = string;

export * from './auth.js';
export * from './market.js';
export * from './trading.js';
export * from './competition.js';
export * from './achievement.js';
export * from './social.js';
export * from './education.js';
export * from './events.js';
