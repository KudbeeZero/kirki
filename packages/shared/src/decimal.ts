/**
 * Fixed-point decimal arithmetic for money.
 *
 * Money MUST NEVER touch JS `number` — `0.1 + 0.2 !== 0.3` and large balances
 * lose precision past 2^53. The domain model carries money as the string
 * `Decimal` type (see @simcoin/types). This module operates on those strings by
 * scaling them to integer `bigint` "minor units" at a fixed number of decimal
 * places, doing exact integer math, then formatting back to a string.
 *
 * Approach:
 *  - Internally every value is a `bigint` of minor units at {@link SCALE}
 *    decimal places (default 8 — enough for BTC/ETH-style 8-dp assets).
 *  - All inputs are validated; non-numeric strings throw.
 *  - Output is always a canonical string with no trailing-zero noise beyond
 *    what the caller requests via {@link format}.
 */
import type { Decimal } from '@simcoin/types';

/** Internal precision. 8 dp covers every market in the Phase 1 universe. */
export const SCALE = 8;

const SCALE_FACTOR = 10n ** BigInt(SCALE);
const DECIMAL_RE = /^[+-]?\d+(\.\d+)?$/;

/** Parse a decimal string into scaled minor units (bigint). */
export function toMinor(value: Decimal | number, scale = SCALE): bigint {
  const str = typeof value === 'number' ? numberToDecimalString(value) : value.trim();
  if (!DECIMAL_RE.test(str)) {
    throw new TypeError(`Invalid decimal string: "${str}"`);
  }
  const negative = str.startsWith('-');
  const unsigned = str.replace(/^[+-]/, '');
  const [intPart, fracPartRaw = ''] = unsigned.split('.');
  // Pad or truncate the fractional part to `scale` digits (round half-up).
  const fracPart = fracPartRaw.padEnd(scale + 1, '0');
  const kept = fracPart.slice(0, scale);
  const roundDigit = fracPart.charCodeAt(scale) - 48; // next digit
  let minor = BigInt(intPart) * 10n ** BigInt(scale) + BigInt(kept || '0');
  if (roundDigit >= 5) minor += 1n;
  return negative ? -minor : minor;
}

/** Format scaled minor units back into a trimmed decimal string. */
export function fromMinor(minor: bigint, scale = SCALE): Decimal {
  const factor = 10n ** BigInt(scale);
  const negative = minor < 0n;
  const abs = negative ? -minor : minor;
  const intPart = abs / factor;
  const fracPart = (abs % factor).toString().padStart(scale, '0').replace(/0+$/, '');
  const sign = negative ? '-' : '';
  return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
}

function numberToDecimalString(n: number): string {
  if (!Number.isFinite(n)) throw new TypeError(`Cannot convert ${n} to Decimal`);
  // toFixed avoids exponential notation for small/large magnitudes.
  return n.toFixed(SCALE);
}

// ── Arithmetic ──────────────────────────────────────────────────────────────

export function add(a: Decimal, b: Decimal): Decimal {
  return fromMinor(toMinor(a) + toMinor(b));
}

export function sub(a: Decimal, b: Decimal): Decimal {
  return fromMinor(toMinor(a) - toMinor(b));
}

/**
 * Multiply two decimals. Because both operands are scaled by SCALE_FACTOR,
 * the raw product is scaled by SCALE_FACTOR^2; divide once (rounding half-up)
 * to bring it back to SCALE.
 */
export function mul(a: Decimal, b: Decimal): Decimal {
  const product = toMinor(a) * toMinor(b); // scaled by SCALE_FACTOR^2
  return fromMinor(divRoundHalfUp(product, SCALE_FACTOR));
}

/**
 * Divide `a` by `b`, rounding half-up at SCALE decimal places.
 * Throws on division by zero.
 */
export function div(a: Decimal, b: Decimal): Decimal {
  const denom = toMinor(b);
  if (denom === 0n) throw new RangeError('Decimal division by zero');
  // Pre-scale numerator so the quotient lands at SCALE precision.
  const numer = toMinor(a) * SCALE_FACTOR;
  return fromMinor(divRoundHalfUp(numer, denom));
}

/** Compare a and b: returns -1, 0, or 1. */
export function cmp(a: Decimal, b: Decimal): -1 | 0 | 1 {
  const da = toMinor(a);
  const db = toMinor(b);
  return da < db ? -1 : da > db ? 1 : 0;
}

export function eq(a: Decimal, b: Decimal): boolean {
  return cmp(a, b) === 0;
}
export function gt(a: Decimal, b: Decimal): boolean {
  return cmp(a, b) === 1;
}
export function gte(a: Decimal, b: Decimal): boolean {
  return cmp(a, b) >= 0;
}
export function lt(a: Decimal, b: Decimal): boolean {
  return cmp(a, b) === -1;
}
export function lte(a: Decimal, b: Decimal): boolean {
  return cmp(a, b) <= 0;
}

export function isNegative(a: Decimal): boolean {
  return toMinor(a) < 0n;
}
export function isZero(a: Decimal): boolean {
  return toMinor(a) === 0n;
}
export function abs(a: Decimal): Decimal {
  const m = toMinor(a);
  return fromMinor(m < 0n ? -m : m);
}
export function neg(a: Decimal): Decimal {
  return fromMinor(-toMinor(a));
}

/** Sum a list of decimals exactly. */
export function sum(values: Decimal[]): Decimal {
  return fromMinor(values.reduce<bigint>((acc, v) => acc + toMinor(v), 0n));
}

/**
 * Format with a fixed number of decimal places (e.g. 2 for fiat display).
 * Rounds half-up.
 */
export function format(value: Decimal, decimals = 2): string {
  const minor = toMinor(value);
  const factor = 10n ** BigInt(SCALE);
  const targetFactor = 10n ** BigInt(decimals);
  const rescaled = divRoundHalfUp(minor * targetFactor, factor); // minor units at `decimals`
  const negative = rescaled < 0n;
  const abs = negative ? -rescaled : rescaled;
  const intPart = abs / targetFactor;
  const fracPart = (abs % targetFactor).toString().padStart(decimals, '0');
  const sign = negative ? '-' : '';
  return decimals > 0 ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
}

/** Integer division with round-half-up, sign-aware. */
function divRoundHalfUp(numer: bigint, denom: bigint): bigint {
  const negative = numer < 0n !== denom < 0n;
  const a = numer < 0n ? -numer : numer;
  const b = denom < 0n ? -denom : denom;
  const q = a / b;
  const r = a % b;
  const rounded = r * 2n >= b ? q + 1n : q;
  return negative ? -rounded : rounded;
}

export const ZERO: Decimal = '0';
