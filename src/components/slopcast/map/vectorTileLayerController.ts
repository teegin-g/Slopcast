export const SPATIAL_VECTOR_SOURCE_ID = 'spatial-vector-tiles';
export const SPATIAL_VECTOR_LAYER_IDS = {
  sampledWells: 'spatial-vector-wells-sampled',
  lateralsPreview: 'spatial-vector-laterals-preview',
} as const;

export function addSpatialVectorTileSource(map: any, renderProfile = 'sampled') {
  if (!map.getSource(SPATIAL_VECTOR_SOURCE_ID)) {
    map.addSource(SPATIAL_VECTOR_SOURCE_ID, {
      type: 'vector',
      tiles: [`/api/spatial/tiles/{z}/{x}/{y}.mvt?render_profile=${encodeURIComponent(renderProfile)}`],
      minzoom: 0,
      maxzoom: 14,
    });
  }

  if (!map.getLayer(SPATIAL_VECTOR_LAYER_IDS.sampledWells)) {
    map.addLayer({
      id: SPATIAL_VECTOR_LAYER_IDS.sampledWells,
      type: 'circle',
      source: SPATIAL_VECTOR_SOURCE_ID,
      'source-layer': 'wells_sampled',
      minzoom: 8,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 12, 4],
        'circle-color': ['coalesce', ['get', 'color'], '#48d7ff'],
        'circle-opacity': 0.65,
      },
    });
  }

  if (!map.getLayer(SPATIAL_VECTOR_LAYER_IDS.lateralsPreview)) {
    map.addLayer({
      id: SPATIAL_VECTOR_LAYER_IDS.lateralsPreview,
      type: 'line',
      source: SPATIAL_VECTOR_SOURCE_ID,
      'source-layer': 'laterals_preview',
      minzoom: 10,
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#48d7ff'],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.2, 12, 0.55],
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 1.25],
      },
    });
  }
}
