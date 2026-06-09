import { describe, it, expect } from 'vitest';
import { percentileToProbit, toProbitPoints, probitColor } from './probit';

describe('percentileToProbit', () => {
  it('returns ~0 for p=0.5', () => {
    expect(percentileToProbit(0.5)).toBeCloseTo(0, 6);
  });

  it('is monotonically increasing: 0.2 < 0.5 < 0.8', () => {
    const z20 = percentileToProbit(0.2);
    const z50 = percentileToProbit(0.5);
    const z80 = percentileToProbit(0.8);
    expect(z20).toBeLessThan(z50);
    expect(z50).toBeLessThan(z80);
  });

  it('p=0.975 ≈ 1.96', () => {
    expect(percentileToProbit(0.975)).toBeCloseTo(1.96, 2);
  });

  it('p=0.025 ≈ -1.96', () => {
    expect(percentileToProbit(0.025)).toBeCloseTo(-1.96, 2);
  });

  it('boundary p=0 returns a finite number (not -Infinity or NaN)', () => {
    const z = percentileToProbit(0);
    expect(Number.isFinite(z)).toBe(true);
  });

  it('boundary p=1 returns a finite number (not +Infinity or NaN)', () => {
    const z = percentileToProbit(1);
    expect(Number.isFinite(z)).toBe(true);
  });
});

describe('toProbitPoints', () => {
  it('returns 3 points in input order for [3,1,2]', () => {
    const pts = toProbitPoints([3, 1, 2]);
    expect(pts).toHaveLength(3);
    expect(pts[0].value).toBe(3);
    expect(pts[1].value).toBe(1);
    expect(pts[2].value).toBe(2);
  });

  it('median value (2 in [3,1,2]) has rank ≈ 0.5 and z ≈ 0', () => {
    const pts = toProbitPoints([3, 1, 2]);
    // Sorted ascending: [1,2,3]. Hazen ranks: 1→1/6, 2→3/6=0.5, 3→5/6.
    const medianPt = pts.find(p => p.value === 2)!;
    expect(medianPt.rank).toBeCloseTo(0.5, 6);
    expect(medianPt.z).toBeCloseTo(0, 5);
  });

  it('all ranks are in (0, 1)', () => {
    const pts = toProbitPoints([3, 1, 2]);
    for (const pt of pts) {
      expect(pt.rank).toBeGreaterThan(0);
      expect(pt.rank).toBeLessThan(1);
    }
  });

  it('values in the returned points match original input order', () => {
    const input = [10, 5, 8, 2, 9];
    const pts = toProbitPoints(input);
    pts.forEach((pt, i) => expect(pt.value).toBe(input[i]));
  });

  it('handles single-element array without error', () => {
    const pts = toProbitPoints([42]);
    expect(pts).toHaveLength(1);
    expect(pts[0].value).toBe(42);
    expect(pts[0].rank).toBeCloseTo(0.5, 6);
    expect(Number.isFinite(pts[0].z)).toBe(true);
  });

  it('handles ties deterministically (stable sort order)', () => {
    const pts = toProbitPoints([5, 5, 5]);
    expect(pts).toHaveLength(3);
    // All ranks should be distinct: 1/6, 3/6, 5/6 by stable sort position
    const ranks = pts.map(p => p.rank);
    const uniqueRanks = new Set(ranks.map(r => r.toFixed(10)));
    expect(uniqueRanks.size).toBe(3);
  });
});

describe('probitColor', () => {
  it('returns a string starting with "hsl("', () => {
    const color = probitColor(50, { min: 0, max: 100 });
    expect(color).toMatch(/^hsl\(/);
  });

  it('color at min and color at max are different', () => {
    const low = probitColor(0, { min: 0, max: 100 });
    const high = probitColor(100, { min: 0, max: 100 });
    expect(low).not.toBe(high);
  });

  it('does not throw when min === max (guard against division by zero)', () => {
    expect(() => probitColor(5, { min: 5, max: 5 })).not.toThrow();
    const color = probitColor(5, { min: 5, max: 5 });
    expect(color).toMatch(/^hsl\(/);
  });

  it('clamps values below min to min color', () => {
    const atMin = probitColor(0, { min: 0, max: 100 });
    const belowMin = probitColor(-50, { min: 0, max: 100 });
    expect(atMin).toBe(belowMin);
  });

  it('clamps values above max to max color', () => {
    const atMax = probitColor(100, { min: 0, max: 100 });
    const aboveMax = probitColor(200, { min: 0, max: 100 });
    expect(atMax).toBe(aboveMax);
  });

  it('is deterministic — same inputs always return same color', () => {
    const c1 = probitColor(75, { min: 0, max: 100 });
    const c2 = probitColor(75, { min: 0, max: 100 });
    expect(c1).toBe(c2);
  });
});
