import type { WellProductionSeries } from '../types';

/** A point on the shared, normalized (t=0) timeline. */
export interface NormalizedPoint {
  monthIndex: number;
  oilBbl: number;
  gasMcf: number;
}

/**
 * Re-express a single series on the shared t=0 axis: returns its points keyed by
 * monthIndex (0 = the series' own first producing month). firstProductionMonthOffset
 * is intentionally ignored for the t=0 view.
 *
 * @remarks months must already be t=0-indexed (monthIndex 0 = first producing month);
 *   this function does not re-base. productionService produces t=0-indexed series
 *   by slicing from the first producing month before passing here.
 */
export function normalizeToFirstProduction(series: WellProductionSeries): NormalizedPoint[] {
  return series.months
    .map(({ monthIndex, oilBbl, gasMcf }) => ({ monthIndex, oilBbl, gasMcf }))
    .sort((a, b) => a.monthIndex - b.monthIndex);
}

/**
 * Sum oil/gas across multiple series at each aligned monthIndex (t=0 aligned).
 * Returns points for monthIndex 0..maxIndex, with missing months treated as 0.
 *
 * @remarks If a single series contains duplicate monthIndex values, the last
 *   occurrence wins (Map.set overwrites the prior entry for that key).
 */
export function aggregateNormalized(seriesList: WellProductionSeries[]): NormalizedPoint[] {
  if (seriesList.length === 0) return [];

  // Find the maximum monthIndex across all series
  let maxIndex = 0;
  for (const series of seriesList) {
    for (const month of series.months) {
      if (month.monthIndex > maxIndex) {
        maxIndex = month.monthIndex;
      }
    }
  }

  // Build lookup: for each series, build a map from monthIndex → production values
  const lookups = seriesList.map((series) => {
    const map = new Map<number, { oilBbl: number; gasMcf: number }>();
    for (const month of series.months) {
      map.set(month.monthIndex, { oilBbl: month.oilBbl, gasMcf: month.gasMcf });
    }
    return map;
  });

  // Aggregate index 0..maxIndex
  const result: NormalizedPoint[] = [];
  for (let i = 0; i <= maxIndex; i++) {
    let oilBbl = 0;
    let gasMcf = 0;
    for (const lookup of lookups) {
      const pt = lookup.get(i);
      if (pt !== undefined) {
        oilBbl += pt.oilBbl;
        gasMcf += pt.gasMcf;
      }
    }
    result.push({ monthIndex: i, oilBbl, gasMcf });
  }

  return result;
}
