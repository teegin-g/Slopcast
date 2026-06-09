import { describe, it, expect } from 'vitest';
import { MOCK_WELLS } from '../constants';
import type { DealMetrics } from '../types';
import { getNpvPerAcre, mockHeatService } from './heatService';

// Small subset for fast tests.
const TEST_WELLS = MOCK_WELLS.slice(0, 4);

// Larger subset to test gradient spread (lat/lng noise breaks 2-bucket banding).
const TEN_WELLS = MOCK_WELLS.slice(0, 10);

const SAMPLE_METRICS: DealMetrics = {
  totalCapex: 36_000_000,
  eur: 2_000_000,
  npv10: 100_000_000,
  payoutMonths: 24,
  wellCount: 4,
};

describe('heatService', () => {
  describe('getNpvPerAcre convenience function', () => {
    it('returns one WellHeatValue per input well', () => {
      const result = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      expect(result.values).toHaveLength(TEST_WELLS.length);
      result.values.forEach((v, i) => {
        expect(v.wellId).toBe(TEST_WELLS[i].id);
      });
    });

    it('is deterministic: two calls with same inputs return deep-equal results', () => {
      const a = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      const b = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      expect(a).toEqual(b);
    });

    it('domain.min <= domain.max', () => {
      const { domain } = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      expect(domain.min).toBeLessThanOrEqual(domain.max);
    });

    it('domain.min equals Math.min of all npvPerAcre values', () => {
      const { values, domain } = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      const expected = Math.min(...values.map((v) => v.npvPerAcre));
      expect(domain.min).toBe(expected);
    });

    it('domain.max equals Math.max of all npvPerAcre values', () => {
      const { values, domain } = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      const expected = Math.max(...values.map((v) => v.npvPerAcre));
      expect(domain.max).toBe(expected);
    });

    it('with metrics undefined → all npvPerAcre === 0 and domain is {0, 0}', () => {
      const result = getNpvPerAcre(TEST_WELLS, undefined);
      result.values.forEach((v) => {
        expect(v.npvPerAcre).toBe(0);
      });
      expect(result.domain).toEqual({ min: 0, max: 0 });
    });

    it('with valid metrics → all npvPerAcre values are > 0 and finite', () => {
      const result = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      result.values.forEach((v) => {
        expect(v.npvPerAcre).toBeGreaterThan(0);
        expect(isFinite(v.npvPerAcre)).toBe(true);
      });
    });

    it('per-well jitter: ≥2 wells produce distinct npvPerAcre values (not all identical)', () => {
      const { values } = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      const unique = new Set(values.map((v) => v.npvPerAcre));
      // If all values are the same, jitter is a no-op — that is a bug.
      expect(unique.size).toBeGreaterThan(1);
    });

    it('lat/lng noise breaks 2-bucket banding: ≥9 of 10 wells have distinct npvPerAcre (gradient, not binary)', () => {
      // MOCK_WELLS lateralLength is only 10000 or 7500 — without lat/lng noise this
      // produces just 2 distinct acreage buckets and a near-binary heat overlay.
      // This test asserts that continuous per-well variance from lat/lng fractional
      // bits produces near-all-unique values across a sample of 10 wells.
      const { values } = getNpvPerAcre(TEN_WELLS, { ...SAMPLE_METRICS, wellCount: 10 });
      const unique = new Set(values.map((v) => v.npvPerAcre));
      expect(unique.size).toBeGreaterThanOrEqual(TEN_WELLS.length - 1);
    });

    it('lat/lng noise: metrics-undefined path still yields all-zero (noise must not turn 0 into nonzero)', () => {
      const result = getNpvPerAcre(TEN_WELLS, undefined);
      result.values.forEach((v) => {
        expect(v.npvPerAcre).toBe(0);
      });
      expect(result.domain).toEqual({ min: 0, max: 0 });
    });

    it('empty wells → {values: [], domain: {min: 0, max: 0}}', () => {
      const result = getNpvPerAcre([], SAMPLE_METRICS);
      expect(result.values).toEqual([]);
      expect(result.domain).toEqual({ min: 0, max: 0 });
    });

    it('single well → domain.min === domain.max === npvPerAcre of that well', () => {
      const result = getNpvPerAcre([TEST_WELLS[0]], SAMPLE_METRICS);
      expect(result.values).toHaveLength(1);
      const v = result.values[0].npvPerAcre;
      expect(result.domain).toEqual({ min: v, max: v });
    });
  });

  describe('mockHeatService', () => {
    it('has id === "mock"', () => {
      expect(mockHeatService.id).toBe('mock');
    });

    it('service getNpvPerAcre matches convenience export', () => {
      const fromService = mockHeatService.getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      const fromConvenience = getNpvPerAcre(TEST_WELLS, SAMPLE_METRICS);
      expect(fromService).toEqual(fromConvenience);
    });

    it('service returns same shape as convenience function for undefined metrics', () => {
      const fromService = mockHeatService.getNpvPerAcre(TEST_WELLS, undefined);
      const fromConvenience = getNpvPerAcre(TEST_WELLS, undefined);
      expect(fromService).toEqual(fromConvenience);
    });
  });
});
