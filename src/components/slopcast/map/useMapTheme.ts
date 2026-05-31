import { useEffect } from 'react';
import type { MapPalette, MapboxOverrides } from '../../../theme/types';
import type { MapSelectionTrail } from '../MapSelectionTrail';

/**
 * Applies per-theme visual overrides to a Mapbox GL map instance.
 *
 * Responsibilities:
 *  1. Sets the lasso/selection trail stroke color whenever the theme changes.
 *  2. Applies Mapbox layer paint overrides (bg, water, land, labels, roads)
 *     whenever the theme or map load state changes.
 *
 * Extracted from MapCommandCenter — behavior-preserving only.
 */

export function applyMapThemeOverrides(map: any, overrides: MapboxOverrides | undefined): void {
  if (!map || !overrides) return;
  try {
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', overrides.bgColor);
    }
    ['water', 'water-shadow'].forEach(id => {
      if (map.getLayer(id)) map.setPaintProperty(id, 'fill-color', overrides.waterColor);
    });
    const style = map.getStyle();
    if (style?.layers) {
      for (const layer of style.layers) {
        if (
          (layer.id === 'land' ||
            layer.id.startsWith('landuse') ||
            layer.id.startsWith('landcover')) &&
          layer.type === 'fill'
        ) {
          map.setPaintProperty(layer.id, 'fill-color', overrides.landColor);
        }
        if (layer.type === 'symbol' && layer.id.includes('label')) {
          map.setPaintProperty(layer.id, 'text-color', overrides.labelColor);
        }
        if (
          (layer.id.includes('road') ||
            layer.id.includes('bridge') ||
            layer.id.includes('tunnel')) &&
          layer.type === 'line'
        ) {
          map.setPaintProperty(layer.id, 'line-opacity', overrides.roadOpacity);
        }
      }
    }
  } catch (e) {
    console.warn('[MapCommandCenter] Failed to apply theme overrides:', e);
  }
}

interface UseMapThemeParams {
  map: any;
  isLoaded: boolean;
  selectionTrail: MapSelectionTrail;
  mp: MapPalette;
  /** When satellite layer is active, skip tile-style overrides. */
  satelliteActive: boolean;
}

export function useMapTheme({
  map,
  isLoaded,
  selectionTrail,
  mp,
  satelliteActive,
}: UseMapThemeParams): void {
  // 1. Keep lasso/trail stroke colour in sync with theme
  useEffect(() => {
    selectionTrail?.setColor(mp.lassoStroke);
  }, [selectionTrail, mp.lassoStroke]);

  // 2. Apply Mapbox tile-style overrides when theme or load state changes
  useEffect(() => {
    if (!map || !isLoaded || satelliteActive) return;
    applyMapThemeOverrides(map, mp.mapboxOverrides);
  }, [map, isLoaded, mp.mapboxOverrides, satelliteActive]);
}
