import { describe, expect, it, vi } from 'vitest';
import {
  addWellSourceAndLayers,
  WELL_STATUS_LAYER_IDS,
  bindWellLayerEvents,
  buildWellColorExpression,
  buildStatusRadius,
  updateWellFeatureState,
  buildHeatColorExpression,
  addHeatLayer,
  removeHeatLayer,
  HEAT_SOURCE_ID,
  HEAT_LAYER_ID,
  addFormationLayer,
  removeFormationLayer,
  FORMATION_SOURCE_ID,
  FORMATION_FILL_LAYER_ID,
  FORMATION_LINE_LAYER_ID,
  FORMATION_LABEL_LAYER_ID,
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

// ---------------------------------------------------------------------------
// buildHeatColorExpression
// ---------------------------------------------------------------------------

describe('buildHeatColorExpression', () => {
  it('returns a top-level interpolate expression (not zoom-based)', () => {
    const expr = buildHeatColorExpression({ min: 0, max: 100 }) as unknown as unknown[];
    expect(expr[0]).toBe('interpolate');
  });

  it('interpolates on the data property npvPerAcre, not zoom', () => {
    const expr = buildHeatColorExpression({ min: 0, max: 100 }) as unknown as unknown[];
    // expr[2] is the input expression — must be ['get', 'npvPerAcre']
    const input = expr[2] as unknown[];
    expect(input[0]).toBe('get');
    expect(input[1]).toBe('npvPerAcre');
    // Must NOT be ['zoom']
    expect(input).not.toEqual(['zoom']);
  });

  it('contains zero zoom expressions (data-driven color, not zoom-driven)', () => {
    const expr = buildHeatColorExpression({ min: 10, max: 90 });
    const json = JSON.stringify(expr);
    const zoomCount = (json.match(/\["zoom"\]/g) ?? []).length;
    expect(zoomCount).toBe(0);
  });

  it('uses strictly ascending stops so Mapbox does not reject them (min < mid < max)', () => {
    const expr = buildHeatColorExpression({ min: 0, max: 100 }) as unknown as unknown[];
    // stops are at indices 3, 5, 7 (interpolate, method, input, stop0, color0, stop1, color1, stop2, color2)
    const stop0 = expr[3] as number;
    const stop1 = expr[5] as number;
    const stop2 = expr[7] as number;
    expect(stop0).toBeLessThan(stop1);
    expect(stop1).toBeLessThan(stop2);
  });

  it('guards min === max: produces strictly ascending stops (no Mapbox rejection)', () => {
    const expr = buildHeatColorExpression({ min: 5, max: 5 }) as unknown as unknown[];
    const stop0 = expr[3] as number;
    const stop2 = expr[7] as number;
    // After the guard, max is nudged to min + 1, so stops must still be ascending.
    expect(stop0).toBeLessThan(stop2);
    // All three stops are strictly increasing.
    const stop1 = expr[5] as number;
    expect(stop0).toBeLessThan(stop1);
    expect(stop1).toBeLessThan(stop2);
  });
});

// ---------------------------------------------------------------------------
// Fake-map helpers
// ---------------------------------------------------------------------------

/**
 * Minimal fake Mapbox map stub for idempotency tests.
 * Maintains internal source/layer registries so getSource / getLayer
 * return the registered object (truthy) after add, and null before.
 */
function makeFakeMap() {
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
  const layers = new Set<string>();

  return {
    // source API
    getSource: vi.fn((id: string) => sources.get(id) ?? null),
    addSource: vi.fn((id: string, _data: unknown) => {
      sources.set(id, { setData: vi.fn() });
    }),
    removeSource: vi.fn((id: string) => { sources.delete(id); }),
    // layer API
    getLayer: vi.fn((id: string) => (layers.has(id) ? {} : null)),
    addLayer: vi.fn((spec: { id: string }) => { layers.add(spec.id); }),
    removeLayer: vi.fn((id: string) => { layers.delete(id); }),
    // expose internals for assertions
    _sources: sources,
    _layers: layers,
  };
}

const STUB_WELLS = [
  { id: 'w1', name: 'Well 1', lat: 31.9, lng: -102.3, lateralLength: 10000, status: 'PRODUCING' as const, operator: 'Op', formation: 'Wolfcamp A' },
  { id: 'w2', name: 'Well 2', lat: 31.85, lng: -102.25, lateralLength: 7500, status: 'DUC' as const, operator: 'Op', formation: 'Wolfcamp B' },
];

const STUB_HEAT = {
  values: [
    { wellId: 'w1', npvPerAcre: 40 },
    { wellId: 'w2', npvPerAcre: 80 },
  ],
  domain: { min: 40, max: 80 },
};

// ---------------------------------------------------------------------------
// addHeatLayer / removeHeatLayer
// ---------------------------------------------------------------------------

describe('addHeatLayer', () => {
  it('calls addSource and addLayer exactly once on first call', () => {
    const map = makeFakeMap();
    addHeatLayer(map, STUB_WELLS, STUB_HEAT);

    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addSource).toHaveBeenCalledWith(HEAT_SOURCE_ID, expect.objectContaining({ type: 'geojson' }));
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: HEAT_LAYER_ID, type: 'circle' }));
  });

  it('is idempotent: second call uses setData, not addSource again', () => {
    const map = makeFakeMap();
    addHeatLayer(map, STUB_WELLS, STUB_HEAT);
    addHeatLayer(map, STUB_WELLS, STUB_HEAT);

    // addSource called only once (first call); second call hits setData path
    expect(map.addSource).toHaveBeenCalledTimes(1);
    const sourceStub = map._sources.get(HEAT_SOURCE_ID)!;
    expect(sourceStub.setData).toHaveBeenCalledTimes(1);
    // addLayer also called only once (layer exists on second call)
    expect(map.addLayer).toHaveBeenCalledTimes(1);
  });

  it('skips wells with no heat value or defaults them to 0 (no find-in-loop needed)', () => {
    const map = makeFakeMap();
    // Only w1 has a heat value; w2 is absent.
    const partialHeat = {
      values: [{ wellId: 'w1', npvPerAcre: 55 }],
      domain: { min: 55, max: 55 },
    };
    addHeatLayer(map, STUB_WELLS, partialHeat);

    // Verify addLayer was called (layer was added) — no throws from missing heat value.
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    const call = map.addSource.mock.calls[0]![1] as { data: { features: { properties: { npvPerAcre: number } }[] } };
    const w2Feature = call.data.features.find((_: unknown, i: number) => i === 1);
    expect((w2Feature as { properties: { npvPerAcre: number } }).properties.npvPerAcre).toBe(0);
  });
});

describe('removeHeatLayer', () => {
  it('removes layer and source when both exist', () => {
    const map = makeFakeMap();
    addHeatLayer(map, STUB_WELLS, STUB_HEAT);

    removeHeatLayer(map);

    expect(map.removeLayer).toHaveBeenCalledWith(HEAT_LAYER_ID);
    expect(map.removeSource).toHaveBeenCalledWith(HEAT_SOURCE_ID);
  });

  it('is a no-op (no throw) when nothing was added', () => {
    const map = makeFakeMap();
    expect(() => removeHeatLayer(map)).not.toThrow();
    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// addFormationLayer / removeFormationLayer
// ---------------------------------------------------------------------------

const STUB_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[-102.45, 31.93], [-102.15, 31.93], [-102.15, 32.0], [-102.45, 32.0], [-102.45, 31.93]]] },
      properties: { formation: 'Wolfcamp A', label: 'Wolfcamp A', labelLng: -102.3, labelLat: 31.965 },
    },
  ],
};

describe('addFormationLayer', () => {
  it('adds source and all 3 layers on first call', () => {
    const map = makeFakeMap();
    addFormationLayer(map, STUB_GEOJSON);

    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addSource).toHaveBeenCalledWith(FORMATION_SOURCE_ID, expect.objectContaining({ type: 'geojson' }));
    expect(map.addLayer).toHaveBeenCalledTimes(3);

    const layerIds = map.addLayer.mock.calls.map((c: [{ id: string }]) => c[0].id);
    expect(layerIds).toContain(FORMATION_FILL_LAYER_ID);
    expect(layerIds).toContain(FORMATION_LINE_LAYER_ID);
    expect(layerIds).toContain(FORMATION_LABEL_LAYER_ID);
  });

  it('is idempotent: second call uses setData, not addSource again, and does not re-add layers', () => {
    const map = makeFakeMap();
    addFormationLayer(map, STUB_GEOJSON);
    addFormationLayer(map, STUB_GEOJSON);

    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addLayer).toHaveBeenCalledTimes(3);
    const sourceStub = map._sources.get(FORMATION_SOURCE_ID)!;
    expect(sourceStub.setData).toHaveBeenCalledTimes(1);
  });

  it('fill layer uses fill type, line layer uses line type, label layer uses symbol type', () => {
    const map = makeFakeMap();
    addFormationLayer(map, STUB_GEOJSON);

    const calls = map.addLayer.mock.calls as [{ id: string; type: string }][];
    const byId = Object.fromEntries(calls.map((c) => [c[0].id, c[0].type]));
    expect(byId[FORMATION_FILL_LAYER_ID]).toBe('fill');
    expect(byId[FORMATION_LINE_LAYER_ID]).toBe('line');
    expect(byId[FORMATION_LABEL_LAYER_ID]).toBe('symbol');
  });
});

describe('removeFormationLayer', () => {
  it('removes all 3 layers and the source', () => {
    const map = makeFakeMap();
    addFormationLayer(map, STUB_GEOJSON);

    removeFormationLayer(map);

    expect(map.removeLayer).toHaveBeenCalledWith(FORMATION_FILL_LAYER_ID);
    expect(map.removeLayer).toHaveBeenCalledWith(FORMATION_LINE_LAYER_ID);
    expect(map.removeLayer).toHaveBeenCalledWith(FORMATION_LABEL_LAYER_ID);
    expect(map.removeSource).toHaveBeenCalledWith(FORMATION_SOURCE_ID);
  });

  it('is a no-op (no throw) when nothing was added', () => {
    const map = makeFakeMap();
    expect(() => removeFormationLayer(map)).not.toThrow();
    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });
});
