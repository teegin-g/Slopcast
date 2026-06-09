/**
 * productionService.ts
 *
 * Mock production service: deterministic monthly production per well,
 * derived from the group's type curve via the existing calculateEconomics engine.
 *
 * Shape mirrors the economicsEngine adapter: a plain object with id/label + methods.
 * Real adapter (Databricks) can swap in behind the same ProductionService interface.
 */

import type { Well, TypeCurveParams, WellProductionSeries, MonthlyProduction } from '../types';
import { calculateEconomics, MONTHS_TO_PROJECT } from '../utils/economics';
import {
  DEFAULT_CAPEX,
  DEFAULT_COMMODITY_PRICING,
  DEFAULT_OPEX,
  DEFAULT_OWNERSHIP,
} from '../constants';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ProductionService {
  id: string;
  /** One production series per well, on each well's own t=0 monthIndex axis. */
  getProductionSeries(wells: Well[], typeCurve: TypeCurveParams): WellProductionSeries[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tiny deterministic string hash (djb2-ish). Returns a non-negative integer.
 * Used exclusively for deriving per-well mock first-production month staggering.
 * Never call Math.random() here — determinism is a hard requirement.
 */
function hashStringToInt(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  // >>> 0 coerces to unsigned 32-bit integer, ensuring non-negative result
  return hash >>> 0;
}

/**
 * Derive a small deterministic per-well month stagger (0..5 months)
 * from the well's id. Simulates real-world staggered spud dates without
 * introducing non-determinism (Math.random). Range is 0..5 inclusive.
 */
function wellMonthOffset(wellId: string): number {
  return hashStringToInt(wellId) % 6;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Compute the production series for a single well by delegating to
 * calculateEconomics (the canonical Arps / multi-segment decline engine).
 *
 * We pass DEFAULT_* values for CAPEX, pricing, OPEX, and ownership because
 * those assumptions only affect revenue/cost flows — oil/gas production volumes
 * are driven solely by the type curve and well count/lateral length.
 *
 * calculateEconomics schedules wells on a shared calendar timeline, so the
 * first entry in its returned `flow` array corresponds to the rig-start month
 * (drill + completion time, typically month 0), with the first producing month
 * at flow[1] or later. We re-base the series to the well's own t=0 axis by
 * finding the first month with positive oil production and slicing from there.
 * The result is always padded to exactly MONTHS_TO_PROJECT (120) entries.
 *
 * Returns MONTHS_TO_PROJECT (120) entries indexed 0..119, each on the well's
 * own t=0 axis (i.e. monthIndex 0 is the well's first producing month).
 */
function computeSeriesForWell(well: Well, typeCurve: TypeCurveParams): MonthlyProduction[] {
  const { flow } = calculateEconomics(
    [well],
    typeCurve,
    DEFAULT_CAPEX,
    DEFAULT_COMMODITY_PRICING,
    DEFAULT_OPEX,
    DEFAULT_OWNERSHIP,
  );

  // Find the first calendar month that has non-zero oil production (the
  // well's t=0). If no producing months are found (qi=0 edge case), start
  // at index 0 so the series is still valid.
  const firstProdIdx = flow.findIndex((m) => m.oilProduction > 0);
  const startIdx = firstProdIdx >= 0 ? firstProdIdx : 0;

  // Slice from the well's first producing month and build the well-age series.
  // Pad to MONTHS_TO_PROJECT with zero entries so consumers always get 120 months.
  const months: MonthlyProduction[] = [];
  for (let i = 0; i < MONTHS_TO_PROJECT; i++) {
    const entry = flow[startIdx + i];
    months.push({
      monthIndex: i,
      oilBbl: entry?.oilProduction ?? 0,
      gasMcf: entry?.gasProduction ?? 0,
    });
  }
  return months;
}

// ---------------------------------------------------------------------------
// Adapter object
// ---------------------------------------------------------------------------

export const mockProductionService: ProductionService = {
  id: 'mock',

  getProductionSeries(wells: Well[], typeCurve: TypeCurveParams): WellProductionSeries[] {
    if (wells.length === 0) return [];

    return wells.map((well): WellProductionSeries => ({
      wellId: well.id,
      // Deterministic mock stagger: hash(wellId) % 6 → 0..5 months.
      // This simulates wells in a group having slightly different spud dates.
      // A real adapter would derive this from actual first-production dates.
      firstProductionMonthOffset: wellMonthOffset(well.id),
      months: computeSeriesForWell(well, typeCurve),
    }));
  },
};

// ---------------------------------------------------------------------------
// Convenience export (mirrors economicsEngine pattern)
// ---------------------------------------------------------------------------

export function getProductionSeries(
  wells: Well[],
  typeCurve: TypeCurveParams,
): WellProductionSeries[] {
  return mockProductionService.getProductionSeries(wells, typeCurve);
}
