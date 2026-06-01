import { describe, expect, it } from 'vitest';

import type { Well } from '../../../types';
import { stableSelectWellsForBudget, wellboreZoomBucket } from './spatialSampling';

function makeWell(id: string): Well {
  return {
    id,
    name: id,
    lat: 31,
    lng: -102,
    lateralLength: 7500,
    status: 'PRODUCING',
    operator: 'Test',
    formation: 'Wolfcamp A',
    trajectory: {
      surface: { lat: 31, lng: -102, depthFt: 0 },
      heel: { lat: 31, lng: -102, depthFt: 8000 },
      toe: { lat: 31, lng: -101.98, depthFt: 8000 },
      path: [
        { lat: 31, lng: -102, depthFt: 0 },
        { lat: 31, lng: -102, depthFt: 8000 },
        { lat: 31, lng: -101.98, depthFt: 8000 },
      ],
      mdFt: 15500,
    },
  };
}

describe('spatialSampling', () => {
  it('keeps sampled background wells stable regardless of input ordering', () => {
    const wells = Array.from({ length: 20 }, (_, index) => makeWell(`well-${index}`));
    const reversed = [...wells].reverse();

    const first = stableSelectWellsForBudget(wells, {
      seed: 'z12|PRODUCING',
      budget: 6,
      priorityIds: new Set(),
    }).map((well) => well.id);
    const second = stableSelectWellsForBudget(reversed, {
      seed: 'z12|PRODUCING',
      budget: 6,
      priorityIds: new Set(),
    }).map((well) => well.id);

    expect(second).toEqual(first);
  });

  it('always keeps priority wells ahead of sampled background wells', () => {
    const wells = Array.from({ length: 20 }, (_, index) => makeWell(`well-${index}`));

    const selected = stableSelectWellsForBudget(wells, {
      seed: 'z12|PRODUCING',
      budget: 4,
      priorityIds: new Set(['well-19', 'well-18']),
    });

    expect(selected.map((well) => well.id).slice(0, 2)).toEqual(['well-18', 'well-19']);
    expect(selected).toHaveLength(4);
  });

  it('buckets wellbore zoom so sampling changes less often than raw zoom', () => {
    expect(wellboreZoomBucket(12.1)).toBe(12);
    expect(wellboreZoomBucket(12.8)).toBe(12);
    expect(wellboreZoomBucket(13.0)).toBe(13);
  });
});
