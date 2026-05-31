import { useEffect, useState } from 'react';
import type { Well } from '../../types';

export type HeatmapMetric = 'density' | 'eur_ft' | 'npv';

export interface UseMapboxHeatmapResult {
  showHeatmap: boolean;
  setShowHeatmap: React.Dispatch<React.SetStateAction<boolean>>;
  heatmapMetric: HeatmapMetric;
  setHeatmapMetric: React.Dispatch<React.SetStateAction<HeatmapMetric>>;
}

/**
 * Owns the Mapbox GL heatmap layer logic plus the heatmap visibility/metric
 * state. The effect adds/removes the `well-heatmap` layer + source on the
 * shared map instance. Behavior preserved exactly from the original effect.
 */
export function useMapboxHeatmap(
  mapRef: React.MutableRefObject<any>,
  mapboxLoaded: boolean,
  wells: Well[],
): UseMapboxHeatmapResult {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('density');

  // Heatmap layer on Mapbox
  useEffect(() => {
    if (!mapRef.current || !mapboxLoaded) return;
    const map = mapRef.current;

    // Remove existing heatmap
    if (map.getLayer('well-heatmap')) map.removeLayer('well-heatmap');
    if (map.getSource('well-heatmap-source')) map.removeSource('well-heatmap-source');

    if (!showHeatmap) return;

    const features = wells.map(w => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [w.lng, w.lat] },
      properties: {
        weight: heatmapMetric === 'density' ? 1 : heatmapMetric === 'eur_ft' ? w.lateralLength / 10000 : 1,
      },
    }));

    map.addSource('well-heatmap-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    map.addLayer({
      id: 'well-heatmap',
      type: 'heatmap',
      source: 'well-heatmap-source',
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': 1,
        'heatmap-radius': 30,
        'heatmap-opacity': 0.6,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.2, 'rgba(0,0,255,0.3)',
          0.4, 'rgba(0,128,0,0.5)',
          0.6, 'rgba(255,255,0,0.6)',
          0.8, 'rgba(255,128,0,0.7)',
          1, 'rgba(255,0,0,0.8)',
        ],
      },
    });
  }, [showHeatmap, heatmapMetric, wells, mapboxLoaded]);

  return { showHeatmap, setShowHeatmap, heatmapMetric, setHeatmapMetric };
}
