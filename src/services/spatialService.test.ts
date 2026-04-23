import { describe, expect, it } from 'vitest';

import { getSpatialSource } from './spatialService';

describe('spatialService mock source', () => {
  it('attaches trajectories for full-detail mock requests', async () => {
    const source = getSpatialSource('mock');

    const response = await source.fetchViewportWells(
      {
        sw_lat: 31.0,
        sw_lng: -103.0,
        ne_lat: 33.0,
        ne_lng: -101.0,
      },
      undefined,
      {
        detailLevel: 'full',
        includeLaterals: true,
        zoom: 14,
      },
    );

    expect(response.wells.length).toBeGreaterThan(0);
    expect(response.wells.every((well) => well.trajectory?.path.length && well.trajectory.path.length >= 3)).toBe(true);
  });
});
