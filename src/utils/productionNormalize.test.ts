import { describe, it, expect } from 'vitest';
import type { WellProductionSeries } from '../types';
import {
  normalizeToFirstProduction,
  aggregateNormalized,
  type NormalizedPoint,
} from './productionNormalize';

// ---------------------------------------------------------------------------
// normalizeToFirstProduction
// ---------------------------------------------------------------------------
describe('normalizeToFirstProduction', () => {
  it('maps months to NormalizedPoint shape, preserving monthIndex values', () => {
    const series: WellProductionSeries = {
      wellId: 'well-A',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 100, gasMcf: 50 },
        { monthIndex: 1, oilBbl: 80, gasMcf: 40 },
      ],
    };

    const result = normalizeToFirstProduction(series);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<NormalizedPoint>({ monthIndex: 0, oilBbl: 100, gasMcf: 50 });
    expect(result[1]).toEqual<NormalizedPoint>({ monthIndex: 1, oilBbl: 80, gasMcf: 40 });
  });

  it('ignores firstProductionMonthOffset — output still starts at monthIndex 0', () => {
    const series: WellProductionSeries = {
      wellId: 'well-B',
      firstProductionMonthOffset: 3, // offset of 3 months — must be ignored
      months: [
        { monthIndex: 0, oilBbl: 100, gasMcf: 50 },
        { monthIndex: 1, oilBbl: 80, gasMcf: 40 },
      ],
    };

    const result = normalizeToFirstProduction(series);

    // Output starts at monthIndex 0 regardless of the offset
    expect(result[0].monthIndex).toBe(0);
    expect(result[0].oilBbl).toBe(100);
    expect(result[1].monthIndex).toBe(1);
  });

  it('returns an empty array for a series with no months', () => {
    const series: WellProductionSeries = {
      wellId: 'well-empty',
      firstProductionMonthOffset: 0,
      months: [],
    };

    expect(normalizeToFirstProduction(series)).toEqual([]);
  });

  it('returns points sorted by monthIndex even when months are out of order', () => {
    const series: WellProductionSeries = {
      wellId: 'well-C',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 2, oilBbl: 60, gasMcf: 30 },
        { monthIndex: 0, oilBbl: 100, gasMcf: 50 },
        { monthIndex: 1, oilBbl: 80, gasMcf: 40 },
      ],
    };

    const result = normalizeToFirstProduction(series);

    expect(result.map((p) => p.monthIndex)).toEqual([0, 1, 2]);
  });
});

// ---------------------------------------------------------------------------
// aggregateNormalized
// ---------------------------------------------------------------------------
describe('aggregateNormalized', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateNormalized([])).toEqual([]);
  });

  it('sums oil and gas across two same-length series', () => {
    const seriesA: WellProductionSeries = {
      wellId: 'well-A',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 100, gasMcf: 20 },
        { monthIndex: 1, oilBbl: 80, gasMcf: 16 },
      ],
    };
    const seriesB: WellProductionSeries = {
      wellId: 'well-B',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 60, gasMcf: 10 },
        { monthIndex: 1, oilBbl: 50, gasMcf: 8 },
      ],
    };

    const result = aggregateNormalized([seriesA, seriesB]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<NormalizedPoint>({ monthIndex: 0, oilBbl: 160, gasMcf: 30 });
    expect(result[1]).toEqual<NormalizedPoint>({ monthIndex: 1, oilBbl: 130, gasMcf: 24 });
  });

  it('treats missing months as 0 when series have different lengths', () => {
    // Series A: 3 months; Series B: 1 month — index 1 and 2 come from A only
    const seriesA: WellProductionSeries = {
      wellId: 'well-A',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 100, gasMcf: 20 },
        { monthIndex: 1, oilBbl: 80, gasMcf: 16 },
        { monthIndex: 2, oilBbl: 60, gasMcf: 12 },
      ],
    };
    const seriesB: WellProductionSeries = {
      wellId: 'well-B',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 60, gasMcf: 10 },
      ],
    };

    const result = aggregateNormalized([seriesA, seriesB]);

    expect(result).toHaveLength(3);
    expect(result[0].oilBbl).toBe(160); // 100 + 60
    expect(result[1].oilBbl).toBe(80);  // 80 + 0 (B has no index 1)
    expect(result[2].oilBbl).toBe(60);  // 60 + 0 (B has no index 2)
  });

  it('is deterministic — calling twice yields deep-equal results', () => {
    const seriesA: WellProductionSeries = {
      wellId: 'well-A',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 100, gasMcf: 20 },
        { monthIndex: 1, oilBbl: 80, gasMcf: 16 },
      ],
    };
    const seriesB: WellProductionSeries = {
      wellId: 'well-B',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 60, gasMcf: 10 },
        { monthIndex: 1, oilBbl: 50, gasMcf: 8 },
      ],
    };

    const first = aggregateNormalized([seriesA, seriesB]);
    const second = aggregateNormalized([seriesA, seriesB]);

    expect(first).toEqual(second);
  });

  it('handles a single series — just re-expresses it as NormalizedPoints', () => {
    const series: WellProductionSeries = {
      wellId: 'well-solo',
      firstProductionMonthOffset: 5,
      months: [
        { monthIndex: 0, oilBbl: 200, gasMcf: 40 },
        { monthIndex: 1, oilBbl: 180, gasMcf: 36 },
      ],
    };

    const result = aggregateNormalized([series]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<NormalizedPoint>({ monthIndex: 0, oilBbl: 200, gasMcf: 40 });
    expect(result[1]).toEqual<NormalizedPoint>({ monthIndex: 1, oilBbl: 180, gasMcf: 36 });
  });

  it('covers all indices from 0 to max, including gaps in an individual series', () => {
    // Series with a gap: monthIndex 0 and 2, skipping 1
    const series: WellProductionSeries = {
      wellId: 'well-gap',
      firstProductionMonthOffset: 0,
      months: [
        { monthIndex: 0, oilBbl: 100, gasMcf: 20 },
        { monthIndex: 2, oilBbl: 60, gasMcf: 12 },
      ],
    };

    const result = aggregateNormalized([series]);

    // Should span 0..2 (length 3), with 0 at the gap index
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual<NormalizedPoint>({ monthIndex: 1, oilBbl: 0, gasMcf: 0 });
  });
});
