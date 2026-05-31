import type { SpatialFeatureCollectionResponse } from '../../../types';

export const LATERAL_SOURCE_ID = 'laterals-source';
export const LATERAL_LAYER_ID = 'laterals-lines';

export interface LateralLayerTheme {
  lineColor: string;
}

export function addOrUpdateLateralLayers(
  map: any,
  data: SpatialFeatureCollectionResponse,
  theme: LateralLayerTheme,
) {
  if (!map.getSource(LATERAL_SOURCE_ID)) {
    map.addSource(LATERAL_SOURCE_ID, {
      type: 'geojson',
      data,
      promoteId: 'api_14',
    });
  } else {
    map.getSource(LATERAL_SOURCE_ID).setData(data);
  }

  if (!map.getLayer(LATERAL_LAYER_ID)) {
    map.addLayer({
      id: LATERAL_LAYER_ID,
      type: 'line',
      source: LATERAL_SOURCE_ID,
      minzoom: 11,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': ['coalesce', ['get', 'groupColor'], theme.lineColor],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.18, 13, 0.42, 15, 0.68],
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.55, 13, 0.9, 15, 1.45],
      },
    });
  }

  updateLateralLayerPaint(map, theme);
}

export function updateLateralLayerPaint(map: any, theme: LateralLayerTheme) {
  if (!map.getLayer(LATERAL_LAYER_ID)) return;
  map.setPaintProperty(LATERAL_LAYER_ID, 'line-color', ['coalesce', ['get', 'groupColor'], theme.lineColor]);
}

export function clearLateralLayers(map: any) {
  const empty: SpatialFeatureCollectionResponse = {
    type: 'FeatureCollection',
    features: [],
    total_count: 0,
    truncated: false,
    source: 'mock',
    diagnostics: {},
  };
  if (map.getSource(LATERAL_SOURCE_ID)) {
    map.getSource(LATERAL_SOURCE_ID).setData(empty);
  }
}
