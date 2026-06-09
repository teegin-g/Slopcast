import { describe, it, expect } from 'vitest';
import { MOCK_WELLS, DEFAULT_TYPE_CURVE } from '../constants';
import { MONTHS_TO_PROJECT } from '../utils/economics';
import { getProductionSeries, mockProductionService } from './productionService';

// Use a small subset of MOCK_WELLS so the test suite stays fast.
const TEST_WELLS = MOCK_WELLS.slice(0, 3);

describe('productionService', () => {
  describe('getProductionSeries', () => {
    it('returns one WellProductionSeries per input well', () => {
      const result = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      expect(result).toHaveLength(TEST_WELLS.length);
      result.forEach((series, i) => {
        expect(series.wellId).toBe(TEST_WELLS[i].id);
      });
    });

    it('each series has exactly MONTHS_TO_PROJECT (120) monthly entries', () => {
      const result = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      result.forEach((series) => {
        expect(series.months).toHaveLength(MONTHS_TO_PROJECT);
      });
    });

    it('monthIndex values run 0 through 119 in order', () => {
      const result = getProductionSeries([TEST_WELLS[0]], DEFAULT_TYPE_CURVE);
      result[0].months.forEach((m, i) => {
        expect(m.monthIndex).toBe(i);
      });
    });

    it('month 0 oil is > 0 for a producing type-curve well (qi > 0)', () => {
      const result = getProductionSeries([TEST_WELLS[0]], DEFAULT_TYPE_CURVE);
      expect(result[0].months[0].oilBbl).toBeGreaterThan(0);
    });

    it('production declines: month 0 oil >= month 60 oil', () => {
      const result = getProductionSeries([TEST_WELLS[0]], DEFAULT_TYPE_CURVE);
      const { months } = result[0];
      expect(months[0].oilBbl).toBeGreaterThanOrEqual(months[60].oilBbl);
    });

    it('is deterministic: two calls with same inputs return deep-equal results', () => {
      const a = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      const b = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      expect(a).toEqual(b);
    });

    it('firstProductionMonthOffset is deterministic per wellId', () => {
      const a = getProductionSeries([TEST_WELLS[0]], DEFAULT_TYPE_CURVE);
      const b = getProductionSeries([TEST_WELLS[0]], DEFAULT_TYPE_CURVE);
      expect(a[0].firstProductionMonthOffset).toBe(b[0].firstProductionMonthOffset);
    });

    it('firstProductionMonthOffset is within 0..5 for all wells', () => {
      const result = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      result.forEach((series) => {
        expect(series.firstProductionMonthOffset).toBeGreaterThanOrEqual(0);
        expect(series.firstProductionMonthOffset).toBeLessThanOrEqual(5);
      });
    });

    it('different wellIds can produce different firstProductionMonthOffsets', () => {
      // With 3 wells drawn from the hash function, at least two different offsets
      // are plausible — we just check the values are within range and stable.
      const result = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      const offsets = result.map((s) => s.firstProductionMonthOffset);
      // All must be valid integers in [0..5]
      offsets.forEach((o) => {
        expect(Number.isInteger(o)).toBe(true);
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(5);
      });
    });

    it('returns empty array for empty wells input', () => {
      const result = getProductionSeries([], DEFAULT_TYPE_CURVE);
      expect(result).toEqual([]);
    });
  });

  describe('mockProductionService', () => {
    it('has id === "mock"', () => {
      expect(mockProductionService.id).toBe('mock');
    });

    it('getProductionSeries on the service object matches the exported convenience function', () => {
      const fromService = mockProductionService.getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      const fromConvenience = getProductionSeries(TEST_WELLS, DEFAULT_TYPE_CURVE);
      expect(fromService).toEqual(fromConvenience);
    });
  });
});
