import { describe, expect, it, vi } from 'vitest';
import { addOrUpdateLateralLayers, LATERAL_LAYER_ID, LATERAL_SOURCE_ID } from './lateralLayerController';
import type { SpatialFeatureCollectionResponse } from '../../../types';

const EMPTY: SpatialFeatureCollectionResponse = {
  type: 'FeatureCollection',
  features: [],
  total_count: 0,
  truncated: false,
  source: 'mock',
  diagnostics: {},
};

describe('lateralLayerController', () => {
  it('adds an independent GeoJSON line source and zoom-gated lateral layer', () => {
    const addSource = vi.fn();
    const addLayer = vi.fn();
    const map = {
      getSource: vi.fn(() => null),
      addSource,
      getLayer: vi.fn(() => false),
      addLayer,
      setPaintProperty: vi.fn(),
    };

    addOrUpdateLateralLayers(map, EMPTY, { lineColor: '#48d7ff' });

    expect(addSource).toHaveBeenCalledWith(LATERAL_SOURCE_ID, expect.objectContaining({
      type: 'geojson',
      promoteId: 'api_14',
    }));
    expect(addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: LATERAL_LAYER_ID,
      type: 'line',
      source: LATERAL_SOURCE_ID,
      minzoom: 11,
      paint: expect.objectContaining({
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.55, 13, 0.9, 15, 1.45],
      }),
    }));
  });
});
