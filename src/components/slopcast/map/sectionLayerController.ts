import type { SpatialFeatureCollectionResponse } from '../../../types';

export const SECTION_SOURCE_ID = 'sections-source';
export const SECTION_FILL_LAYER_ID = 'sections-fill';
export const SECTION_LINE_LAYER_ID = 'sections-lines';
export const SECTION_LABEL_LAYER_ID = 'sections-labels';

export interface SectionLayerTheme {
  lineColor: string;
  fillColor: string;
  labelColor: string;
  labelHalo: string;
}

export function addOrUpdateSectionLayers(
  map: any,
  data: SpatialFeatureCollectionResponse,
  theme: SectionLayerTheme,
) {
  if (!map.getSource(SECTION_SOURCE_ID)) {
    map.addSource(SECTION_SOURCE_ID, {
      type: 'geojson',
      data,
      promoteId: 'label',
    });
  } else {
    map.getSource(SECTION_SOURCE_ID).setData(data);
  }

  if (!map.getLayer(SECTION_FILL_LAYER_ID)) {
    map.addLayer({
      id: SECTION_FILL_LAYER_ID,
      type: 'fill',
      source: SECTION_SOURCE_ID,
      minzoom: 9,
      paint: {
        'fill-color': theme.fillColor,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.02, 12, 0.045, 15, 0.065],
      },
    });
  }

  if (!map.getLayer(SECTION_LINE_LAYER_ID)) {
    map.addLayer({
      id: SECTION_LINE_LAYER_ID,
      type: 'line',
      source: SECTION_SOURCE_ID,
      minzoom: 9,
      paint: {
        'line-color': theme.lineColor,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.22, 12, 0.45, 15, 0.62],
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.45, 12, 0.75, 15, 1.05],
      },
    });
  }

  if (!map.getLayer(SECTION_LABEL_LAYER_ID)) {
    map.addLayer({
      id: SECTION_LABEL_LAYER_ID,
      type: 'symbol',
      source: SECTION_SOURCE_ID,
      minzoom: 12,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 15, 11],
        'text-allow-overlap': false,
        'text-optional': true,
      },
      paint: {
        'text-color': theme.labelColor,
        'text-halo-color': theme.labelHalo,
        'text-halo-width': 1,
        'text-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0.45, 15, 0.75],
      },
    });
  }

  updateSectionLayerPaint(map, theme);
}

export function updateSectionLayerPaint(map: any, theme: SectionLayerTheme) {
  if (map.getLayer(SECTION_FILL_LAYER_ID)) {
    map.setPaintProperty(SECTION_FILL_LAYER_ID, 'fill-color', theme.fillColor);
  }
  if (map.getLayer(SECTION_LINE_LAYER_ID)) {
    map.setPaintProperty(SECTION_LINE_LAYER_ID, 'line-color', theme.lineColor);
  }
  if (map.getLayer(SECTION_LABEL_LAYER_ID)) {
    map.setPaintProperty(SECTION_LABEL_LAYER_ID, 'text-color', theme.labelColor);
    map.setPaintProperty(SECTION_LABEL_LAYER_ID, 'text-halo-color', theme.labelHalo);
  }
}

export function clearSectionLayers(map: any) {
  const empty: SpatialFeatureCollectionResponse = {
    type: 'FeatureCollection',
    features: [],
    total_count: 0,
    truncated: false,
    source: 'mock',
    diagnostics: {},
  };
  if (map.getSource(SECTION_SOURCE_ID)) {
    map.getSource(SECTION_SOURCE_ID).setData(empty);
  }
}
