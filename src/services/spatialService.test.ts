import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpatialSource,
  getStoredSpatialSourceId,
  setStoredSpatialSourceId,
  getAllSpatialSources,
} from './spatialService';
import type { ViewportBounds, SpatialLayerFilter } from '../types';
import { MOCK_WELLS } from '../constants';

beforeEach(() => {
  localStorage.clear();
});

describe('spatialService', () => {
  describe('mock source', () => {
    it('returns wells within bounding box', async () => {
      const source = getSpatialSource('mock');
      // Bounds that cover the Permian Basin cluster (center ~31.9, -102.3)
      const bounds: ViewportBounds = {
        sw_lat: 31.8,
        sw_lng: -102.5,
        ne_lat: 32.0,
        ne_lng: -102.1,
      };
      const result = await source.fetchViewportWells(bounds);
      expect(result.source).toBe('mock');
      expect(result.truncated).toBe(false);
      expect(result.wells.length).toBeGreaterThan(0);
      // Every returned well should be within bounds
      for (const w of result.wells) {
        expect(w.lat).toBeGreaterThanOrEqual(bounds.sw_lat);
        expect(w.lat).toBeLessThanOrEqual(bounds.ne_lat);
        expect(w.lng).toBeGreaterThanOrEqual(bounds.sw_lng);
        expect(w.lng).toBeLessThanOrEqual(bounds.ne_lng);
      }
    });

    it('returns empty array for bounds with no wells', async () => {
      const source = getSpatialSource('mock');
      const bounds: ViewportBounds = {
        sw_lat: 0,
        sw_lng: 0,
        ne_lat: 1,
        ne_lng: 1,
      };
      const result = await source.fetchViewportWells(bounds);
      expect(result.wells).toHaveLength(0);
      expect(result.total_count).toBe(0);
    });

    it('filters by status', async () => {
      const source = getSpatialSource('mock');
      const bounds: ViewportBounds = {
        sw_lat: 31.0,
        sw_lng: -103.0,
        ne_lat: 33.0,
        ne_lng: -101.0,
      };
      const filters: SpatialLayerFilter = { statuses: ['PRODUCING'] };
      const result = await source.fetchViewportWells(bounds, filters);
      expect(result.wells.length).toBeGreaterThan(0);
      for (const w of result.wells) {
        expect(w.status).toBe('PRODUCING');
      }
    });

    it('filters by operator', async () => {
      const source = getSpatialSource('mock');
      const bounds: ViewportBounds = {
        sw_lat: 31.0,
        sw_lng: -103.0,
        ne_lat: 33.0,
        ne_lng: -101.0,
      };
      const operator = MOCK_WELLS[0].operator;
      const filters: SpatialLayerFilter = { operators: [operator] };
      const result = await source.fetchViewportWells(bounds, filters);
      expect(result.wells.length).toBeGreaterThan(0);
      for (const w of result.wells) {
        expect(w.operator).toBe(operator);
      }
    });

    it('filters by formation', async () => {
      const source = getSpatialSource('mock');
      const bounds: ViewportBounds = {
        sw_lat: 31.0,
        sw_lng: -103.0,
        ne_lat: 33.0,
        ne_lng: -101.0,
      };
      const formation = MOCK_WELLS[0].formation;
      const filters: SpatialLayerFilter = { formations: [formation] };
      const result = await source.fetchViewportWells(bounds, filters);
      expect(result.wells.length).toBeGreaterThan(0);
      for (const w of result.wells) {
        expect(w.formation).toBe(formation);
      }
    });

    it('returns mock layers', async () => {
      const source = getSpatialSource('mock');
      const layers = await source.getAvailableLayers();
      expect(layers.length).toBe(4);
      expect(layers.map((l) => l.id)).toContain('producing');
      expect(layers.map((l) => l.id)).toContain('laterals');
    });
  });

  describe('source persistence', () => {
    it('defaults to mock', () => {
      expect(getStoredSpatialSourceId()).toBe('mock');
    });

    it('persists live selection', () => {
      setStoredSpatialSourceId('live');
      expect(getStoredSpatialSourceId()).toBe('live');
    });

    it('getSpatialSource respects stored id', () => {
      setStoredSpatialSourceId('live');
      expect(getSpatialSource().id).toBe('live');
    });

    it('getSpatialSource allows explicit override', () => {
      setStoredSpatialSourceId('live');
      expect(getSpatialSource('mock').id).toBe('mock');
    });
  });

  describe('getAllSpatialSources', () => {
    it('returns both sources', () => {
      const sources = getAllSpatialSources();
      expect(sources).toHaveLength(2);
      const ids = sources.map((s) => s.id);
      expect(ids).toContain('mock');
      expect(ids).toContain('live');
    });
  });
});
