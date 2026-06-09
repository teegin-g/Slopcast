import { describe, it, expect } from 'vitest';
import { mockGeologyService, getFormationPolygons } from './geologyService';

// Permian basin bbox used by the mock service
const LNG_MIN = -102.5;
const LNG_MAX = -102.1;
const LAT_MIN = 31.75;
const LAT_MAX = 32.05;

describe('geologyService', () => {
  describe('mockGeologyService', () => {
    it('has id === "mock"', () => {
      expect(mockGeologyService.id).toBe('mock');
    });

    it('returns a valid FeatureCollection', () => {
      const fc = mockGeologyService.getFormationPolygons();
      expect(fc.type).toBe('FeatureCollection');
      expect(Array.isArray(fc.features)).toBe(true);
      expect(fc.features.length).toBeGreaterThan(0);
    });

    it('every feature is a Polygon', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        expect(feature.geometry.type).toBe('Polygon');
      }
    });

    it('every feature has a non-empty properties.formation string', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        expect(typeof feature.properties?.formation).toBe('string');
        expect((feature.properties?.formation as string).length).toBeGreaterThan(0);
      }
    });

    it('every feature has a properties.label string', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        expect(typeof feature.properties?.label).toBe('string');
        expect((feature.properties?.label as string).length).toBeGreaterThan(0);
      }
    });

    it('each polygon ring is closed (first coord deep-equals last coord)', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        const geometry = feature.geometry as { type: 'Polygon'; coordinates: number[][][] };
        for (const ring of geometry.coordinates) {
          const first = ring[0];
          const last = ring[ring.length - 1];
          expect(first).toEqual(last);
        }
      }
    });

    it('each polygon ring has >= 4 positions (min for a valid closed ring)', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        const geometry = feature.geometry as { type: 'Polygon'; coordinates: number[][][] };
        for (const ring of geometry.coordinates) {
          expect(ring.length).toBeGreaterThanOrEqual(4);
        }
      }
    });

    it('all coordinates are within the Permian bbox', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        const geometry = feature.geometry as { type: 'Polygon'; coordinates: number[][][] };
        for (const ring of geometry.coordinates) {
          for (const [lng, lat] of ring) {
            expect(lng).toBeGreaterThanOrEqual(LNG_MIN);
            expect(lng).toBeLessThanOrEqual(LNG_MAX);
            expect(lat).toBeGreaterThanOrEqual(LAT_MIN);
            expect(lat).toBeLessThanOrEqual(LAT_MAX);
          }
        }
      }
    });

    it('is deterministic: two calls produce deep-equal FeatureCollections', () => {
      const a = mockGeologyService.getFormationPolygons();
      const b = mockGeologyService.getFormationPolygons();
      expect(a).toEqual(b);
    });

    it('has >= 3 distinct formation values', () => {
      const fc = mockGeologyService.getFormationPolygons();
      const formations = new Set(fc.features.map((f) => f.properties?.formation as string));
      expect(formations.size).toBeGreaterThanOrEqual(3);
    });

    it('labelLng and labelLat are present on every feature and within the Permian bbox', () => {
      const fc = mockGeologyService.getFormationPolygons();
      for (const feature of fc.features) {
        const { labelLng, labelLat } = feature.properties as { labelLng: number; labelLat: number };
        expect(typeof labelLng).toBe('number');
        expect(typeof labelLat).toBe('number');
        expect(labelLng).toBeGreaterThanOrEqual(LNG_MIN);
        expect(labelLng).toBeLessThanOrEqual(LNG_MAX);
        expect(labelLat).toBeGreaterThanOrEqual(LAT_MIN);
        expect(labelLat).toBeLessThanOrEqual(LAT_MAX);
      }
    });
  });

  describe('getFormationPolygons (convenience delegate)', () => {
    it('returns the same result as mockGeologyService.getFormationPolygons()', () => {
      const fromService = mockGeologyService.getFormationPolygons();
      const fromConvenience = getFormationPolygons();
      expect(fromService).toEqual(fromConvenience);
    });

    it('is deterministic across two calls', () => {
      const a = getFormationPolygons();
      const b = getFormationPolygons();
      expect(a).toEqual(b);
    });
  });
});
