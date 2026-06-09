/**
 * heatService.ts
 *
 * Mock heat-map service: per-well NPV-per-acre values for an economics heat
 * map overlay, plus a legend domain {min, max}.
 *
 * Shape mirrors productionService: a plain object (adapter seam) with
 * id/label + methods. A real Databricks adapter can swap in behind the
 * same HeatService interface.
 *
 * ---
 * Mock formulas (deterministic, no Math.random):
 *
 *   acresPerWell = max(lateralLength / 10, 40)
 *     Rough model: a 10 000 ft lateral ≈ 1 000 acres, a 7 500 ft ≈ 750 acres,
 *     with a 40-acre floor for anomalously short laterals.
 *
 *   baselineNpvPerWell = npv10 / max(wellCount, 1)   [when metrics provided]
 *                      = 0                             [when metrics undefined]
 *
 *   jitterFactor = 0.85 + (djb2hash(wellId) % 31) / 100
 *     Gives a deterministic multiplier in [0.85, 1.15], distributing heat
 *     values across wells so the overlay isn't a uniform colour.
 *
 *   latLngNoise = continuous per-well spread in ~[-0.10, +0.10] derived from
 *     the well's lat/lng fractional bits. Breaks the 2-bucket acreage banding
 *     (10000/7500 ft laterals → only 2 acre values) so the heat overlay reads
 *     as a gradient, not a binary toggle. Deterministic.
 *
 *   npvPerAcre = raw === 0 ? 0 : raw * (jitterFactor + latLngNoise)
 *     where raw = baselineNpvPerWell / acresPerWell
 * ---
 */

import type { Well, DealMetrics } from '../types';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface WellHeatValue {
  wellId: string;
  npvPerAcre: number;
}

export interface HeatResult {
  values: WellHeatValue[];
  /** Legend domain across the returned values. */
  domain: { min: number; max: number };
}

export interface HeatService {
  id: string; // 'mock'
  /**
   * Per-well NPV/acre for the given wells, derived from the group's economics.
   * @param wells the wells to value
   * @param metrics the group's DealMetrics (npv10, wellCount) — the heat baseline
   */
  getNpvPerAcre(wells: Well[], metrics: DealMetrics | undefined): HeatResult;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tiny deterministic string hash (djb2-style). Returns a non-negative integer.
 * Never uses Math.random() — determinism is a hard requirement.
 */
function hashStringToInt(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  // >>> 0 coerces to unsigned 32-bit, ensuring a non-negative result.
  return hash >>> 0;
}

/**
 * Deterministic per-well jitter factor in [0.85, 1.15].
 * djb2hash(wellId) % 31 → 0..30, divided by 100 → 0.00..0.30, plus 0.85.
 */
function jitterFactor(wellId: string): number {
  return 0.85 + (hashStringToInt(wellId) % 31) / 100;
}

/**
 * Continuous per-well spread in ~[-0.10, +0.10] from lat/lng fractional bits.
 * Breaks the 2-bucket acreage banding (MOCK_WELLS lateralLength is only 10000/7500)
 * so the heat overlay reads as a gradient, not a binary toggle. Deterministic.
 */
function latLngNoise(lat: number, lng: number): number {
  const bits = (Math.round((lat % 1) * 1e4) ^ Math.round(Math.abs(lng % 1) * 1e4)) >>> 0;
  return ((bits % 21) - 10) / 100; // -0.10 … +0.10
}

/**
 * Mock acreage estimate from lateral length.
 * Formula: acres = max(lateralLength / 10, 40)
 *
 * Rationale: a standard spacing unit is ~1 section (640 acres). A 6 400 ft
 * lateral covers roughly 640 acres when divided by 10; longer laterals scale
 * linearly. Floor of 40 acres prevents division anomalies on very short
 * laterals (sub-400 ft test stubs, etc.).
 */
function acresFromLateral(lateralLength: number): number {
  return Math.max(lateralLength / 10, 40);
}

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

function computeHeatValues(wells: Well[], metrics: DealMetrics | undefined): WellHeatValue[] {
  if (wells.length === 0) return [];

  // If no metrics, return zero values so the caller can show an empty legend.
  if (metrics === undefined) {
    return wells.map((well) => ({ wellId: well.id, npvPerAcre: 0 }));
  }

  const baselineNpvPerWell = metrics.npv10 / Math.max(metrics.wellCount, 1);

  return wells.map((well) => {
    const acres = acresFromLateral(well.lateralLength);
    const raw = baselineNpvPerWell / acres;
    const npvPerAcre = raw === 0 ? 0 : raw * (jitterFactor(well.id) + latLngNoise(well.lat, well.lng));
    return { wellId: well.id, npvPerAcre };
  });
}

function buildResult(values: WellHeatValue[]): HeatResult {
  if (values.length === 0) {
    return { values: [], domain: { min: 0, max: 0 } };
  }
  const allValues = values.map((v) => v.npvPerAcre);
  return {
    values,
    domain: {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    },
  };
}

// ---------------------------------------------------------------------------
// Adapter object
// ---------------------------------------------------------------------------

export const mockHeatService: HeatService = {
  id: 'mock',

  getNpvPerAcre(wells: Well[], metrics: DealMetrics | undefined): HeatResult {
    return buildResult(computeHeatValues(wells, metrics));
  },
};

// ---------------------------------------------------------------------------
// Convenience export (mirrors productionService / economicsEngine pattern)
// ---------------------------------------------------------------------------

export function getNpvPerAcre(wells: Well[], metrics?: DealMetrics): HeatResult {
  return mockHeatService.getNpvPerAcre(wells, metrics);
}
