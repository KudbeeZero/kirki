import { describe, it, expect } from 'vitest';
import * as d from './decimal.js';

describe('decimal — money-safe fixed-point arithmetic', () => {
  it('adds without float drift (0.1 + 0.2 === 0.3)', () => {
    expect(d.add('0.1', '0.2')).toBe('0.3');
  });

  it('preserves precision on large balances beyond 2^53', () => {
    expect(d.add('90071992547409.91', '0.04')).toBe('90071992547409.95');
  });

  it('subtracts, including across zero into negatives', () => {
    expect(d.sub('1', '0.4')).toBe('0.6');
    expect(d.sub('0.4', '1')).toBe('-0.6');
  });

  it('multiplies and rounds half-up at 8 dp', () => {
    expect(d.mul('1.5', '2')).toBe('3');
    expect(d.mul('0.1', '0.1')).toBe('0.01');
    // 7 * (1/3-ish) style rounding
    expect(d.mul('2.5', '2.5')).toBe('6.25');
  });

  it('divides with half-up rounding and throws on divide-by-zero', () => {
    expect(d.div('1', '4')).toBe('0.25');
    expect(d.div('1', '3')).toBe('0.33333333'); // 8 dp, rounded
    expect(d.div('10', '4')).toBe('2.5');
    expect(() => d.div('1', '0')).toThrow(RangeError);
  });

  it('round-trips through minor units', () => {
    expect(d.fromMinor(d.toMinor('123.456'))).toBe('123.456');
    expect(d.fromMinor(d.toMinor('-0.00000001'))).toBe('-0.00000001');
  });

  it('rejects non-numeric and non-finite inputs', () => {
    expect(() => d.toMinor('abc')).toThrow(TypeError);
    expect(() => d.toMinor('1.2.3')).toThrow(TypeError);
    expect(() => d.toMinor(Infinity)).toThrow(TypeError);
  });

  it('compares correctly', () => {
    expect(d.cmp('1.00', '1')).toBe(0);
    expect(d.cmp('1', '2')).toBe(-1);
    expect(d.cmp('2', '1')).toBe(1);
    expect(d.eq('0.50', '0.5')).toBe(true);
    expect(d.gt('1', '0.999')).toBe(true);
    expect(d.gte('1', '1')).toBe(true);
    expect(d.lt('-1', '0')).toBe(true);
    expect(d.lte('1', '1')).toBe(true);
  });

  it('handles sign helpers', () => {
    expect(d.isNegative('-0.0001')).toBe(true);
    expect(d.isNegative('0')).toBe(false);
    expect(d.isZero('0.00000000')).toBe(true);
    expect(d.abs('-5.5')).toBe('5.5');
    expect(d.neg('5.5')).toBe('-5.5');
    expect(d.neg('-5.5')).toBe('5.5');
  });

  it('sums a list exactly', () => {
    expect(d.sum(['0.1', '0.2', '0.3', '0.4'])).toBe('1');
    expect(d.sum([])).toBe('0');
  });

  it('formats to fixed display decimals with half-up rounding', () => {
    expect(d.format('1234.5', 2)).toBe('1234.50');
    expect(d.format('1.005', 2)).toBe('1.01'); // half-up
    expect(d.format('1.004', 2)).toBe('1.00');
    expect(d.format('-1.005', 2)).toBe('-1.01');
    expect(d.format('1.9', 0)).toBe('2');
  });
});
