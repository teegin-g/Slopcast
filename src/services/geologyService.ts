/**
 * geologyService.ts
 *
 * Mock formation / type-curve boundary polygons as GeoJSON, for a map layer.
 * Covers Wolfcamp A, B, D formations + a Type-Curve Area overlay —
 * all hand-authored, deterministic, and positioned within the Permian Basin
 * coordinate frame used by MOCK_WELLS (lat 31.80–32.00, lng -102.45 to -102.15).
 *
 * This module is an adapter seam: swap `mockGeologyService` for a live
 * Databricks-backed implementation without changing call sites.
 */

import type { FeatureCollection, Feature, Polygon } from 'geojson';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FormationProperties {
  /** Canonical formation name, e.g. 'Wolfcamp A' */
  formation: string;
  /** Display label (may equal formation) */
  label: string;
  /** Representative longitude for label placement (polygon centroid-ish) */
  labelLng: number;
  /** Representative latitude for label placement (polygon centroid-ish) */
  labelLat: number;
}

export interface GeologyService {
  /** Unique identifier for this service implementation */
  id: string;
  /**
   * Formation boundary polygons as a GeoJSON FeatureCollection.
   * Each feature is a Polygon with FormationProperties.
   * Returns a fresh object each call but with IDENTICAL content (deterministic).
   */
  getFormationPolygons(): FeatureCollection<Polygon, FormationProperties>;
}

// ---------------------------------------------------------------------------
// Hand-authored formation polygons
// ---------------------------------------------------------------------------
//
// The Permian basin bbox used here:
//   lng: -102.45 … -102.15
//   lat:   31.80 … 32.00
//
// We divide the area into three horizontal lat-bands (A top, B middle, D bottom)
// and add a type-curve overlay that spans the centre of the bbox.
// Every ring is closed: first coord === last coord.

type Ring = [number, number][];

function makeFeature(
  ring: Ring,
  formation: string,
  label: string,
  labelLng: number,
  labelLat: number,
): Feature<Polygon, FormationProperties> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [ring as number[][]],
    },
    properties: { formation, label, labelLng, labelLat },
  };
}

// Wolfcamp A — northern band  (lat 31.93 – 32.00)
const wolfcampA: Feature<Polygon, FormationProperties> = makeFeature(
  [
    [-102.45, 31.93],
    [-102.15, 31.93],
    [-102.15, 32.00],
    [-102.45, 32.00],
    [-102.45, 31.93],
  ],
  'Wolfcamp A',
  'Wolfcamp A',
  -102.30,
  31.965,
);

// Wolfcamp B — middle band  (lat 31.87 – 31.93)
const wolfcampB: Feature<Polygon, FormationProperties> = makeFeature(
  [
    [-102.45, 31.87],
    [-102.15, 31.87],
    [-102.15, 31.93],
    [-102.45, 31.93],
    [-102.45, 31.87],
  ],
  'Wolfcamp B',
  'Wolfcamp B',
  -102.30,
  31.90,
);

// Wolfcamp D — southern band  (lat 31.80 – 31.87)
const wolfcampD: Feature<Polygon, FormationProperties> = makeFeature(
  [
    [-102.45, 31.80],
    [-102.15, 31.80],
    [-102.15, 31.87],
    [-102.45, 31.87],
    [-102.45, 31.80],
  ],
  'Wolfcamp D',
  'Wolfcamp D',
  -102.30,
  31.835,
);

// Type-Curve Area — central overlay spanning all three bands
const typeCurveArea: Feature<Polygon, FormationProperties> = makeFeature(
  [
    [-102.38, 31.83],
    [-102.22, 31.83],
    [-102.22, 31.97],
    [-102.38, 31.97],
    [-102.38, 31.83],
  ],
  'Type-Curve Area',
  'Type-Curve Area',
  -102.30,
  31.90,
);

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export const mockGeologyService: GeologyService = {
  id: 'mock',

  getFormationPolygons(): FeatureCollection<Polygon, FormationProperties> {
    return {
      type: 'FeatureCollection',
      features: [wolfcampA, wolfcampB, wolfcampD, typeCurveArea],
    };
  },
};

// ---------------------------------------------------------------------------
// Convenience delegate
// ---------------------------------------------------------------------------

/**
 * Convenience function — delegates to the default mock service.
 * Swap out `mockGeologyService` to change the backing implementation.
 */
export function getFormationPolygons(): FeatureCollection<Polygon, FormationProperties> {
  return mockGeologyService.getFormationPolygons();
}
