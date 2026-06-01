import { describe, expect, it, vi } from 'vitest';
import {
  addOrUpdateSectionLayers,
  SECTION_FILL_LAYER_ID,
  SECTION_LABEL_LAYER_ID,
  SECTION_LINE_LAYER_ID,
  SECTION_SOURCE_ID,
} from './sectionLayerController';
import type { SpatialFeatureCollectionResponse } from '../../../types';

const EMPTY: SpatialFeatureCollectionResponse = {
  type: 'FeatureCollection',
  features: [],
  total_count: 0,
  truncated: false,
  source: 'mock',
  diagnostics: {},
};

describe('sectionLayerController', () => {
  it('adds section fill, boundary, and high-zoom STR label layers', () => {
    const addSource = vi.fn();
    const addLayer = vi.fn();
    const map = {
      getSource: vi.fn(() => null),
      addSource,
      getLayer: vi.fn(() => false),
      addLayer,
      setPaintProperty: vi.fn(),
    };

    addOrUpdateSectionLayers(map, EMPTY, {
      lineColor: '#9ca3af',
      fillColor: '#48d7ff',
      labelColor: '#fff',
      labelHalo: '#000',
    });

    expect(addSource).toHaveBeenCalledWith(SECTION_SOURCE_ID, expect.objectContaining({
      type: 'geojson',
      promoteId: 'label',
    }));
    expect(addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: SECTION_FILL_LAYER_ID,
      type: 'fill',
      minzoom: 9,
    }));
    expect(addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: SECTION_LINE_LAYER_ID,
      type: 'line',
      minzoom: 9,
    }));
    expect(addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: SECTION_LABEL_LAYER_ID,
      type: 'symbol',
      minzoom: 12,
      layout: expect.objectContaining({
        'text-field': ['get', 'label'],
      }),
    }));
  });
});
