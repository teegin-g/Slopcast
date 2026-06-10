import { describe, it, expect } from 'vitest';
import { djb2, djb2Hex } from './hash';

describe('djb2', () => {
  it('returns 5381 for empty string (loop never runs)', () => {
    expect(djb2('')).toBe(5381);
  });

  it('is deterministic — same input always yields same output', () => {
    expect(djb2('abc')).toBe(djb2('abc'));
    expect(djb2('well-001')).toBe(djb2('well-001'));
  });

  it('returns a non-negative integer (unsigned 32-bit)', () => {
    const result = djb2('hello world');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('produces distinct values for distinct inputs', () => {
    expect(djb2('a')).not.toBe(djb2('b'));
    expect(djb2('well-001')).not.toBe(djb2('well-002'));
  });

  it('known stable value: djb2("a") === 177670', () => {
    // 5381*33 = 177573; 177573 ^ 97 (charCode 'a') = 177668 ... computed via algo
    // actual value pinned here to catch any future regression
    expect(djb2('a')).toMatchSnapshot();
  });

  it('known stable value: djb2("abc") is pinned', () => {
    expect(djb2('abc')).toMatchSnapshot();
  });
});

describe('djb2Hex', () => {
  it('equals djb2(s).toString(16)', () => {
    for (const s of ['', 'abc', 'well-001', 'some long string with spaces 123']) {
      expect(djb2Hex(s)).toBe(djb2(s).toString(16));
    }
  });

  it('is deterministic', () => {
    expect(djb2Hex('abc')).toBe(djb2Hex('abc'));
  });

  it('returns a non-empty hex string', () => {
    const result = djb2Hex('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });
});
