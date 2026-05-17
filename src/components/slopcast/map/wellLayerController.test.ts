import { describe, expect, it, vi } from 'vitest';
import {
  addWellSourceAndLayers,
  WELL_STATUS_LAYER_IDS,
  bindWellLayerEvents,
  buildWellColorExpression,
  updateWellFeatureState,
} from './wellLayerController';

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
