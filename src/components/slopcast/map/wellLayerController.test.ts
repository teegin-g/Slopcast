import { describe, expect, it, vi } from 'vitest';
import {
  addWellSourceAndLayers,
  WELL_STATUS_LAYER_IDS,
  bindWellLayerEvents,
  buildWellColorExpression,
  buildStatusRadius,
  updateWellFeatureState,
} from './wellLayerController';

describe('buildStatusRadius', () => {
  it('produces a top-level interpolate (zoom never nested in case/*)', () => {
    const expr = buildStatusRadius([4, 7, 11], 1.25);
    expect(expr[0]).toBe('interpolate');
    const firstOutput = expr[4];
    expect(Array.isArray(firstOutput)).toBe(true);
    expect(firstOutput[0]).toBe('case');
  });

  it('selected stop output is base * multiplier', () => {
    const expr = buildStatusRadius([4, 7, 11], 1.25);
    const caseExpr = expr[4];
    expect(caseExpr[2]).toBeCloseTo(5); // 4 * 1.25
    expect(caseExpr[3]).toBe(4);
  });

  it('no array node anywhere is a zoom-interpolate inside a case', () => {
    const expr = buildStatusRadius([3, 5, 8], 1.25);
    const json = JSON.stringify(expr);
    const zoomCount = (json.match(/\["zoom"\]/g) || []).length;
    expect(zoomCount).toBe(1);
  });
});

describe('wellLayerController', () => {
  it('builds a property-based Mapbox expression for well colors', () => {
    const expr = buildWellColorExpression('#999');

    expect(expr).toEqual(['coalesce', ['get', 'groupColor'], '#999']);
  });

  it('adds the wells source with promoted feature ids for feature-state updates', () => {
    const addSource = vi.fn();
    const map = {
      getSource: vi.fn(() => null),
      addSource,
      getLayer: vi.fn(() => true),
    };

    addWellSourceAndLayers(map, { type: 'FeatureCollection', features: [] }, ['literal', '#fff'], {
      clusterColor: '#111',
      clusterTextColor: '#fff',
      wellLabelColor: '#fff',
      wellLabelHalo: '#000',
      unassignedFill: '#999',
      selectedStroke: '#0ff',
    });

    expect(addSource).toHaveBeenCalledWith('wells-source', expect.objectContaining({
      promoteId: 'id',
    }));
  });

  it('uses a tighter clustering handoff so individual wells appear earlier', () => {
    const addSource = vi.fn();
    const addLayer = vi.fn();
    const map = {
      getSource: vi.fn(() => null),
      addSource,
      getLayer: vi.fn(() => false),
      addLayer,
    };

    addWellSourceAndLayers(map, { type: 'FeatureCollection', features: [] }, ['literal', '#fff'], {
      clusterColor: '#111',
      clusterTextColor: '#fff',
      wellLabelColor: '#fff',
      wellLabelHalo: '#000',
      unassignedFill: '#999',
      selectedStroke: '#0ff',
    });

    expect(addSource).toHaveBeenCalledWith('wells-source', expect.objectContaining({
      clusterRadius: 72,
      clusterMaxZoom: 10,
    }));
    expect(addLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'wells-clusters',
      paint: expect.objectContaining({
        'circle-opacity': 0.45,
        'circle-stroke-opacity': 0.25,
      }),
    }));
  });

  it('updates selected, dimmed, and visible flags through feature state', () => {
    const setFeatureState = vi.fn();
    const map = { setFeatureState };
    const wells = [
      { id: 'a', name: 'A', lat: 0, lng: 0, lateralLength: 1, status: 'PRODUCING' as const, operator: 'A', formation: 'X' },
      { id: 'b', name: 'B', lat: 0, lng: 0, lateralLength: 1, status: 'DUC' as const, operator: 'A', formation: 'X' },
    ];

    updateWellFeatureState(
      map,
      wells,
      new Set(['a']),
      new Set(['b']),
      new Set(['a']),
    );

    expect(setFeatureState).toHaveBeenCalledWith(
      { source: 'wells-source', id: 'a' },
      { selected: true, dimmed: false, visible: true },
    );
    expect(setFeatureState).toHaveBeenCalledWith(
      { source: 'wells-source', id: 'b' },
      { selected: false, dimmed: true, visible: false },
    );
  });

  it('unregisters every handler it registers', () => {
    const on = vi.fn();
    const off = vi.fn();
    const map = {
      on,
      off,
      getCanvas: () => ({ style: {} }),
      queryRenderedFeatures: () => [],
      getSource: () => ({ getClusterExpansionZoom: vi.fn() }),
      easeTo: vi.fn(),
    };

    const cleanup = bindWellLayerEvents(map, {
      onWellClick: vi.fn(),
      onWellHover: vi.fn(),
      onWellLeave: vi.fn(),
      onMapEmptyClick: vi.fn(),
    });
    cleanup();

    expect(on).toHaveBeenCalledTimes(WELL_STATUS_LAYER_IDS.length * 4 + 4);
    expect(off).toHaveBeenCalledTimes(on.mock.calls.length);
  });
});
